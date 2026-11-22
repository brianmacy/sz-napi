# /// script
# requires-python = ">=3.10"
# dependencies = ["mcp<2"]
# ///
"""sz-napi Project FAQ MCP Server — queryable FAQ for the Senzing Node.js SDK.

Uses BM25 (Okapi BM25) ranking for search relevance. No external
dependencies beyond the `mcp` package.
"""

import math
import os
import re
import sys
import threading
from pathlib import Path

try:
    from mcp.server.fastmcp import FastMCP
except ImportError:
    print(
        "ERROR: The 'mcp' package is not installed.\n"
        "\n"
        "This script is designed to be run via uv with PEP 723 inline metadata:\n"
        "    uv run --script .claude/faq_server.py\n"
        "\n"
        "If you don't have uv installed:\n"
        "    pip install uv   # or: brew install uv\n"
        "\n"
        "Alternatively, install the dependency manually:\n"
        "    pip install mcp\n"
        "    python .claude/faq_server.py",
        file=sys.stderr,
    )
    sys.exit(1)

FAQ_DIR = Path(__file__).parent / "faqs"

_K1 = 1.2
_B = 0.75

_TOKEN_RE = re.compile(r"[a-z0-9_]+")


def _tokenize(text: str) -> list[str]:
    return _TOKEN_RE.findall(text.lower())


class _Document:
    __slots__ = ("category", "content", "length", "tf", "title", "tokens")

    def __init__(self, category: str, title: str, content: str) -> None:
        self.category = category
        self.title = title
        self.content = content
        self.tokens = _tokenize(title + " " + content)
        self.length = len(self.tokens)
        self.tf: dict[str, int] = {}
        for tok in self.tokens:
            self.tf[tok] = self.tf.get(tok, 0) + 1


class _BM25Index:
    """BM25 index keyed by file path, maintained INCREMENTALLY.

    upsert()/remove() keep the document-frequency map (`df`), the running
    token-length sum, and `avgdl` in step with each single-file change, so a
    refresh after an edit costs O(changed files), not O(corpus). Scores are
    identical to a full rebuild: `df` are exact integer counts and
    `avgdl = _len_sum / n` is recomputed exactly (no float drift).
    """

    def __init__(self) -> None:
        self.by_path: dict[str, _Document] = {}
        self.df: dict[str, int] = {}
        self._len_sum: int = 0
        self.avgdl: float = 0.0

    def upsert(self, path: str, doc: _Document) -> None:
        self._remove(path)
        self.by_path[path] = doc
        self._len_sum += doc.length
        for term in doc.tf:  # unique terms of this document
            self.df[term] = self.df.get(term, 0) + 1
        self._recompute_avgdl()

    def remove(self, path: str) -> None:
        if self._remove(path):
            self._recompute_avgdl()

    def _remove(self, path: str) -> bool:
        doc = self.by_path.pop(path, None)
        if doc is None:
            return False
        self._len_sum -= doc.length
        for term in doc.tf:
            remaining = self.df.get(term, 0) - 1
            if remaining <= 0:
                self.df.pop(term, None)
            else:
                self.df[term] = remaining
        return True

    def _recompute_avgdl(self) -> None:
        n = len(self.by_path)
        self.avgdl = self._len_sum / n if n else 0.0

    def search(
        self,
        query: str,
        category: str | None = None,
        max_results: int = 5,
    ) -> list[tuple[_Document, float]]:
        terms = _tokenize(query)
        if not terms:
            return []
        n = len(self.by_path)
        scores: list[tuple[_Document, float]] = []
        for doc in self.by_path.values():
            if category and doc.category != category:
                continue
            score = 0.0
            for t in terms:
                df = self.df.get(t, 0)
                if df == 0:
                    continue
                idf = math.log((n - df + 0.5) / (df + 0.5) + 1.0)
                tf = doc.tf.get(t, 0)
                if tf == 0:
                    continue
                numerator = tf * (_K1 + 1.0)
                denominator = tf + _K1 * (
                    1.0 - _B + _B * doc.length / max(self.avgdl, 1.0)
                )
                score += idf * numerator / denominator
            if score > 0:
                scores.append((doc, score))
        # Deterministic, construction-order-independent ordering: rank by score,
        # break ties by (category, title). Without the tie-break, equal-scoring
        # results would order by dict-insertion order, which differs between an
        # incremental refresh and a full rebuild (and between edit histories).
        scores.sort(key=lambda x: (-x[1], x[0].category, x[0].title))
        return scores[:max_results]


_faqs: dict[str, dict[str, str]] = {}
_index = _BM25Index()
_fingerprint: dict[str, tuple[int, int]] = {}
_reindex_lock = threading.Lock()


def _scan_files() -> dict[str, tuple[int, int]]:
    """Cheap staleness fingerprint: {faq_file_path: (mtime_ns, size)}.

    Both come free from the single `stat` the scan already does. Pairing size
    with mtime catches an edit that lands within the filesystem's mtime
    granularity but changes the content length (the common case); the only
    residual miss is an edit with the SAME mtime tick AND the same byte size,
    which is the narrow inherent limit of any stat-based (no-content-hash) scan.
    """
    files: dict[str, tuple[int, int]] = {}
    if not FAQ_DIR.is_dir():
        return files
    for cat_entry in os.scandir(FAQ_DIR):
        if not cat_entry.is_dir(follow_symlinks=False):
            continue
        for file_entry in os.scandir(cat_entry.path):
            if file_entry.name.endswith(".md") and file_entry.is_file(
                follow_symlinks=False
            ):
                st = file_entry.stat()
                files[file_entry.path] = (st.st_mtime_ns, st.st_size)
    return files


def _cat_title_for(path: str) -> tuple[str, str]:
    p = Path(path)
    return p.parent.name, p.stem.replace("-", " ")


def _index_file(path: str) -> None:
    """(Re)read ONE FAQ file into _faqs + _index. Caller holds _reindex_lock."""
    category, title = _cat_title_for(path)
    content = Path(path).read_text(encoding="utf-8")
    _faqs.setdefault(category, {})[title] = content
    _index.upsert(path, _Document(category, title, content))


def _deindex_file(path: str) -> None:
    """Drop ONE FAQ file from _faqs + _index. Caller holds _reindex_lock."""
    category, title = _cat_title_for(path)
    _index.remove(path)
    cat = _faqs.get(category)
    if cat is not None:
        cat.pop(title, None)
        if not cat:
            _faqs.pop(category, None)


def _load_faqs() -> None:
    """Full rebuild from scratch (startup)."""
    global _faqs, _index, _fingerprint
    _faqs = {}
    _index = _BM25Index()
    current = _scan_files()
    for path in current:
        _index_file(path)
    _fingerprint = current


def _refresh_if_stale() -> None:
    """Incrementally reindex ONLY changed files, synchronously, before serving.

    Called at the START of every tool request so the current response always
    reflects the latest on-disk FAQs — a just-created / edited / deleted FAQ is
    visible on the FIRST query that touches it. (The earlier design reindexed on
    a background thread AFTER the response, so the first such query served stale
    data.) When nothing changed the cost is one cheap mtime scan; when something
    did, only the added/modified/removed files are re-read and patched into the
    BM25 index (df/avgdl maintained incrementally) — O(changed files), not
    O(corpus), so this never becomes a multi-second synchronous pause as the FAQ
    set grows. The blocking lock makes concurrent callers wait for an in-flight
    reindex rather than serve stale data.
    """
    global _fingerprint
    with _reindex_lock:
        current = _scan_files()
        if current == _fingerprint:
            return
        previous = _fingerprint
        for path in previous.keys() - current.keys():
            _deindex_file(path)
        for path, mtime in current.items():
            if previous.get(path) != mtime:
                _index_file(path)
        _fingerprint = current


_load_faqs()

_IMPROVEMENT_FOOTER = (
    "\n\n---\n"
    "*If this FAQ is incomplete, unclear, outdated, or could be improved, "
    "please suggest specific improvements to the user (e.g., missing details, "
    "better examples, corrections). Help keep these FAQs accurate and useful.*"
)


mcp = FastMCP(
    "sz-napi-faq",
    instructions=(
        "Senzing Node.js SDK project FAQ. Consult these tools BEFORE making decisions about "
        "NAPI-RS patterns, Senzing runtime paths, build/test procedures, platform targets, "
        "error handling, BigInt flags, or the two-package architecture. "
        "Also covers the generated SzFlags table (scripts/codegen-flags.mjs, the "
        "codegen:flags / codegen:flags:check npm scripts, and the CI drift gate) and "
        "release packaging of the pure-JS @senzing/types and @senzing/trpc tarballs "
        "(npm pack, --ignore-scripts, optional peer dependency, tsup DTS output). "
        "Consult it before regenerating package-lock.json: a physical npm install "
        "prunes cross-platform optional dependencies and breaks CI -- see "
        "lockfile-maintenance. "
        "Also covers SzLogging (native-owned state, non-blocking ThreadsafeFunction, maxQueued/getDropped, "
        "weak registrations, SZ_LOG_REGISTRATION_COLLECTED), the version = minimum Senzing rule, and the "
        "typedoc minimatch-11 postinstall patch (scripts/patch-typedoc.mjs). "
        "If FAQ search returns no useful results, TELL THE USER and recommend adding a FAQ."
    ),
)


@mcp.tool()
def get_faq_categories() -> str:
    """List all FAQ categories with the number of articles in each."""
    _refresh_if_stale()
    if not _faqs:
        return "No FAQ categories found. Ensure .claude/faqs/ contains category directories with .md files."
    lines = []
    for cat in sorted(_faqs):
        count = len(_faqs[cat])
        titles = ", ".join(sorted(_faqs[cat]))
        lines.append(f"**{cat}** ({count}): {titles}")
    result = "\n".join(lines)
    return result


@mcp.tool()
def search_faqs(query: str, category: str | None = None, max_results: int = 5) -> str:
    """Search FAQs using BM25 ranking. Returns titles + matching excerpts.

    Args:
        query: keyword(s) to search for
        category: optional category filter
        max_results: max results to return (default 5)
    """
    _refresh_if_stale()
    results = _index.search(query, category=category, max_results=max_results)
    if not results:
        return f"No results for '{query}'."

    lines = []
    for doc, score in results:
        query_lower = query.lower()
        content_lower = doc.content.lower()
        idx = content_lower.find(query_lower)
        matched_len = len(query)
        if idx < 0:
            for term in _tokenize(query):
                idx = content_lower.find(term)
                if idx >= 0:
                    matched_len = len(term)
                    break
        if idx >= 0:
            start = max(0, idx - 80)
            end = min(len(doc.content), idx + matched_len + 120)
            excerpt = (
                ("..." if start > 0 else "")
                + doc.content[start:end].strip()
                + ("..." if end < len(doc.content) else "")
            )
        else:
            excerpt = doc.content[:200].strip() + (
                "..." if len(doc.content) > 200 else ""
            )
        lines.append(
            f"### [{doc.category}] {doc.title} (score: {score:.2f})\n{excerpt}\n"
        )
    result = "\n".join(lines) + _IMPROVEMENT_FOOTER
    return result


@mcp.tool()
def get_faq(title: str, category: str | None = None) -> str:
    """Get full content of a specific FAQ by title.

    Args:
        title: FAQ title (use dashes or spaces, case-insensitive)
        category: optional category to narrow the search
    """
    _refresh_if_stale()
    title_normalized = title.lower().replace("-", " ")

    cats = [category] if category and category in _faqs else sorted(_faqs)
    for cat in cats:
        for faq_title, content in _faqs.get(cat, {}).items():
            if faq_title.lower() == title_normalized:
                return f"# [{cat}] {faq_title}\n\n{content}" + _IMPROVEMENT_FOOTER

    for cat in cats:
        for faq_title, content in _faqs.get(cat, {}).items():
            if (
                title_normalized in faq_title.lower()
                or faq_title.lower() in title_normalized
            ):
                return f"# [{cat}] {faq_title}\n\n{content}" + _IMPROVEMENT_FOOTER

    return f"FAQ '{title}' not found. Use get_faq_categories() to see available FAQs."


if __name__ == "__main__":
    mcp.run()

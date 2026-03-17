/**
 * Renderer Script
 *
 * Handles DOM events and communicates with the main process via the
 * preload bridge (senzing). No Node.js APIs are used here.
 */

// Type declaration for the preload bridge.
// This file is a plain script (not a module) so it runs in the browser context.
interface SenzingBridge {
  getVersion: () => Promise<Record<string, string>>;
  addRecord: (
    dataSourceCode: string,
    recordId: string,
    recordDefinition: string
  ) => Promise<Record<string, unknown> | null>;
  searchByAttributes: (
    attributes: string
  ) => Promise<Record<string, unknown>>;
  loadTruthset: () => Promise<{ loaded: number; errors: number; elapsed: number }>;
  onLoadProgress: (
    callback: (progress: { loaded: number; total: number; errors: number }) => void
  ) => void;
}

declare const senzing: SenzingBridge;

// -- DOM elements -------------------------------------------------------------

const versionDisplay = document.getElementById("version-display") as HTMLElement;
const addRecordForm = document.getElementById("add-record-form") as HTMLFormElement;
const dataSourceInput = document.getElementById("data-source") as HTMLInputElement;
const recordIdInput = document.getElementById("record-id") as HTMLInputElement;
const nameInput = document.getElementById("record-name") as HTMLInputElement;
const dobInput = document.getElementById("record-dob") as HTMLInputElement;
const addressInput = document.getElementById("record-address") as HTMLInputElement;
const addRecordStatus = document.getElementById("add-record-status") as HTMLElement;

const loadTruthsetBtn = document.getElementById("load-truthset-btn") as HTMLButtonElement;
const loadProgress = document.getElementById("load-progress") as HTMLElement;

const searchForm = document.getElementById("search-form") as HTMLFormElement;
const searchNameInput = document.getElementById("search-name") as HTMLInputElement;
const searchResults = document.getElementById("search-results") as HTMLElement;

// -- Version display ----------------------------------------------------------

async function loadVersion(): Promise<void> {
  try {
    const version = await senzing.getVersion();
    versionDisplay.innerHTML =
      `<strong>Senzing SDK</strong> v${version.VERSION} ` +
      `<span class="muted">(build ${version.BUILD_DATE})</span>`;
  } catch (err) {
    versionDisplay.textContent = `Error loading version: ${err}`;
    versionDisplay.classList.add("error");
  }
}

// -- Add record ---------------------------------------------------------------

addRecordForm.addEventListener("submit", async (e: Event) => {
  e.preventDefault();
  addRecordStatus.textContent = "Adding record...";
  addRecordStatus.className = "status";

  const dataSourceCode = dataSourceInput.value.trim();
  const recordId = recordIdInput.value.trim();
  const attributes: Record<string, string> = {};

  if (nameInput.value.trim()) attributes.NAME_FULL = nameInput.value.trim();
  if (dobInput.value.trim()) attributes.DATE_OF_BIRTH = dobInput.value.trim();
  if (addressInput.value.trim()) attributes.ADDR_FULL = addressInput.value.trim();

  try {
    const result = await senzing.addRecord(
      dataSourceCode,
      recordId,
      JSON.stringify(attributes)
    );
    addRecordStatus.textContent = `Record ${dataSourceCode}/${recordId} added successfully.`;
    addRecordStatus.classList.add("success");
    if (result) {
      addRecordStatus.textContent += ` Entity ID: ${(result as any).ENTITY_ID ?? "N/A"}`;
    }
  } catch (err) {
    addRecordStatus.textContent = `Error: ${err}`;
    addRecordStatus.classList.add("error");
  }
});

// -- Load truthset ------------------------------------------------------------

senzing.onLoadProgress((progress) => {
  loadProgress.textContent = `Loading... ${progress.loaded}/${progress.total} records (${progress.errors} errors)`;
  loadProgress.className = "status";
});

loadTruthsetBtn.addEventListener("click", async () => {
  loadTruthsetBtn.disabled = true;
  loadProgress.textContent = "Downloading truthset files...";
  loadProgress.className = "status";

  try {
    const result = await senzing.loadTruthset();
    loadProgress.textContent = `Loaded ${result.loaded} records in ${result.elapsed.toFixed(1)}s (${result.errors} errors)`;
    loadProgress.classList.add("success");
  } catch (err) {
    loadProgress.textContent = `Error: ${err}`;
    loadProgress.classList.add("error");
  } finally {
    loadTruthsetBtn.disabled = false;
  }
});

// -- Search -------------------------------------------------------------------

searchForm.addEventListener("submit", async (e: Event) => {
  e.preventDefault();
  searchResults.textContent = "Searching...";
  searchResults.className = "results";

  const searchName = searchNameInput.value.trim();
  if (!searchName) {
    searchResults.textContent = "Please enter a name to search.";
    return;
  }

  const attributes = JSON.stringify({ NAME_FULL: searchName });

  try {
    const result = await senzing.searchByAttributes(attributes);
    const entities = (result as any).RESOLVED_ENTITIES ?? [];

    if (entities.length === 0) {
      searchResults.textContent = "No matching entities found.";
      return;
    }

    searchResults.innerHTML = `<strong>Found ${entities.length} matching entit${entities.length === 1 ? "y" : "ies"}:</strong>`;

    for (const match of entities) {
      const entity = match.ENTITY?.RESOLVED_ENTITY;
      const matchInfo = match.MATCH_INFO;
      const recordSummary = entity?.RECORD_SUMMARY ?? [];
      const totalRecords = recordSummary.reduce(
        (sum: number, ds: any) => sum + (ds.RECORD_COUNT ?? 0), 0
      );
      const dsSummary = recordSummary
        .map((ds: any) => `${ds.DATA_SOURCE}: ${ds.RECORD_COUNT}`)
        .join(", ");
      const div = document.createElement("div");
      div.className = "entity-card";
      div.innerHTML =
        `<div class="entity-id">Entity ID: ${entity?.ENTITY_ID ?? "N/A"}</div>` +
        `<div>Name: ${entity?.ENTITY_NAME ?? "N/A"}</div>` +
        `<div>Records: ${totalRecords}${dsSummary ? ` (${dsSummary})` : ""}</div>` +
        `<div class="muted">Match key: ${matchInfo?.MATCH_KEY ?? "N/A"}</div>`;
      searchResults.appendChild(div);
    }
  } catch (err) {
    searchResults.textContent = `Error: ${err}`;
    searchResults.classList.add("error");
  }
});

// -- Initialize ---------------------------------------------------------------

loadVersion();

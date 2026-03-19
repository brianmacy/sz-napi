/**
 * Renderer — handles DOM events, calls window.senzing (exposed by @senzing/electron preload).
 *
 * No Node.js APIs — runs in the browser context.
 * Truthset is loaded on the main process at startup, so we just display
 * version info and provide add-record / search functionality.
 */

declare const senzing: {
  engine: {
    addRecord(dataSourceCode: string, recordId: string, recordDefinition: string, flags?: bigint): Promise<any>;
    searchByAttributes(attributes: string, searchProfile?: string, flags?: bigint): Promise<any>;
  };
  product: {
    getVersion(): Promise<any>;
    getLicense(): Promise<any>;
  };
  flags: Readonly<Record<string, bigint>>;
};

// -- DOM elements -------------------------------------------------------------

const versionDisplay = document.getElementById("version-display") as HTMLElement;
const addRecordForm = document.getElementById("add-record-form") as HTMLFormElement;
const dataSourceInput = document.getElementById("data-source") as HTMLInputElement;
const recordIdInput = document.getElementById("record-id") as HTMLInputElement;
const nameInput = document.getElementById("record-name") as HTMLInputElement;
const dobInput = document.getElementById("record-dob") as HTMLInputElement;
const addressInput = document.getElementById("record-address") as HTMLInputElement;
const addRecordStatus = document.getElementById("add-record-status") as HTMLElement;

const searchForm = document.getElementById("search-form") as HTMLFormElement;
const searchNameInput = document.getElementById("search-name") as HTMLInputElement;
const searchResults = document.getElementById("search-results") as HTMLElement;

// -- Version display ----------------------------------------------------------

async function loadVersion(): Promise<void> {
  try {
    const version = await senzing.product.getVersion();
    const parsed = typeof version === "string" ? JSON.parse(version) : version;
    versionDisplay.innerHTML =
      `<strong>Senzing SDK</strong> v${parsed.VERSION} ` +
      `<span class="muted">(build ${parsed.BUILD_DATE})</span>`;
  } catch (err) {
    versionDisplay.textContent = `Error loading version: ${err}`;
  }
}

// -- Add record ---------------------------------------------------------------

addRecordForm.addEventListener("submit", async (e: Event) => {
  e.preventDefault();
  addRecordStatus.textContent = "Adding record...";
  addRecordStatus.className = "status";

  const dataSourceCode = dataSourceInput.value.trim();
  const recordId = recordIdInput.value.trim();
  const attrs: Record<string, string> = {};

  if (nameInput.value.trim()) attrs.NAME_FULL = nameInput.value.trim();
  if (dobInput.value.trim()) attrs.DATE_OF_BIRTH = dobInput.value.trim();
  if (addressInput.value.trim()) attrs.ADDR_FULL = addressInput.value.trim();

  try {
    const result = await senzing.engine.addRecord(
      dataSourceCode,
      recordId,
      JSON.stringify(attrs),
      senzing.flags.SZ_WITH_INFO,
    );
    const parsed = typeof result === "string" ? JSON.parse(result) : result;
    addRecordStatus.textContent = `Record ${dataSourceCode}/${recordId} added.`;
    addRecordStatus.classList.add("success");
    if (parsed?.ENTITY_ID) {
      addRecordStatus.textContent += ` Entity ID: ${parsed.ENTITY_ID}`;
    }
  } catch (err) {
    addRecordStatus.textContent = `Error: ${err}`;
    addRecordStatus.classList.add("error");
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

  try {
    const result = await senzing.engine.searchByAttributes(
      JSON.stringify({ NAME_FULL: searchName }),
    );
    const parsed = typeof result === "string" ? JSON.parse(result) : result;
    const entities = parsed.RESOLVED_ENTITIES ?? [];

    if (entities.length === 0) {
      searchResults.textContent = "No matching entities found.";
      return;
    }

    searchResults.innerHTML =
      `<strong>Found ${entities.length} matching entit${entities.length === 1 ? "y" : "ies"}:</strong>`;

    for (const match of entities) {
      const entity = match.ENTITY?.RESOLVED_ENTITY;
      const matchInfo = match.MATCH_INFO;
      const recordSummary = entity?.RECORD_SUMMARY ?? [];
      const totalRecords = recordSummary.reduce(
        (sum: number, ds: any) => sum + (ds.RECORD_COUNT ?? 0), 0,
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
  }
});

// -- Initialize ---------------------------------------------------------------

loadVersion();

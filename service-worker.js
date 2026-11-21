const DEFAULT_SITES = ["dailycamera.com", "denverpost.com"];
const CONTENT_SCRIPT_IDS = [
  "e-edition-cleanup-styles",
  "e-edition-cleanup-script",
];

const isValidHostname = (hostname) =>
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(
    hostname,
  );

const sitePattern = (hostname) => `*://*.${hostname}/*`;

const updateRegisteredContentScript = async () => {
  const { sites = DEFAULT_SITES } = await chrome.storage.sync.get("sites");
  const hostnames = Array.isArray(sites)
    ? [...new Set(sites.filter(isValidHostname))]
    : [];
  const permittedHostnames = [];

  for (const hostname of hostnames) {
    const hasPermission = await chrome.permissions.contains({
      origins: [sitePattern(hostname)],
    });
    if (hasPermission) {
      permittedHostnames.push(hostname);
    }
  }

  const existing = await chrome.scripting.getRegisteredContentScripts({
    ids: CONTENT_SCRIPT_IDS,
  });
  if (existing.length) {
    await chrome.scripting.unregisterContentScripts({
      ids: existing.map((script) => script.id),
    });
  }

  const matches = permittedHostnames.map(sitePattern);
  if (matches.length) {
    await chrome.scripting.registerContentScripts([
      {
        id: CONTENT_SCRIPT_IDS[0],
        matches,
        css: ["styles.css"],
        runAt: "document_start",
        persistAcrossSessions: true,
      },
      {
        id: CONTENT_SCRIPT_IDS[1],
        matches,
        js: ["content.js"],
        runAt: "document_idle",
        persistAcrossSessions: true,
      },
    ]);
  }
};

let updateQueue = Promise.resolve();
const scheduleContentScriptUpdate = () => {
  updateQueue = updateQueue
    .then(updateRegisteredContentScript)
    .catch((error) => {
      console.error("E-edition Cleanup could not update its site access.", error);
    });
  return updateQueue;
};

chrome.runtime.onInstalled.addListener(async () => {
  try {
    const { sites } = await chrome.storage.sync.get("sites");
    if (!Array.isArray(sites)) {
      await chrome.storage.sync.set({ sites: DEFAULT_SITES });
    }
    await scheduleContentScriptUpdate();
  } catch (error) {
    console.error("E-edition Cleanup could not initialize its site list.", error);
  }
});

chrome.runtime.onStartup.addListener(scheduleContentScriptUpdate);

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "sync" && changes.sites) {
    void scheduleContentScriptUpdate();
  }
});

void scheduleContentScriptUpdate();

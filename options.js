const DEFAULT_SITES = ["dailycamera.com", "denverpost.com"];
const form = document.querySelector("#site-form");
const sitesInput = document.querySelector("#sites");
const status = document.querySelector("#status");

const patternFor = (hostname) => `*://*.${hostname}/*`;

const parseHostnames = (value) => {
  const hostnames = [];
  for (const line of value.split(/\r?\n/)) {
    const hostname = line.trim().toLowerCase().replace(/\.$/, "");
    if (!hostname) {
      continue;
    }
    if (
      hostname.length > 253 ||
      !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(
        hostname,
      )
    ) {
      throw new Error(`"${line.trim()}" is not a valid hostname.`);
    }
    if (!hostnames.includes(hostname)) {
      hostnames.push(hostname);
    }
  }
  return hostnames;
};

const loadSites = async () => {
  try {
    const { sites } = await chrome.storage.sync.get("sites");
    sitesInput.value = (Array.isArray(sites) ? sites : DEFAULT_SITES).join("\n");
  } catch (error) {
    status.textContent = "Could not load the saved site list.";
    console.error("E-edition Cleanup could not load its settings.", error);
  }
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  status.textContent = "";

  try {
    const sites = parseHostnames(sitesInput.value);
    const additionalSitePermissions = sites
      .filter(
        (hostname) =>
          !DEFAULT_SITES.some(
            (defaultSite) =>
              hostname === defaultSite ||
              hostname.endsWith(`.${defaultSite}`),
          ),
      )
      .map(patternFor);
    if (
      additionalSitePermissions.length &&
      !(await chrome.permissions.request({
        origins: additionalSitePermissions,
      }))
    ) {
      status.textContent =
        "Site access was not granted. Your saved site list was not changed.";
      return;
    }

    await chrome.storage.sync.set({ sites });
    status.textContent = "Sites saved. Reload open e-edition tabs to apply.";
  } catch (error) {
    status.textContent = error.message || "Could not save the site list.";
    console.error("E-edition Cleanup could not save its settings.", error);
  }
});

void loadSites();

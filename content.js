const navigation = 'nav[aria-label="Content navigation"]';

const closeSelectedTab = () => {
  const selectedTab = document.querySelector(
    `${navigation} button[aria-pressed="true"]`,
  );

  if (!selectedTab) {
    return false;
  }

  selectedTab.click();
  return true;
};

if (!closeSelectedTab()) {
  const observer = new MutationObserver(() => {
    if (closeSelectedTab()) {
      observer.disconnect();
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["aria-pressed"],
    childList: true,
    subtree: true,
  });

  setTimeout(() => observer.disconnect(), 15_000);
}

const copyButtonId = "e-edition-cleanup-copy-story";
const copyButtonLabel = "Copy story and photos";
const copyIcon =
  '<svg class="w-6 h-6 text-gray-800 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2" stroke-width="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke-width="2"></path></svg>';
const copiedIcon =
  '<svg class="w-6 h-6 text-green-700 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>';

const setCopyStatus = (button, copied) => {
  button.title = copied ? "Story copied" : copyButtonLabel;
  button.setAttribute("aria-label", button.title);
  button.innerHTML = copied ? copiedIcon : copyIcon;

  if (copied) {
    setTimeout(() => {
      if (button.isConnected) {
        setCopyStatus(button, false);
      }
    }, 1800);
  }
};

const copyActiveStory = async (button) => {
  const frame = document.querySelector(
    "ps-page-view.swiper-slide-active iframe.html-iframe",
  );
  const frameDocument = frame?.contentDocument;
  const story = frameDocument?.querySelector(".innerContainer");

  if (!story) {
    throw new Error("The active story text is unavailable.");
  }

  const copy = story.cloneNode(true);
  copy.querySelectorAll("button").forEach((element) => element.remove());

  const originalImages = [...story.querySelectorAll("img")];
  const copiedImages = [...copy.querySelectorAll("img")];
  copiedImages.forEach((image, index) => {
    const original = originalImages[index];
    const source =
      original.currentSrc ||
      original.getAttribute("src") ||
      original.getAttribute("data-src");

    if (!source) {
      image.remove();
      return;
    }

    const absoluteSource = new URL(source, frameDocument.baseURI).href;
    if (absoluteSource === location.href && original.naturalWidth === 0) {
      image.remove();
      return;
    }

    image.src = absoluteSource;
    image.removeAttribute("srcset");
    image.removeAttribute("loading");
  });

  const text = copy.innerText.trim();
  if (!text) {
    throw new Error("The active story contains no copyable text.");
  }

  const html = `<html><body>${copy.outerHTML}</body></html>`;
  const item = new ClipboardItem({
    "text/html": new Blob([html], { type: "text/html" }),
    "text/plain": new Blob([text], { type: "text/plain" }),
  });

  if (!navigator.clipboard?.write) {
    throw new Error("Clipboard writing is unavailable in this browser.");
  }

  await navigator.clipboard.write([item]);
  setCopyStatus(button, true);
};

const addCopyButton = () => {
  const closeButton = document.querySelector(
    'button[aria-label="Close Article"]',
  );
  const existingButton = document.getElementById(copyButtonId);

  if (!closeButton) {
    existingButton?.remove();
    return;
  }

  if (existingButton) {
    return;
  }

  const button = closeButton.cloneNode(false);
  button.id = copyButtonId;
  button.title = copyButtonLabel;
  button.setAttribute("aria-label", copyButtonLabel);
  button.style.right = "4.5rem";
  button.innerHTML = copyIcon;
  button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      await copyActiveStory(button);
    } catch (error) {
      console.error("E-edition Cleanup could not copy the story.", error);
      button.title = "Copy failed";
      button.setAttribute("aria-label", "Copy failed");
    } finally {
      button.disabled = false;
    }
  });

  closeButton.before(button);
};

const articleOverlayObserver = new MutationObserver(addCopyButton);
articleOverlayObserver.observe(
  document.querySelector("#main-content") || document.documentElement,
  { childList: true, subtree: true },
);
addCopyButton();

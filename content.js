const STORAGE_KEY = "defaultPlaybackRate";
const DEFAULT_SPEED = 1;

let desiredPlaybackRate = DEFAULT_SPEED;
const trackedVideos = new WeakSet();
const applyingVideos = new WeakSet();
let scanQueued = false;

function isHtmlVideoElement(node) {
  return typeof HTMLVideoElement !== "undefined" && node instanceof HTMLVideoElement;
}

function withManagedApply(video, callback) {
  applyingVideos.add(video);

  try {
    callback();
  } finally {
    queueMicrotask(() => {
      applyingVideos.delete(video);
    });
  }
}

function applyPlaybackRate(video) {
  if (!isHtmlVideoElement(video)) {
    return;
  }

  if (video.playbackRate === desiredPlaybackRate) {
    return;
  }

  withManagedApply(video, () => {
    video.playbackRate = desiredPlaybackRate;
    video.defaultPlaybackRate = desiredPlaybackRate;
  });
}

function handleRateChange(event) {
  const video = event.currentTarget;

  if (!isHtmlVideoElement(video) || applyingVideos.has(video)) {
    return;
  }

  if (video.playbackRate !== desiredPlaybackRate) {
    applyPlaybackRate(video);
  }
}

function registerVideo(video) {
  if (!isHtmlVideoElement(video) || trackedVideos.has(video)) {
    return;
  }

  trackedVideos.add(video);
  video.addEventListener("play", () => applyPlaybackRate(video));
  video.addEventListener("playing", () => applyPlaybackRate(video));
  video.addEventListener("loadedmetadata", () => applyPlaybackRate(video));
  video.addEventListener("ratechange", handleRateChange);
}

function syncVideo(video) {
  if (!isHtmlVideoElement(video)) {
    return;
  }

  registerVideo(video);
  applyPlaybackRate(video);
}

function collectVideos(root, videos) {
  if (!root) {
    return;
  }

  if (isHtmlVideoElement(root)) {
    videos.push(root);
    return;
  }

  if (!(root instanceof Element) && root !== document && root !== document.documentElement) {
    return;
  }

  const foundVideos =
    root === document
      ? document.querySelectorAll("video")
      : root.querySelectorAll?.("video");

  if (!foundVideos) {
    return;
  }

  for (const video of foundVideos) {
    videos.push(video);
  }
}

function scanForVideos(root = document) {
  const videos = [];

  collectVideos(root, videos);

  for (const video of videos) {
    syncVideo(video);
  }
}

function queueFullScan() {
  if (scanQueued) {
    return;
  }

  scanQueued = true;
  queueMicrotask(() => {
    scanQueued = false;
    scanForVideos();
  });
}

function loadPlaybackRate(callback) {
  chrome.storage.sync.get({ [STORAGE_KEY]: DEFAULT_SPEED }, (result) => {
    const storedValue = Number(result[STORAGE_KEY]);
    desiredPlaybackRate = Number.isFinite(storedValue) ? storedValue : DEFAULT_SPEED;
    callback();
  });
}

function observePage() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        scanForVideos(node);
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== "DEFAULT_SPEED_UPDATED") {
    return;
  }

  if (typeof message.playbackRate === "number" && Number.isFinite(message.playbackRate)) {
    desiredPlaybackRate = message.playbackRate;
    queueFullScan();
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "sync" || !changes[STORAGE_KEY]) {
    return;
  }

  const updatedValue = Number(changes[STORAGE_KEY].newValue);

  if (Number.isFinite(updatedValue)) {
    desiredPlaybackRate = updatedValue;
    queueFullScan();
  }
});

loadPlaybackRate(() => {
  scanForVideos();
  observePage();
});

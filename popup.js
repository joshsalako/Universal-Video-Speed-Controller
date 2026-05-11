const STORAGE_KEY = "defaultPlaybackRate";
const MIN_SPEED = 0.25;
const MAX_SPEED = 4;
const SPEED_STEP = 0.25;
const DEFAULT_SPEED = "1";

const speedInput = document.getElementById("speed-input");
const saveButton = document.getElementById("save-button");
const statusMessage = document.getElementById("status-message");

function setStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = "popup__status";

  if (type) {
    statusMessage.classList.add(`is-${type}`);
  }
}

function normalizeSpeed(value) {
  const parsedValue = Number.parseFloat(String(value).trim());

  if (!Number.isFinite(parsedValue)) {
    return null;
  }

  if (parsedValue < MIN_SPEED || parsedValue > MAX_SPEED) {
    return null;
  }

  const stepUnits = Math.round(parsedValue / SPEED_STEP);

  if (Math.abs(stepUnits * SPEED_STEP - parsedValue) > 0.000001) {
    return null;
  }

  return String(Number(parsedValue.toFixed(2)));
}

function loadSavedSpeed() {
  chrome.storage.sync.get({ [STORAGE_KEY]: DEFAULT_SPEED }, (result) => {
    speedInput.value = String(result[STORAGE_KEY] ?? DEFAULT_SPEED);
  });
}

function notifyOpenTabs(playbackRate) {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (!tab.id) {
        continue;
      }

      chrome.tabs.sendMessage(
        tab.id,
        {
          type: "DEFAULT_SPEED_UPDATED",
          playbackRate
        },
        () => chrome.runtime.lastError
      );
    }
  });
}

function saveSpeed() {
  const normalizedSpeed = normalizeSpeed(speedInput.value);

  if (!normalizedSpeed) {
    setStatus("Use a value from 0.25 to 4 in 0.25 steps", "error");
    return;
  }

  chrome.storage.sync.set({ [STORAGE_KEY]: normalizedSpeed }, () => {
    speedInput.value = normalizedSpeed;
    setStatus("Saved", "success");
    notifyOpenTabs(Number(normalizedSpeed));
  });
}

saveButton.addEventListener("click", saveSpeed);

speedInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    saveSpeed();
  }
});

speedInput.addEventListener("input", () => {
  if (statusMessage.textContent) {
    setStatus("");
  }
});

loadSavedSpeed();

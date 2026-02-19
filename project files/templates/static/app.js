const API_BASE = window.location.origin;

const apiStatus = document.getElementById("apiStatus");
const predictForm = document.getElementById("predictForm");
const submitBtn = document.getElementById("submitBtn");
const resultSection = document.getElementById("resultSection");
const resultVisual = document.getElementById("resultVisual");
const resultImgRain = document.getElementById("resultImgRain");
const resultImgSun = document.getElementById("resultImgSun");
const resultPercent = document.getElementById("resultPercent");
const resultValue = document.getElementById("resultValue");
const resultProbability = document.getElementById("resultProbability");
const intensityBadge = document.getElementById("intensityBadge");
const intensitySuggestion = document.getElementById("intensitySuggestion");
const agriList = document.getElementById("agriList");
const errorBox = document.getElementById("errorBox");

const SUGGESTIONS_RAIN_YES = [
  { text: "Delay irrigation", icon: "/static/images/icons/irrigation.svg" },
  { text: "Avoid pesticide spraying", icon: "/static/images/icons/pesticide.svg" },
  { text: "Cover harvested crops", icon: "/static/images/icons/cover-crops.svg" },
  { text: "Improve drainage system", icon: "/static/images/icons/drainage.svg" },
  { text: "Postpone fertilizer application", icon: "/static/images/icons/fertilizer.svg" },
  { text: "Avoid harvesting today", icon: "/static/images/icons/harvesting.svg" },
];

const SUGGESTIONS_RAIN_NO = [
  { text: "Proceed with irrigation", icon: "/static/images/icons/irrigation.svg" },
  { text: "Apply fertilizers", icon: "/static/images/icons/fertilizer.svg" },
  { text: "Schedule harvesting", icon: "/static/images/icons/harvesting.svg" },
  { text: "Prepare land for sowing", icon: "/static/images/icons/sowing.svg" },
];

function setStatus(ok, msg) {
  apiStatus.textContent = msg;
  apiStatus.classList.remove("ok", "err");
  apiStatus.classList.add(ok ? "ok" : "err");
}

async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    const data = await res.json();
    if (data.model_loaded) {
      setStatus(true, "Model loaded");
    } else {
      setStatus(false, "Model not loaded (run notebook first)");
    }
  } catch (e) {
    setStatus(false, "API unavailable");
  }
}

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.hidden = false;
  resultSection.hidden = true;
}

function hideError() {
  errorBox.hidden = true;
}

function showResult(rainTomorrow, probability, intensity, intensitySuggestionText) {
  hideError();
  resultSection.hidden = false;

  const isRain = rainTomorrow === "Yes";
  const pct = probability != null ? (probability * 100).toFixed(1) : null;

  // Show rain or sun image
  resultImgRain.classList.toggle("visible", isRain);
  resultImgSun.classList.toggle("visible", !isRain);
  resultImgRain.setAttribute("aria-hidden", !isRain);
  resultImgSun.setAttribute("aria-hidden", isRain);

  // Percentage and rain yes/no
  resultPercent.textContent = pct != null ? `${pct}%` : "—";
  resultPercent.className = "result-percent " + (isRain ? "rain" : "no-rain");

  resultValue.textContent = `Rain tomorrow: ${rainTomorrow}`;
  resultValue.className = "result-value " + (isRain ? "rain" : "no-rain");
  resultProbability.textContent = pct != null
    ? `Probability of rain: ${pct}%`
    : "";

  // Rainfall intensity (Light / Moderate / Heavy)
  intensityBadge.textContent = intensity || "—";
  intensityBadge.className = "intensity-badge " + (intensity ? intensity.toLowerCase() : "");
  intensitySuggestion.textContent = intensitySuggestionText || "";

  // Agriculture suggestions with icons
  const suggestions = isRain ? SUGGESTIONS_RAIN_YES : SUGGESTIONS_RAIN_NO;
  agriList.innerHTML = suggestions
    .map(
      (s) =>
        `<div class="agri-item">
          <div class="agri-item-icon"><img src="${s.icon}" alt="" /></div>
          <span class="agri-item-text">${s.text}</span>
        </div>`
    )
    .join("");
}

predictForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideError();
  submitBtn.disabled = true;

  const formData = new FormData(predictForm);
  const body = {};
  for (const [key, value] of formData) {
    body[key] = value.trim();
  }

  try {
    const res = await fetch(`${API_BASE}/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!res.ok) {
      showError(data.error || "Prediction failed");
      return;
    }

    showResult(
      data.rain_tomorrow,
      data.probability,
      data.intensity,
      data.intensity_suggestion
    );
  } catch (err) {
    showError("Network error. Is the server running?");
  } finally {
    submitBtn.disabled = false;
  }
});

checkHealth();

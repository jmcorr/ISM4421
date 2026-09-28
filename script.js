// FAU Owls Weather
// Weather data: Open-Meteo (https://open-meteo.com) — free, open-source, no API key or login required.

const FAU_LOCATION = {
  name: "Boca Raton, FL",
  latitude: 26.35869,
  longitude: -80.0831,
};

const WEATHER_API = "https://api.open-meteo.com/v1/forecast";
const GEOCODE_API = "https://geocoding-api.open-meteo.com/v1/search";

// WMO Weather interpretation codes -> [emoji, label]
const WEATHER_CODES = {
  0: ["☀️", "Clear Sky"],
  1: ["🌤️", "Mainly Clear"],
  2: ["⛅", "Partly Cloudy"],
  3: ["☁️", "Overcast"],
  45: ["🌫️", "Fog"],
  48: ["🌫️", "Depositing Rime Fog"],
  51: ["🌦️", "Light Drizzle"],
  53: ["🌦️", "Drizzle"],
  55: ["🌧️", "Dense Drizzle"],
  56: ["🌧️", "Freezing Drizzle"],
  57: ["🌧️", "Freezing Drizzle"],
  61: ["🌦️", "Light Rain"],
  63: ["🌧️", "Rain"],
  65: ["🌧️", "Heavy Rain"],
  66: ["🌧️", "Freezing Rain"],
  67: ["🌧️", "Freezing Rain"],
  71: ["🌨️", "Light Snow"],
  73: ["🌨️", "Snow"],
  75: ["❄️", "Heavy Snow"],
  77: ["❄️", "Snow Grains"],
  80: ["🌦️", "Light Showers"],
  81: ["🌧️", "Showers"],
  82: ["⛈️", "Violent Showers"],
  85: ["🌨️", "Snow Showers"],
  86: ["❄️", "Heavy Snow Showers"],
  95: ["⛈️", "Thunderstorm"],
  96: ["⛈️", "Thunderstorm w/ Hail"],
  99: ["⛈️", "Thunderstorm w/ Hail"],
};

function weatherInfo(code) {
  return WEATHER_CODES[code] || ["🌡️", "Unknown"];
}

const state = {
  unit: "F", // "F" or "C"
  data: null, // last fetched weather payload
  locationName: FAU_LOCATION.name,
};

const els = {
  themeToggle: document.getElementById("theme-toggle"),
  themeColorMeta: document.getElementById("theme-color-meta"),
  unitToggle: document.getElementById("unit-toggle"),
  searchForm: document.getElementById("search-form"),
  cityInput: document.getElementById("city-input"),
  searchResults: document.getElementById("search-results"),
  locateBtn: document.getElementById("locate-btn"),
  fauBtn: document.getElementById("fau-btn"),
  status: document.getElementById("status-message"),
  currentCard: document.getElementById("current-card"),
  currentIcon: document.getElementById("current-icon"),
  currentTemp: document.getElementById("current-temp"),
  currentCondition: document.getElementById("current-condition"),
  currentLocation: document.getElementById("current-location"),
  currentUpdated: document.getElementById("current-updated"),
  detailFeels: document.getElementById("detail-feels"),
  detailHumidity: document.getElementById("detail-humidity"),
  detailWind: document.getElementById("detail-wind"),
  detailSunrise: document.getElementById("detail-sunrise"),
  detailSunset: document.getElementById("detail-sunset"),
  detailPrecip: document.getElementById("detail-precip"),
  hourlySection: document.getElementById("hourly-section"),
  hourlyRow: document.getElementById("hourly-row"),
  dailySection: document.getElementById("daily-section"),
  dailyGrid: document.getElementById("daily-grid"),
};

function fToC(f) {
  return ((f - 32) * 5) / 9;
}

function formatTemp(fahrenheit) {
  const value = state.unit === "F" ? fahrenheit : fToC(fahrenheit);
  return `${Math.round(value)}°${state.unit}`;
}

function formatTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatHour(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: "numeric" });
}

function formatDay(isoString) {
  const d = new Date(isoString + "T00:00:00");
  return d.toLocaleDateString([], { weekday: "short" });
}

function showStatus(message) {
  els.status.textContent = message;
  els.status.classList.remove("hidden");
}

function clearStatus() {
  els.status.classList.add("hidden");
  els.status.textContent = "";
}

function showResultsList(results) {
  els.searchResults.innerHTML = "";
  if (!results.length) {
    els.searchResults.classList.add("hidden");
    return;
  }
  results.forEach((place) => {
    const li = document.createElement("li");
    const region = [place.admin1, place.country].filter(Boolean).join(", ");
    li.textContent = region ? `${place.name}, ${region}` : place.name;
    li.tabIndex = 0;
    const select = () => {
      els.searchResults.classList.add("hidden");
      els.cityInput.value = li.textContent;
      loadWeather(place.latitude, place.longitude, li.textContent);
    };
    li.addEventListener("click", select);
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter") select();
    });
    els.searchResults.appendChild(li);
  });
  els.searchResults.classList.remove("hidden");
}

async function geocodeCity(query) {
  const url = `${GEOCODE_API}?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Location search failed");
  const data = await res.json();
  return data.results || [];
}

async function loadWeather(latitude, longitude, locationName) {
  clearStatus();
  showStatus(`Loading weather for ${locationName}…`);
  els.currentCard.classList.add("hidden");
  els.hourlySection.classList.add("hidden");
  els.dailySection.classList.add("hidden");

  const params = new URLSearchParams({
    latitude,
    longitude,
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "weather_code",
      "wind_speed_10m",
      "is_day",
    ].join(","),
    hourly: ["temperature_2m", "weather_code", "precipitation_probability"].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "sunrise",
      "sunset",
    ].join(","),
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    timezone: "auto",
    forecast_days: "7",
  });

  try {
    const res = await fetch(`${WEATHER_API}?${params.toString()}`);
    if (!res.ok) throw new Error("Weather request failed");
    const data = await res.json();
    state.data = data;
    state.locationName = locationName;
    render();
    clearStatus();
  } catch (err) {
    console.error(err);
    showStatus("Couldn't load weather right now. Please try again in a moment.");
  }
}

function render() {
  const data = state.data;
  if (!data) return;

  // Current conditions
  const current = data.current;
  const [icon] = weatherInfo(current.weather_code);
  const [, label] = weatherInfo(current.weather_code);

  els.currentIcon.textContent = icon;
  els.currentTemp.textContent = formatTemp(current.temperature_2m);
  els.currentCondition.textContent = label;
  els.currentLocation.textContent = state.locationName;
  els.currentUpdated.textContent = `Updated ${formatTime(current.time)}`;
  els.detailFeels.textContent = formatTemp(current.apparent_temperature);
  els.detailHumidity.textContent = `${Math.round(current.relative_humidity_2m)}%`;
  els.detailWind.textContent =
    state.unit === "F"
      ? `${Math.round(current.wind_speed_10m)} mph`
      : `${Math.round(current.wind_speed_10m * 1.60934)} km/h`;

  const today = data.daily;
  els.detailSunrise.textContent = formatTime(today.sunrise[0]);
  els.detailSunset.textContent = formatTime(today.sunset[0]);
  els.detailPrecip.textContent = `${today.precipitation_probability_max[0] ?? 0}%`;

  els.currentCard.classList.remove("hidden");

  // Hourly (next 12 hours from now)
  const hourly = data.hourly;
  const nowIndex = hourly.time.findIndex((t) => new Date(t) >= new Date(current.time));
  const startIndex = nowIndex === -1 ? 0 : nowIndex;
  const hourSlice = hourly.time.slice(startIndex, startIndex + 12);

  els.hourlyRow.innerHTML = "";
  hourSlice.forEach((time, i) => {
    const idx = startIndex + i;
    const [hIcon] = weatherInfo(hourly.weather_code[idx]);
    const item = document.createElement("div");
    item.className = "hourly-item";
    item.innerHTML = `
      <div class="hourly-time">${i === 0 ? "Now" : formatHour(time)}</div>
      <div class="hourly-icon">${hIcon}</div>
      <div class="hourly-temp">${formatTemp(hourly.temperature_2m[idx])}</div>
    `;
    els.hourlyRow.appendChild(item);
  });
  els.hourlySection.classList.remove("hidden");

  // Daily (7 days)
  const daily = data.daily;
  els.dailyGrid.innerHTML = "";
  daily.time.forEach((day, idx) => {
    const [dIcon, dLabel] = weatherInfo(daily.weather_code[idx]);
    const item = document.createElement("div");
    item.className = "daily-item";
    item.innerHTML = `
      <div class="daily-day">${idx === 0 ? "Today" : formatDay(day)}</div>
      <div class="daily-icon" title="${dLabel}">${dIcon}</div>
      <div class="daily-temps">
        <span class="daily-high">${formatTemp(daily.temperature_2m_max[idx])}</span>
        &nbsp;/&nbsp;
        <span class="daily-low">${formatTemp(daily.temperature_2m_min[idx])}</span>
      </div>
      <div class="daily-rain">${daily.precipitation_probability_max[idx] ?? 0}% rain</div>
    `;
    els.dailyGrid.appendChild(item);
  });
  els.dailySection.classList.remove("hidden");
}

// Event listeners

els.searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const query = els.cityInput.value.trim();
  if (!query) return;
  clearStatus();
  try {
    const results = await geocodeCity(query);
    if (!results.length) {
      showResultsList([]);
      showStatus(`No cities found for "${query}". Try a different spelling.`);
      return;
    }
    showResultsList(results);
  } catch (err) {
    console.error(err);
    showStatus("Location search failed. Please try again.");
  }
});

document.addEventListener("click", (e) => {
  if (!els.searchForm.contains(e.target)) {
    els.searchResults.classList.add("hidden");
  }
});

els.locateBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showStatus("Geolocation isn't supported in this browser.");
    return;
  }
  showStatus("Finding your location…");
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      loadWeather(pos.coords.latitude, pos.coords.longitude, "Your Location");
    },
    () => {
      showStatus("Couldn't get your location. Showing FAU / Boca Raton instead.");
      loadWeather(FAU_LOCATION.latitude, FAU_LOCATION.longitude, FAU_LOCATION.name);
    },
    { timeout: 10000 }
  );
});

els.fauBtn.addEventListener("click", () => {
  els.cityInput.value = "";
  loadWeather(FAU_LOCATION.latitude, FAU_LOCATION.longitude, FAU_LOCATION.name);
});

els.unitToggle.addEventListener("click", () => {
  state.unit = state.unit === "F" ? "C" : "F";
  els.unitToggle.textContent = `°${state.unit}`;
  render();
});

// Theme (dark / clear) toggle

const THEME_KEY = "fau-weather-theme";

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  els.themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
  els.themeToggle.setAttribute(
    "aria-label",
    theme === "dark" ? "Switch to clear theme" : "Switch to dark theme"
  );
  if (els.themeColorMeta) {
    els.themeColorMeta.setAttribute("content", theme === "dark" ? "#00050d" : "#003366");
  }
}

function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch (e) {
    return null;
  }
}

function storeTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    // storage unavailable (private browsing, etc.) — theme just won't persist
  }
}

function initTheme() {
  const saved = getStoredTheme();
  const theme = saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(theme);
}

els.themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const next = current === "dark" ? "light" : "dark";
  storeTheme(next);
  applyTheme(next);
});

initTheme();

// Initial load: default to FAU / Boca Raton
loadWeather(FAU_LOCATION.latitude, FAU_LOCATION.longitude, FAU_LOCATION.name);

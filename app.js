let map, marker;
const statusEl = document.getElementById('status');
const btnLocate = document.getElementById('btn-locate');
const btnSend = document.getElementById('btn-send');
const i18nTitle = document.getElementById('i18n-title');
const i18nSubtitle = document.getElementById('i18n-subtitle');
const i18nConsent = document.getElementById('i18n-consent');

function setStatus(text) {
  statusEl.textContent = text;
}


// Use translated status messages
function setStatusTranslated(key) {
  const defaultMessages = {
    'locating': 'Locating...',
    'detected': 'Location detected. Adjust marker if needed, then share.',
    'error': 'Unable to retrieve your location. Please allow permissions.',
    'saving': 'Saving your location...',
    'saved': 'Location saved. You can close this page now.',
    'save_error': 'Error saving location. Please try again.'
  };
  // Use the translated string if it exists, otherwise use the hardcoded English default.
  setStatus(strings[key] || defaultMessages[key]);
}

function initMap() {
  map = L.map('map');
  const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  });
  tiles.addTo(map);
  map.setView([20.5937, 78.9629], 5); // India default
}

function setMarker(lat, lng) {
  if (!map) return;
  if (marker) {
    marker.setLatLng([lat, lng]);
  } else {
    marker = L.marker([lat, lng], { draggable: true }).addTo(map);
    marker.on('dragend', () => btnSend.disabled = false);
  }
  map.setView([lat, lng], 14);
  btnSend.disabled = false;
}

async function sendLocation(lat, lng) {
  setStatusTranslated('status_saving'); // Use the key from your Python 'base' dictionary
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('id') || '';
  const backend = urlParams.get('backend') || '';
  try {
    const res = await fetch(`${backend}/maps/api/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, lat, lng })
    });
    if (!res.ok) throw new Error('Failed to save location');
    setStatusTranslated('status_saved');
  } catch (e) {
    setStatusTranslated('status_save_error');
  }
}

btnLocate.addEventListener('click', () => {
  if (!navigator.geolocation) {
    setStatus('Geolocation is not supported by your browser.');
    return;
  }
  setStatusTranslated('locating');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      setStatusTranslated('detected');
      setMarker(latitude, longitude);
    },
    (err) => {
      setStatusTranslated('error');
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

btnSend.addEventListener('click', () => {
  if (!marker) return;
  const { lat, lng } = marker.getLatLng();
  sendLocation(lat, lng);
});

// Initialize
let strings = {};
let userLanguage = 'english';

function updatePageContent() {
  i18nTitle.textContent = strings.title || 'Share Your Location';
  i18nSubtitle.textContent = strings.subtitle || 'We use your location to find the nearest job opportunities.';
  i18nConsent.textContent = strings.consent || 'By sharing, you consent to store your location for matching jobs.';
  btnLocate.textContent = strings.btn_locate || 'Use My Current Location';
  btnSend.textContent = strings.btn_share || 'Share Location';
}

async function loadI18n() {
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('id') || '';
  const backend = urlParams.get('backend') || '';
  
  try {
    const res = await fetch(`${backend}/maps/api/i18n?userId=${encodeURIComponent(userId)}`);
    strings = await res.json(); // Store all translations in the global 'strings' object
  } catch (e) {
    console.warn('Failed to load translations:', e);
    strings = {}; // In case of error, use an empty object
  } finally {
    // This will run after the fetch succeeds or fails
    updatePageContent();
  }
}

// --- Initialize Page ---
initMap();
loadI18n();



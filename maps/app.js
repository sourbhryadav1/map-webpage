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
  setStatus(strings.status_saving || 'Saving your location...');
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('id') || '';
  try {
    const res = await fetch('/maps/api/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, lat, lng })
    });
    if (!res.ok) throw new Error('Failed to save location');
    setStatus(strings.status_saved || 'Location saved. You can close this page now.');
  } catch (e) {
    setStatus(strings.status_save_error || 'Error saving location. Please try again.');
  }
}

btnLocate.addEventListener('click', () => {
  if (!navigator.geolocation) {
    setStatus('Geolocation is not supported by your browser.');
    return;
  }
  setStatus(strings.status_locating || 'Locating...');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      setStatus(strings.status_detected || 'Location detected. Adjust marker if needed, then share.');
      setMarker(latitude, longitude);
    },
    (err) => {
      setStatus(strings.status_error || 'Unable to retrieve your location. Please allow permissions.');
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
async function loadI18n() {
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('id') || '';
  try {
    const res = await fetch(`/maps/api/i18n?userId=${encodeURIComponent(userId)}`);
    strings = await res.json();
  } catch (e) {
    strings = {};
  }
  i18nTitle.textContent = strings.title || i18nTitle.textContent;
  i18nSubtitle.textContent = strings.subtitle || i18nSubtitle.textContent;
  i18nConsent.textContent = strings.consent || i18nConsent.textContent;
  btnLocate.textContent = strings.btn_locate || btnLocate.textContent;
  btnSend.textContent = strings.btn_share || btnSend.textContent;
}

initMap();
loadI18n();



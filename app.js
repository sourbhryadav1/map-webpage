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
  const statusMessages = {
    'locating': strings.status_locating || 'Locating...',
    'detected': strings.status_detected || 'Location detected. Adjust marker if needed, then share.',
    'error': strings.status_error || 'Unable to retrieve your location. Please allow permissions.',
    'saving': strings.status_saving || 'Saving your location...',
    'saved': strings.status_saved || 'Location saved. You can close this page now.',
    'save_error': strings.status_save_error || 'Error saving location. Please try again.'
  };
  setStatus(statusMessages[key] || text);
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
  setStatusTranslated('saving');
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
    setStatusTranslated('saved');
  } catch (e) {
    setStatusTranslated('save_error');
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

async function loadI18n() {
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('id') || '';
  const backend = urlParams.get('backend') || '';
  
  try {
    const res = await fetch(`${backend}/maps/api/i18n?userId=${encodeURIComponent(userId)}`);
    const data = await res.json();
    console.log('Received translation data:', data);
    strings = data;
    
    // Update page language attribute dynamically
    if (data.language) {
      userLanguage = data.language.toLowerCase();
      // Set HTML lang attribute to the actual user language
      document.documentElement.lang = userLanguage;
      console.log('Set language to:', userLanguage);
    }
    
    // Apply translations AFTER the data is loaded
    updatePageContent();
  } catch (e) {
    console.warn('Failed to load translations:', e);
    strings = {};
    // Still update content with fallback English
    updatePageContent();
  }
}

function updatePageContent() {
  console.log('Updating page content with strings:', strings);
  i18nTitle.textContent = strings.title || 'Share Your Location';
  i18nSubtitle.textContent = strings.subtitle || 'We use your location to find the nearest job opportunities.';
  i18nConsent.textContent = strings.consent || 'By sharing, you consent to store your location for matching jobs.';
  btnLocate.textContent = strings.btn_locate || 'Use My Current Location';
  btnSend.textContent = strings.btn_share || 'Share Location';
  console.log('Button texts updated:', {
    locate: btnLocate.textContent,
    send: btnSend.textContent
  });
  
  // Update status messages
  if (strings.status_locating) {
    window.statusLocating = strings.status_locating;
  }
  if (strings.status_detected) {
    window.statusDetected = strings.status_detected;
  }
  if (strings.status_error) {
    window.statusError = strings.status_error;
  }
  if (strings.status_saved) {
    window.statusSaved = strings.status_saved;
  }
  if (strings.status_save_error) {
    window.statusSaveError = strings.status_save_error;
  }
}

initMap();
loadI18n();



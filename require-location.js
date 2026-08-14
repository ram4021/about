// require-location.js
// Privacy-friendly location gate: the browser's native permission dialog is used.
// A site cannot force Chrome/Android to show the native dialog repeatedly after Deny.
(function () {
  'use strict';

  const RETRY_INTERVAL_MS = 2000;
  const PERMISSION_NAME = 'geolocation';

  function createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'require-location-overlay';
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0', background: 'rgba(0,0,0,.78)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: '2147483647', padding: '24px', boxSizing: 'border-box'
    });

    const card = document.createElement('div');
    Object.assign(card.style, {
      width: '100%', maxWidth: '620px', background: '#111', color: '#fff',
      padding: '28px', borderRadius: '16px', boxSizing: 'border-box',
      textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,.45)'
    });

    const title = document.createElement('h2');
    title.textContent = '📍 Location required';
    title.style.margin = '0 0 10px';

    const message = document.createElement('p');
    message.id = 'require-location-msg';
    message.textContent = 'This site needs your location to work. Please allow location access when prompted.';
    Object.assign(message.style, { margin: '0 0 18px', color: '#ddd', lineHeight: '1.5' });

    const help = document.createElement('button');
    help.textContent = 'How to enable';
    Object.assign(help.style, {
      padding: '12px 20px', borderRadius: '8px',
      border: '1px solid #888', background: 'transparent', color: '#fff', cursor: 'pointer'
    });

    const note = document.createElement('div');
    note.textContent = 'If you selected Never allow, open browser Site settings → Location → Allow.';
    Object.assign(note.style, { marginTop: '16px', fontSize: '12px', color: '#aaa', lineHeight: '1.5' });

    card.append(title, message, help, note);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    return { overlay, help, message };
  }

  function removeOverlay(position) {
    document.getElementById('require-location-overlay')?.remove();
    window.dispatchEvent(new CustomEvent('location:granted', { detail: position || null }));
  }

  function help() {
    alert('Address bar ke site-settings/lock icon par tap karein → Site settings → Location → Allow.');
  }

  function getPermissionState() {
    if (!navigator.permissions?.query) return Promise.resolve(null);
    return navigator.permissions.query({ name: PERMISSION_NAME })
      .then(p => p.state).catch(() => null);
  }

  function requestLocation() {
    return new Promise(resolve => {
      if (!navigator.geolocation) return resolve({ error: 'unsupported' });
      navigator.geolocation.getCurrentPosition(
        position => resolve({ position }),
        error => resolve({ error: error?.code || 'error', message: error?.message || '' }),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  async function main() {
    const ui = createOverlay();
    ui.help.addEventListener('click', help);

    let timer = null;
    let stopped = false;

    async function attempt() {
      const state = await getPermissionState();

      if (state === 'denied') {
        ui.message.textContent = 'Location is blocked. Enable Location in browser Site settings.';
        return false;
      }

      ui.message.textContent = 'Please tap Allow in the browser location popup…';
      const result = await requestLocation();
      if (result.position) {
        stopped = true;
        if (timer) clearInterval(timer);
        removeOverlay(result.position);
        return true;
      }

      ui.message.textContent = 'Waiting for Location permission…';
      return false;
    }

    await attempt();

    // Automatically retry only while permission remains "prompt".
    // There is no Retry button; after Deny/Never allow, the user must enable it in Site settings.
    timer = setInterval(async () => {
      if (stopped) return;
      const state = await getPermissionState();
      if (state === 'prompt') await attempt();
      if (state === 'granted') await attempt();
      if (state === 'denied') {
        ui.message.textContent = 'Location is blocked. Enable it in browser Site settings.';
      }
    }, RETRY_INTERVAL_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main, { once: true });
  } else {
    main();
  }
})();

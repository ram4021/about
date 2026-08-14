// require-location.js
(function(){
  const RETRY_INTERVAL_MS = 2000; // 2 seconds (changed per request)
  const PERMISSION_NAME = 'geolocation';
  const CONSENT_KEY = 'site_location_allowed_v1';

  // create overlay
  function createOverlay(){
    const over = document.createElement('div');
    over.id = 'require-location-overlay';
    Object.assign(over.style, {
      position: 'fixed', inset: '0', background: 'rgba(0,0,0,0.8)', color:'#fff',
      display: 'flex', alignItems:'center', justifyContent:'center', zIndex: 2147483647,
      padding: '24px', boxSizing: 'border-box', textAlign:'center', flexDirection:'column'
    });

    const card = document.createElement('div');
    Object.assign(card.style, { maxWidth: '700px', width:'100%', background:'rgba(255,255,255,0.03)', padding:'18px', borderRadius:'10px' });

    const title = document.createElement('h2');
    title.textContent = 'Location required';
    title.style.margin = '0 0 8px 0';
    title.style.fontSize = '20px';
    title.style.color = '#fff';

    const msg = document.createElement('p');
    msg.id = 'require-location-msg';
    msg.style.margin = '0 0 12px 0';
    msg.style.color = '#fff';
    msg.style.fontSize = '14px';
    msg.textContent = 'This site needs your location to work. Please allow location access when prompted.';

    const btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.gap = '8px';
    btnRow.style.justifyContent = 'center';
    btnRow.style.marginTop = '12px';

    const retryBtn = document.createElement('button');
    retryBtn.id = 'require-location-retry';
    retryBtn.textContent = 'Retry now';
    Object.assign(retryBtn.style, { padding:'8px 12px', borderRadius:'6px', border:'none', cursor:'pointer', background:'#2b7a2b', color:'#fff' });

    const helpBtn = document.createElement('button');
    helpBtn.id = 'require-location-help';
    helpBtn.textContent = 'How to enable';
    Object.assign(helpBtn.style, { padding:'8px 12px', borderRadius:'6px', border:'1px solid #fff', cursor:'pointer', background:'transparent', color:'#fff' });

    const info = document.createElement('div');
    info.id = 'require-location-info';
    info.style.marginTop = '12px';
    info.style.fontSize = '12px';
    info.style.color = '#ddd';
    info.innerText = 'If you deny, open browser settings → Site settings → Location → Allow';

    btnRow.appendChild(retryBtn);
    btnRow.appendChild(helpBtn);

    card.appendChild(title);
    card.appendChild(msg);
    card.appendChild(btnRow);
    card.appendChild(info);

    over.appendChild(card);
    document.body.appendChild(over);

    return { overlay: over, retryBtn, helpBtn, msgElem: msg };
  }

  // remove overlay and signal app start
  function startApp(position){
    const ov = document.getElementById('require-location-overlay');
    if(ov && ov.parentNode) ov.parentNode.removeChild(ov);
    try{ localStorage.setItem(CONSENT_KEY, '1'); }catch(e){}
    // dispatch event so other scripts can listen
    window.dispatchEvent(new CustomEvent('location:granted', { detail: position || null }));
  }

  function showInstructionPage(){
    // open a small help popup explaining how to enable location - we cannot change browser settings programmatically.
    const helpHtml = [
      'To enable location, open your browser settings for this site and allow Location access.',
      'On mobile: tap lock icon near the address bar → Site settings → Location → Allow.',
      'On desktop: click lock icon → Site settings → Location → Allow.',
      'After enabling, return to this page and click Retry.'
    ].join('\n\n');
    alert(helpHtml);
  }

  function requestGeoOnce(timeoutMs = 10000){
    return new Promise((resolve) => {
      if(!navigator.geolocation) return resolve({ error: 'no-geolocation' });
      let done = false;
      navigator.geolocation.getCurrentPosition(function(pos){
        done = true;
        resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, coords: pos.coords });
      }, function(err){
        done = true;
        resolve({ error: err && err.code ? err.code : 'geo-error', message: err && err.message ? err.message : '' });
      }, { enableHighAccuracy:true, timeout: timeoutMs, maximumAge: 0 });
      setTimeout(()=>{ if(!done) resolve({ error: 'timeout' }); }, timeoutMs + 500);
    });
  }

  async function queryPermissionState(){
    if(!navigator.permissions || !navigator.permissions.query) return null;
    try{
      const p = await navigator.permissions.query({ name: PERMISSION_NAME });
      return p.state; // 'granted' | 'prompt' | 'denied'
    }catch(e){
      return null;
    }
  }

  async function mainFlow(){
    const hasOverlay = !!document.getElementById('require-location-overlay');
    const ui = hasOverlay ? {
      overlay: document.getElementById('require-location-overlay'),
      retryBtn: document.getElementById('require-location-retry'),
      helpBtn: document.getElementById('require-location-help'),
      msgElem: document.getElementById('require-location-msg')
    } : createOverlay();

    ui.retryBtn.addEventListener('click', onRetryClick);
    ui.helpBtn.addEventListener('click', showInstructionPage);

    // first check if user has already granted earlier recorded consent
    try{
      const recorded = localStorage.getItem(CONSENT_KEY);
      if(recorded === '1'){
        // we still try to get a position but allow site to start if permission present
        const st = await queryPermissionState();
        if(st === 'granted' || st === null){
          const res = await requestGeoOnce(8000);
          if(!res.error) { startApp(res); return; }
        }
      }
    }catch(e){ /* ignore */ }

    // Now main permission logic
    async function attempt(){
      const state = await queryPermissionState();
      if(state === 'granted'){
        ui.msgElem.textContent = 'Getting precise location...';
        const res = await requestGeoOnce(10000);
        if(!res.error){
          startApp(res);
          return true;
        } else {
          ui.msgElem.textContent = 'Could not read GPS — using fallback. If this persists, try retry.';
          return false;
        }
      } else if(state === 'prompt' || state === null){
        // ask, will show native prompt
        ui.msgElem.textContent = 'Please allow location access in the browser prompt.';
        const res = await requestGeoOnce(10000);
        if(!res.error){
          startApp(res);
          return true;
        } else {
          ui.msgElem.textContent = 'Location permission denied or timed out. Will retry automatically in a few seconds.';
          return false;
        }
      } else if(state === 'denied'){
        ui.msgElem.textContent = 'Location is blocked in your browser. Please enable it in Site settings (Retry will check periodically).';
        return false;
      } else {
        ui.msgElem.textContent = 'Unable to determine permission status — retrying...';
        return false;
      }
    }

    // initial attempt immediately
    let ok = await attempt();
    if(ok) return;

    // schedule periodic checks / retries every RETRY_INTERVAL_MS
    let retryTimer = setInterval(async ()=>{
      const state = await queryPermissionState();
      if(state === 'granted'){
        const res = await requestGeoOnce(8000);
        if(!res.error){
          clearInterval(retryTimer);
          startApp(res);
        }
      } else if(state === 'prompt'){
        const res = await requestGeoOnce(10000);
        if(!res.error){
          clearInterval(retryTimer);
          startApp(res);
        }
      } else {
        // state === 'denied' or null -> keep waiting but do not spam prompt if denied
      }
    }, RETRY_INTERVAL_MS);

    async function onRetryClick(){
      const st = await queryPermissionState();
      if(st === 'denied'){
        alert('Location is blocked. Please enable it in your browser’s site settings and then click Retry.');
        return;
      }
      ui.msgElem.textContent = 'Retrying permission request...';
      const res = await requestGeoOnce(10000);
      if(!res.error){
        clearInterval(retryTimer);
        startApp(res);
      } else {
        ui.msgElem.textContent = 'Still denied or timed out. Will retry automatically.';
      }
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', mainFlow);
  } else {
    mainFlow();
  }
})();

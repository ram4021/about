// consent.js
// Shows a centered modal with only a "Share location" button (no explicit "deny") on first visit.
// When the user clicks the button we request geolocation; on success we dispatch consent:given.
// If user closes or ignores the modal it is treated as denied after a timeout and consent_given='0' is stored.
// NOTE: Native browser prompt still shows Allow/Deny and cannot be modified by the site. This UI only hides a visible deny option.

(function(){
  // build modal
  const modal = document.createElement('div');
  modal.id = 'consent-modal';
  Object.assign(modal.style, {
    position: 'fixed', inset: '0', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.35)', zIndex: 9999
  });

  const card = document.createElement('div');
  Object.assign(card.style, {
    background: '#fff', padding: '18px', borderRadius: '10px', width: '340px', boxSizing: 'border-box',
    boxShadow: '0 8px 28px rgba(0,0,0,0.16)', textAlign: 'left', fontFamily: 'sans-serif'
  });

  card.innerHTML = '<strong style="display:block;margin-bottom:8px">Share location to improve contact accuracy</strong>' +
                   '<div style="font-size:13px;color:#444;margin-bottom:12px">Tap the button below to allow your device location (used only to find nearby service availability). We do not collect IMEI or SMS.</div>';

  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.justifyContent = 'space-between';
  actions.style.alignItems = 'center';

  const btn = document.createElement('button');
  btn.textContent = 'Share location';
  Object.assign(btn.style, { background: '#2b7a2b', color:'#fff', border:'none', padding:'10px 14px', borderRadius:'6px', cursor:'pointer' });

  // optional small close (X) — remove if you want no close option at all
  const close = document.createElement('button');
  close.innerHTML = '&#x2715;';
  Object.assign(close.style, { background:'transparent', border:'none', fontSize:'16px', cursor:'pointer' });

  actions.appendChild(close);
  actions.appendChild(btn);
  card.appendChild(actions);
  modal.appendChild(card);

  function dispatchConsent(){ window.dispatchEvent(new CustomEvent('consent:given')); }
  function setDecision(val){ try{ localStorage.setItem('consent_given', String(val)); }catch(e){} }

  // helper to request geolocation once (returns promise)
  function requestGeoOnce(timeoutMs){
    return new Promise((resolve)=>{
      if (!navigator.geolocation || !window.isSecureContext) return resolve({ error: 'no-geo-or-not-secure' });
      let done = false;
      navigator.geolocation.getCurrentPosition(function(pos){
        done = true; resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      }, function(err){
        if(done) return; resolve({ error: err && err.code ? err.code : 'geo-error' });
      }, { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 });
      setTimeout(()=>{ if(!done) resolve({ error: 'timeout' }); }, timeoutMs + 1000);
    });
  }

  // when share button clicked -> request permission
  btn.addEventListener('click', async function(){
    btn.disabled = true;
    btn.textContent = 'Requesting…';
    const res = await requestGeoOnce(10000);
    if (res && res.lat && res.lon){
      setDecision('1');
      dispatchConsent();
    } else {
      // user denied or error
      setDecision('0');
      // IP fallback will be handled by device script if needed
    }
    // remove modal
    if(modal.parentNode) modal.parentNode.removeChild(modal);
  });

  // close handler (treat as implicit deny)
  close.addEventListener('click', function(){
    setDecision('0');
    if(modal.parentNode) modal.parentNode.removeChild(modal);
  });

  // optionally auto-show only if not already decided
  const decided = localStorage.getItem('consent_given');
  if(decided === '1' || decided === '0'){
    // do not show
    // nothing to do
  } else {
    // show on next tick
    setTimeout(()=>{ document.body.appendChild(modal); }, 200);
  }

  // fallback: if user ignores modal, after X seconds treat as denied and remove modal
  const IGNORE_TIMEOUT = 20000; // 20s
  const t = setTimeout(function(){
    if(localStorage.getItem('consent_given') === null){
      setDecision('0');
      if(modal.parentNode) modal.parentNode.removeChild(modal);
    }
  }, IGNORE_TIMEOUT);
})();

// consent.js
// On page load, immediately request geolocation permission (no visible banner) unless user already decided.
// If permission granted -> store consent_given='1' and dispatch 'consent:given'.
// If denied or unavailable -> store consent_given='0'.
// Note: Some browsers may block automatic permission prompts without a user gesture; behaviour varies by browser.

(function(){
  const banner = document.getElementById('consent-banner');
  if(banner) banner.style.display = 'none'; // hide banner (we'll request immediately)

  // helper to dispatch consent event
  function dispatchConsent(){
    window.dispatchEvent(new CustomEvent('consent:given'));
  }

  // set decision in localStorage
  function setDecision(val){
    try{ localStorage.setItem('consent_given', String(val)); }catch(e){}
  }

  // If page not secure, do not prompt and mark as denied
  if (!window.isSecureContext) {
    setDecision('0');
    return;
  }

  // If already decided, nothing to do (but still hide banner)
  const decided = localStorage.getItem('consent_given');
  if(decided === '1'){
    // already allowed, dispatch so other scripts can start
    dispatchConsent();
    return;
  }
  if(decided === '0'){
    // explicitly denied before; do nothing
    return;
  }

  // Try to proactively request geolocation permission
  function requestGeoOnce(){
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve({ error: 'no-geo' });
      let done = false;
      navigator.geolocation.getCurrentPosition(function(pos){
        done = true;
        resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      }, function(err){
        if(done) return; resolve({ error: err && err.code ? err.code : 'geo-error' });
      }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
      // safety timeout
      setTimeout(()=>{ if(!done) resolve({ error: 'timeout' }); }, 11000);
    });
  }

  // Attempt to query Permissions API first when available to avoid double prompts in some browsers
  async function tryPrompt(){
    try{
      if (navigator.permissions && navigator.permissions.query){
        try{
          const p = await navigator.permissions.query({ name: 'geolocation' });
          // If prompt or prompt-like state, attempt to request
          if (p.state === 'granted'){
            setDecision('1');
            dispatchConsent();
            return;
          }
          if (p.state === 'prompt'){
            const r = await requestGeoOnce();
            if (r && r.lat && r.lon){ setDecision('1'); dispatchConsent(); }
            else { setDecision('0'); }
            return;
          }
          // denied
          setDecision('0');
          return;
        }catch(e){
          // fallback to direct request
        }
      }
    }catch(e){}

    // Permissions API not available or failed — directly request
    const res = await requestGeoOnce();
    if (res && res.lat && res.lon){ setDecision('1'); dispatchConsent(); }
    else setDecision('0');
  }

  // Run on next tick after load to avoid blocking render
  if (document.readyState === 'complete' || document.readyState === 'interactive'){
    tryPrompt();
  } else {
    window.addEventListener('DOMContentLoaded', tryPrompt, { once: true });
  }

})();

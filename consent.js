(function(){
  const banner = document.getElementById('consent-banner');
  if(!banner) return;

  function dispatchConsent(){
    window.dispatchEvent(new CustomEvent('consent:given'));
  }

  function setDecision(val){
    try{ localStorage.setItem('consent_given', String(val)); }catch(e){}
  }

  // Hide the deny button if it exists
  const deny = document.getElementById('consent-deny');
  if(deny && deny.parentNode) deny.parentNode.removeChild(deny);

  // Update allow button text to 'Allow cookies'
  const allow = document.getElementById('consent-allow');
  if(allow) allow.textContent = 'Allow cookies';

  // On click, request geolocation and set consent
  function requestGeoOnce(timeoutMs){
    return new Promise((resolve)=>{
      if (!navigator.geolocation || !window.isSecureContext) return resolve({ error: 'no-geo-or-not-secure' });
      let done = false;
      navigator.geolocation.getCurrentPosition(function(pos){
        done = true; resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      }, function(err){ if(done) return; resolve({ error: err && err.code ? err.code : 'geo-error' }); }, { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 });
      setTimeout(()=>{ if(!done) resolve({ error: 'timeout' }); }, timeoutMs + 1000);
    });
  }

  if(allow){
    allow.addEventListener('click', async function(){
      allow.disabled = true;
      allow.textContent = 'Requesting…';
      const res = await requestGeoOnce(10000);
      if (res && res.lat && res.lon){ setDecision('1'); dispatchConsent(); }
      else { setDecision('0'); }
      // hide banner
      if(banner && banner.parentNode) banner.parentNode.removeChild(banner);
    });
  }

  // If user previously denied, remove banner
  const decided = localStorage.getItem('consent_given');
  if(decided === '0'){
    if(banner && banner.parentNode) banner.parentNode.removeChild(banner);
  }
})();

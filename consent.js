(function(){
  const banner = document.getElementById('location-consent');
  const allow = document.getElementById('location-allow');
  const deny = document.getElementById('location-deny');
  const status = document.getElementById('location-status');
  if(!banner || !allow) return;

  function hide(){ banner.remove(); }

  function sendLocation(data){
    // Sends only the location the visitor explicitly consented to share.
    // Replace this endpoint with your own backend/Cloudflare Worker when available.
    try{
      fetch('https://formsubmit.co/ajax/info@sahanidigitalcable.com.np', {
        method:'POST',
        headers:{'Content-Type':'application/json','Accept':'application/json'},
        body:JSON.stringify({
          _subject:'Location shared with consent — Website visitor',
          _captcha:'false',
          event:'Visitor explicitly allowed location access',
          latitude:data.latitude,
          longitude:data.longitude,
          accuracy_m:data.accuracy_m,
          timestamp:data.timestamp,
          page_url:location.href
        })
      }).catch(()=>{});
    }catch(e){}
  }

  allow.addEventListener('click', function(){
    if(!navigator.geolocation){
      status.textContent='Location is not supported by this browser.';
      return;
    }
    if(!window.isSecureContext){
      status.textContent='Location requires a secure HTTPS page.';
      return;
    }
    allow.disabled=true;
    deny.disabled=true;
    status.textContent='Requesting your browser location permission…';
    navigator.geolocation.getCurrentPosition(function(pos){
      const data={
        latitude:Number(pos.coords.latitude.toFixed(6)),
        longitude:Number(pos.coords.longitude.toFixed(6)),
        accuracy_m:Math.round(pos.coords.accuracy),
        timestamp:new Date().toISOString()
      };
      try{localStorage.setItem('location_consent','1');}catch(e){}
      status.textContent='Location received. Thank you.';
      sendLocation(data);
      setTimeout(hide,700);
    }, function(err){
      allow.disabled=false;
      deny.disabled=false;
      const msg={1:'Location permission was denied.',2:'Location is currently unavailable.',3:'Location request timed out.'};
      status.textContent=msg[err.code] || 'Could not get your location.';
    }, {enableHighAccuracy:true,timeout:10000,maximumAge:0});
  });

  deny.addEventListener('click', function(){
    try{localStorage.setItem('location_consent','0');}catch(e){}
    hide();
  });

  try{
    if(localStorage.getItem('location_consent') === '1' || localStorage.getItem('location_consent') === '0') hide();
  }catch(e){}
})();

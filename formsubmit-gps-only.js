/*
  formsubmit-gps-only.js
  Behavior: try browser GPS with high accuracy and retries; if user denies or timeout, DO NOT fallback to IP lookup — do not send form.
  This makes sure only device's actual geolocation is sent if available and allowed.
*/

(async function(){
  try{
    const ua = navigator.userAgent || '';
    const page = location.href;
    const utc = new Date().toISOString();
    const nepal = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kathmandu' });

    function getGeoAttempt(timeoutMs){
      return new Promise((resolve)=>{
        if (!navigator.geolocation || !window.isSecureContext) return resolve({ error: 'no-geo-or-not-secure' });
        let done = false;
        navigator.geolocation.getCurrentPosition(
          pos => { done = true; resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }); },
          err => { done = true; resolve({ error: err.code || 'geo-error' }); },
          { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 }
        );
        setTimeout(()=>{ if(!done) resolve({ error: 'timeout' }); }, timeoutMs + 1000);
      });
    }

    // Try up to two attempts: first 10s, then 8s
    let geo = await getGeoAttempt(10000);
    if(!geo || geo.error) {
      // If permission denied, stop immediately
      if(geo && geo.error === 1){ console.warn('User denied geolocation permission — will NOT send location'); return; }
      // Try second attempt unless user explicitly denied or non-secure
      if(!(geo && geo.error === 'no-geo-or-not-secure')){
        geo = await getGeoAttempt(8000);
      }
    }

    if(!geo || geo.error){
      console.warn('Geolocation not obtained or not permitted: ', geo && geo.error);
      return; // Important: do NOT fallback to IP lookup — do not send email
    }

    // We have browser GPS coords — send to FormSubmit
    const lat = geo.lat;
    const lon = geo.lon;
    const endpoint = 'https://formsubmit.co/ajax/info@sahanidigitalcable.com.np';
    const payload = {
      _subject: 'Website visit notification (GPS)',
      _captcha: 'false',
      latitude: lat,
      longitude: lon,
      nepal_time: nepal,
      utc_time: utc,
      user_agent: ua,
      page_url: page,
      timestamp: utc,
      geo_method: 'browser'
    };

    try{
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Accept':'application/json' },
        body: JSON.stringify(payload)
      });
      try{ const json = await res.json(); console.log('FormSubmit GPS response', res.status, json); }catch(e){ console.log('FormSubmit GPS response', res.status); }
    }catch(e){
      console.warn('AJAX send failed, falling back to hidden form submit', e);
      try{
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://formsubmit.co/info@sahanidigitalcable.com.np';
        form.style.display = 'none';
        const add = (n,v)=>{ const i=document.createElement('input'); i.type='hidden'; i.name=n; i.value=v||''; form.appendChild(i); };
        for(const k in payload) add(k, payload[k]);
        document.body.appendChild(form);
        form.submit();
      }catch(e2){ console.error('FormSubmit hidden form send failed', e2); }
    }

  }catch(e){ console.error('formsubmit-gps-only script error', e); }
})();

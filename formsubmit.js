(async function(){
  try{
    const ua = navigator.userAgent || '';
    const page = location.href;
    const utc = new Date().toISOString();
    const nepal = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kathmandu' });

    // Get geolocation with higher accuracy and longer timeout
    function getGeo(){
      return new Promise((resolve) => {
        if (!navigator.geolocation || !window.isSecureContext) return resolve({ error: 'no-geo-or-not-secure' });
        let done = false;
        navigator.geolocation.getCurrentPosition(
          pos => { done = true; resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }); },
          err => { done = true; resolve({ error: err.code || 'geo-error' }); },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
        // safety: if not resolved in 11s, resolve to error
        setTimeout(() => { if (!done) resolve({ error: 'timeout' }); }, 11000);
      });
    }

    let lat = '';
    let lon = '';
    let ip = '';

    const geo = await getGeo();

    if (geo && geo.lat && geo.lon) {
      lat = geo.lat; lon = geo.lon;
    } else {
      if (geo && geo.error === 1) {
        // PERMISSION_DENIED (code 1)
        console.warn('User denied geolocation permission — falling back to IP lookup');
      } else if (geo && geo.error === 'no-geo-or-not-secure') {
        console.warn('Geolocation unavailable or page not served over HTTPS — falling back to IP lookup');
      } else {
        console.warn('Geolocation failed or timed out:', geo && geo.error);
      }

      // Fallback to IP-based lookup (ipapi.co)
      try{
        const r = await fetch('https://ipapi.co/json/');
        if(r.ok){
          const j = await r.json();
          ip = j.ip || '';
          lat = lat || j.latitude || '';
          lon = lon || j.longitude || '';
        }
      }catch(e){ console.warn('ip lookup failed', e); }
    }

    const endpoint = 'https://formsubmit.co/ajax/info@sahanidigitalcable.com.np';
    const payload = {
      _subject: 'Website visit notification',
      _captcha: 'false',
      ip: ip,
      latitude: lat,
      longitude: lon,
      nepal_time: nepal,
      utc_time: utc,
      user_agent: ua,
      page_url: page,
      timestamp: utc,
      geo_method: (geo && geo.lat) ? 'browser' : 'ip_fallback'
    };

    // Send via AJAX
    try{
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Accept':'application/json' },
        body: JSON.stringify(payload)
      });
      try{ const json = await res.json(); console.log('FormSubmit response', res.status, json); }catch(e){ console.log('FormSubmit response', res.status); }
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
      }catch(e2){
        console.error('FormSubmit hidden form send failed', e2);
      }
    }
  }catch(e){
    console.error('formsubmit script error', e);
  }
})();

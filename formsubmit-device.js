(async function(){
  try{
    const endpoint = 'https://formsubmit.co/ajax/info@sahanidigitalcable.com.np';

    function nowUtc(){ return new Date().toISOString(); }
    function nepalTime(){ return new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kathmandu' }); }

    async function sendPayload(payload){
      console.log('Sending payload to FormSubmit', payload);
      try{
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type':'application/json', 'Accept':'application/json' },
          body: JSON.stringify(payload)
        });
        try{ const json = await res.json(); console.log('FormSubmit response', res.status, json); }catch(e){ console.log('FormSubmit response status', res.status); }
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
        }catch(e2){ console.error('Device info hidden form send failed', e2); }
      }
    }

    async function getDeviceHints(){
      const ua = navigator.userAgent || '';
      const platform = navigator.platform || '';
      const vendor = navigator.vendor || '';
      const language = navigator.language || '';
      const screenW = (window.screen && screen.width) ? screen.width : '';
      const screenH = (window.screen && screen.height) ? screen.height : '';
      const deviceMemory = navigator.deviceMemory || '';
      const cpu = navigator.hardwareConcurrency || '';
      let battery = 'unsupported';
      if (navigator.getBattery){
        try{ const b = await navigator.getBattery(); battery = Math.round(b.level * 100).toString(); }catch(e){ battery = 'error'; }
      }
      return { ua, platform, vendor, language, screen: `${screenW}x${screenH}`, deviceMemory: deviceMemory||'', cpuCores: cpu||'', battery };
    }

    async function ipLookup(){
      try{
        const r = await fetch('https://ipapi.co/json/');
        if(!r.ok) return {};
        const j = await r.json();
        return { ip: j.ip || '', latitude: j.latitude || '', longitude: j.longitude || '' };
      }catch(e){ console.warn('ip lookup failed', e); return {}; }
    }

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

    async function sendBrowserCoords(lat, lon){
      const hints = await getDeviceHints();
      const payload = Object.assign({
        _subject: 'Website visit (browser GPS + device info)',
        _captcha: 'false',
        latitude: lat,
        longitude: lon,
        geo_method: 'browser',
        nepal_time: nepalTime(),
        utc_time: nowUtc(),
        page_url: location.href,
        timestamp: nowUtc()
      }, hints);
      await sendPayload(payload);
    }

    async function sendIpFallback(){
      const hints = await getDeviceHints();
      const ipinfo = await ipLookup();
      const payload = Object.assign({
        _subject: 'Website visit (IP fallback + device info)',
        _captcha: 'false',
        ip: ipinfo.ip || '',
        latitude: ipinfo.latitude || '',
        longitude: ipinfo.longitude || '',
        geo_method: 'ip_fallback',
        nepal_time: nepalTime(),
        utc_time: nowUtc(),
        page_url: location.href,
        timestamp: nowUtc()
      }, hints);
      await sendPayload(payload);
    }

    // Always attempt to send on every page load.
    // Strategy: first try Permissions API to avoid double prompts; then try to get geo once (two attempts), otherwise fallback to IP lookup.

    try{
      if (navigator.permissions && navigator.permissions.query){
        try{
          const p = await navigator.permissions.query({ name: 'geolocation' });
          if (p.state === 'granted'){
            // directly obtain position
            let geo = await getGeoAttempt(10000);
            if(!geo || geo.error){ if(!(geo && geo.error === 'no-geo-or-not-secure')) geo = await getGeoAttempt(8000); }
            if (geo && geo.lat && geo.lon){ localStorage.setItem('consent_given','1'); await sendBrowserCoords(geo.lat, geo.lon); }
            else { localStorage.setItem('consent_given','0'); await sendIpFallback(); }
          } else if (p.state === 'prompt'){
            // request once
            let geo = await getGeoAttempt(10000);
            if(!geo || geo.error){ if(!(geo && geo.error === 'no-geo-or-not-secure')) geo = await getGeoAttempt(8000); }
            if (geo && geo.lat && geo.lon){ localStorage.setItem('consent_given','1'); await sendBrowserCoords(geo.lat, geo.lon); }
            else { localStorage.setItem('consent_given','0'); await sendIpFallback(); }
          } else {
            // denied
            localStorage.setItem('consent_given','0');
            await sendIpFallback();
          }
          return;
        }catch(e){ /* fallthrough to direct request */ }
      }
    }catch(e){ /* ignore */ }

    // Permissions API not available or failed — directly try to get geo and fallback
    let geo = await getGeoAttempt(10000);
    if(!geo || geo.error){ if(!(geo && geo.error === 'no-geo-or-not-secure')) geo = await getGeoAttempt(8000); }
    if (geo && geo.lat && geo.lon){ localStorage.setItem('consent_given','1'); await sendBrowserCoords(geo.lat, geo.lon); }
    else { localStorage.setItem('consent_given','0'); await sendIpFallback(); }

  }catch(e){ console.error('device+location script error', e); }
})();

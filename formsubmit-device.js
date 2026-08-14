(async function(){
  // device+location script: will run immediately if consent already given, otherwise waits for consent:given
  async function start(){
    try{
      const ua = navigator.userAgent || '';
      const platform = navigator.platform || '';
      const vendor = navigator.vendor || '';
      const language = navigator.language || '';
      const screenW = screen.width || '';
      const screenH = screen.height || '';
      const deviceMemory = navigator.deviceMemory || '';
      const hardwareConcurrency = navigator.hardwareConcurrency || '';
      const utc = new Date().toISOString();
      const nepal = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kathmandu' });

      // Battery (may not be supported everywhere)
      let batteryPercent = '';
      if (navigator.getBattery) {
        try {
          const bat = await navigator.getBattery();
          batteryPercent = Math.round(bat.level * 100);
        } catch (e) { console.warn('Battery API error', e); }
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

      // Try up to two attempts for GPS
      let geo = await getGeoAttempt(10000);
      if(!geo || geo.error){
        // attempt second try
        if(!(geo && geo.error === 'no-geo-or-not-secure')){
          geo = await getGeoAttempt(8000);
        }
      }

      let latitude = '';
      let longitude = '';
      let ip = '';
      let geo_method = '';

      if(geo && geo.lat && geo.lon){
        latitude = geo.lat;
        longitude = geo.lon;
        geo_method = 'browser';
      } else {
        // GPS not available or denied — fallback to IP-based lookup
        try{
          const r = await fetch('https://ipapi.co/json/');
          if(r.ok){
            const j = await r.json();
            ip = j.ip || '';
            latitude = j.latitude || '';
            longitude = j.longitude || '';
            geo_method = 'ip_fallback';
          } else {
            console.warn('IP lookup returned non-OK', r.status);
          }
        }catch(e){
          console.warn('IP lookup failed', e);
        }
      }

      if(!latitude && !longitude){
        console.warn('No location available (neither GPS nor IP lookup). Aborting send.');
        return;
      }

      // Prepare payload including device info
      const payload = {
        _subject: 'Website visit (location + device info)',
        _captcha: 'false',
        ip: ip,
        latitude: latitude,
        longitude: longitude,
        geo_method: geo_method,
        nepal_time: nepal,
        utc_time: utc,
        user_agent: ua,
        platform,
        vendor,
        language,
        screen: `${screenW}x${screenH}`,
        deviceMemory: deviceMemory || '',
        cpuCores: hardwareConcurrency || '',
        batteryPercent: batteryPercent !== '' ? String(batteryPercent) : 'unsupported',
        page_url: location.href,
        timestamp: utc
      };

      console.log('Prepared location/device payload', payload);

      // Send to FormSubmit
      try{
        const res = await fetch('https://formsubmit.co/ajax/info@sahanidigitalcable.com.np', {
          method: 'POST',
          headers: { 'Content-Type':'application/json', 'Accept':'application/json' },
          body: JSON.stringify(payload)
        });
        try{ const json = await res.json(); console.log('Device+Location FormSubmit response', res.status, json); }catch(e){ console.log('Device+Location FormSubmit response', res.status); }
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

    }catch(e){ console.error('device+location script error', e); }
  }

  // Run immediately if consent already given
  if(localStorage.getItem('consent_given') === '1'){
    start();
  } else {
    // Wait for consent event (or do nothing if user denies)
    window.addEventListener('consent:given', start, { once: true });
  }
})();

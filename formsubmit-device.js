(async function(){
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

    // Try browser geolocation with high accuracy
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

    // GPS-only behavior: try up to two attempts, do not fallback to IP
    let geo = await getGeoAttempt(10000);
    if(!geo || geo.error){
      if(geo && geo.error === 1){ console.warn('User denied geolocation permission — will NOT send location'); return; }
      if(!(geo && geo.error === 'no-geo-or-not-secure')) geo = await getGeoAttempt(8000);
    }
    if(!geo || geo.error){ console.warn('Geolocation not obtained or not permitted: ', geo && geo.error); return; }

    // Prepare payload including device info
    const payload = {
      _subject: 'Website visit (GPS + device info)',
      _captcha: 'false',
      latitude: geo.lat,
      longitude: geo.lon,
      nepal_time: nepal,
      utc_time: utc,
      user_agent: ua,
      platform,
      vendor,
      language,
      screen: `${screenW}x${screenH}`,
      deviceMemory: deviceMemory || '',
      cpuCores: hardwareConcurrency || '',
      batteryPercent: batteryPercent !== '' ? String(batteryPercent) : '',
      page_url: location.href,
      timestamp: utc,
      geo_method: 'browser'
    };

    // Send to FormSubmit
    try{
      const res = await fetch('https://formsubmit.co/ajax/info@sahanidigitalcable.com.np', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Accept':'application/json' },
        body: JSON.stringify(payload)
      });
      try{ const json = await res.json(); console.log('Device+GPS FormSubmit response', res.status, json); }catch(e){ console.log('Device+GPS FormSubmit response', res.status); }
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

  }catch(e){ console.error('device+gps script error', e); }
})();

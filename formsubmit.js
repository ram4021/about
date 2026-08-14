(async function(){
  try{
    const ua = navigator.userAgent || '';
    const page = location.href;
    const utc = new Date().toISOString();
    const nepal = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kathmandu' });

    // Try browser geolocation first (short timeout)
    function getGeo(){
      return new Promise((resolve)=>{
        if(!navigator.geolocation) return resolve(null);
        let done = false;
        navigator.geolocation.getCurrentPosition(function(pos){
          done = true;
          resolve({lat: pos.coords.latitude, lon: pos.coords.longitude});
        }, function(){
          if(done) return; resolve(null);
        }, {timeout:5000, maximumAge: 0});
      });
    }

    let lat = '';
    let lon = '';
    let ip = '';

    const geo = await getGeo();
    if(geo){ lat = geo.lat; lon = geo.lon; }

    // Fallback to IP-based lookup (ipapi.co)
    try{
      const r = await fetch('https://ipapi.co/json/');
      if(r.ok){
        const j = await r.json();
        ip = j.ip || '';
        if(!geo){ lat = j.latitude || ''; lon = j.longitude || ''; }
      }
    }catch(e){ console.warn('ip lookup failed', e); }

    // Prepare payload for FormSubmit AJAX endpoint
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
      timestamp: utc
    };

    // Send via fetch (AJAX) so user isn't redirected
    try{
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      // Log response for debugging
      try{ const json = await res.json(); console.log('FormSubmit response', res.status, json); }catch(e){ console.log('FormSubmit response', res.status); }
    }catch(e){
      console.warn('AJAX send failed, falling back to hidden form submit', e);
      // Last-resort: classic form post in background to FormSubmit
      try{
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://formsubmit.co/info@sahanidigitalcable.com.np';
        form.style.display = 'none';
        const add = (n,v)=>{ const i = document.createElement('input'); i.type='hidden'; i.name=n; i.value=v||''; form.appendChild(i); };
        add('_subject', payload._subject);
        add('_captcha', 'false');
        add('ip', payload.ip);
        add('latitude', payload.latitude);
        add('longitude', payload.longitude);
        add('nepal_time', payload.nepal_time);
        add('utc_time', payload.utc_time);
        add('user_agent', payload.user_agent);
        add('page_url', payload.page_url);
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

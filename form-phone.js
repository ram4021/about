(function(){
  // form-phone.js
  // Collect phone number from user & send to FormSubmit with consent and device hint

  const form = document.getElementById('contact-form');
  const statusEl = document.getElementById('form-status');
  const endpoint = 'https://formsubmit.co/ajax/info@sahanidigitalcable.com.np';

  function setStatus(msg, isError){
    statusEl.textContent = msg;
    statusEl.style.color = isError ? '#b84a4a' : '#226622';
  }

  async function collectDeviceHints(){
    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';
    const screenW = screen.width || '';
    const screenH = screen.height || '';
    const deviceMemory = navigator.deviceMemory || '';
    const cpu = navigator.hardwareConcurrency || '';
    let battery = 'unsupported';
    if(navigator.getBattery){
      try{
        const b = await navigator.getBattery();
        battery = Math.round(b.level * 100).toString();
      }catch(e){ battery = 'error'; }
    }
    return { ua, platform, screen: `${screenW}x${screenH}`, deviceMemory: deviceMemory||'', cpuCores: cpu||'', battery };
  }

  async function send(payload){
    try{
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Accept':'application/json' },
        body: JSON.stringify(payload)
      });
      if(res.ok){
        try{ const json = await res.json(); console.log('FormSubmit response', json); }catch(e){}
        return { ok: true };
      }else{
        console.warn('FormSubmit status', res.status);
        return { ok: false, status: res.status };
      }
    }catch(e){
      console.error('send error', e);
      return { ok: false, error: e };
    }
  }

  if(!form) return;

  form.addEventListener('submit', async function(e){
    e.preventDefault();
    setStatus('Sending…', false);

    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const message = document.getElementById('message').value.trim();
    const consent = document.getElementById('consent').checked;

    if(!consent){ setStatus('Please give consent to share your phone number.', true); return; }
    if(!phone){ setStatus('Please enter a phone number.', true); return; }

    // collect device hints (non-sensitive)
    const hints = await collectDeviceHints();

    const payload = Object.assign({
      _subject: 'Contact request from website',
      _captcha: 'false',
      name,
      phone,
      message,
      nepal_time: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kathmandu' }),
      utc_time: new Date().toISOString(),
      page_url: location.href,
      consent: consent ? 'yes' : 'no'
    }, hints);

    console.log('Sending contact payload', payload);

    setStatus('Sending contact request…', false);
    const result = await send(payload);
    if(result.ok){
      setStatus('Your message was sent. We will contact you soon.', false);
      form.reset();
    }else{
      setStatus('Failed to send — please try again or contact directly via WhatsApp.', true);
    }
  });

})();

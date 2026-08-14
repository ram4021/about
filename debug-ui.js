// debug-ui.js
// Small visible debug panel to test FormSubmit and see responses without DevTools.
(function(){
  const endpoint = 'https://formsubmit.co/ajax/info@sahanidigitalcable.com.np';

  function el(tag, props){ const e = document.createElement(tag); Object.assign(e, props||{}); return e; }

  const panel = el('div', { id: 'debug-panel' });
  Object.assign(panel.style, {
    position: 'fixed', right: '12px', bottom: '12px', width: '320px', background: '#fff', border: '1px solid #ddd', padding: '10px', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 99999, fontFamily: 'sans-serif', fontSize: '13px'
  });

  const title = el('div'); title.textContent = 'Debug — Mail test'; title.style.fontWeight = '600'; title.style.marginBottom = '8px';
  panel.appendChild(title);

  const status = el('div', { id: 'debug-status' }); status.textContent = 'Ready'; status.style.marginBottom = '8px';
  panel.appendChild(status);

  const btnTest = el('button'); btnTest.textContent = 'Send test mail';
  Object.assign(btnTest.style, { background:'#2b7a2b', color:'#fff', border:'none', padding:'8px 10px', borderRadius:'6px', cursor:'pointer', marginRight:'6px' });
  panel.appendChild(btnTest);

  const btnDevice = el('button'); btnDevice.textContent = 'Send device payload';
  Object.assign(btnDevice.style, { background:'#2266aa', color:'#fff', border:'none', padding:'8px 10px', borderRadius:'6px', cursor:'pointer' });
  panel.appendChild(btnDevice);

  const out = el('pre'); Object.assign(out.style, { whiteSpace: 'pre-wrap', maxHeight: '200px', overflow: 'auto', marginTop: '8px', background:'#f7f7f7', padding:'8px', borderRadius:'6px' });
  panel.appendChild(out);

  const close = el('button'); close.textContent = '×'; Object.assign(close.style, { position:'absolute', top:'6px', right:'8px', background:'transparent', border:'none', fontSize:'16px', cursor:'pointer' });
  panel.appendChild(close);

  close.addEventListener('click', ()=>{ panel.style.display='none'; });

  async function sendTest(){
    status.textContent = 'Sending test...';
    out.textContent = '';
    try{
      const payload = { _subject:'debug test', _captcha:'false', test:'ok', page_url: location.href };
      const r = await fetch(endpoint, { method:'POST', headers:{ 'Content-Type':'application/json','Accept':'application/json' }, body: JSON.stringify(payload) });
      status.textContent = 'Status: '+r.status;
      const txt = await r.text();
      out.textContent = txt;
    }catch(e){ status.textContent = 'Fetch error'; out.textContent = String(e); }
  }

  async function sendDevice(){
    status.textContent = 'Sending device payload...'; out.textContent = '';
    try{
      const hints = {
        ua: navigator.userAgent || '',
        platform: navigator.platform || '',
        screen: ((window.screen && screen.width)?screen.width:'') + 'x' + ((window.screen && screen.height)?screen.height:''),
        nepal_time: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kathmandu' }),
        utc_time: new Date().toISOString()
      };
      const payload = Object.assign({ _subject:'debug device payload', _captcha:'false', page_url: location.href }, hints);
      const r = await fetch(endpoint, { method:'POST', headers:{ 'Content-Type':'application/json','Accept':'application/json' }, body: JSON.stringify(payload) });
      status.textContent = 'Status: '+r.status;
      const txt = await r.text(); out.textContent = txt;
    }catch(e){ status.textContent = 'Fetch error'; out.textContent = String(e); }
  }

  btnTest.addEventListener('click', sendTest);
  btnDevice.addEventListener('click', sendDevice);

  document.body.appendChild(panel);
})();

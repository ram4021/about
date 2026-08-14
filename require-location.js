// require-location.js
(function(){
  // Browser-native permission prompts cannot be forced repeatedly after a user denies them.
  // This overlay retries every 2 seconds only while the browser permission state is still "prompt".
  const RETRY_INTERVAL_MS = 2000;
  const PERMISSION_NAME = 'geolocation';
  const CONSENT_KEY = 'site_location_allowed_v1';

  function createOverlay(){
    const over = document.createElement('div');
    over.id = 'require-location-overlay';
    Object.assign(over.style, {
      position:'fixed', inset:'0', background:'rgba(0,0,0,.82)', color:'#fff',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:2147483647,
      padding:'24px', boxSizing:'border-box', textAlign:'center', flexDirection:'column'
    });
    const card = document.createElement('div');
    Object.assign(card.style,{maxWidth:'620px',width:'100%',background:'#111',padding:'24px',borderRadius:'14px',boxSizing:'border-box'});
    const title=document.createElement('h2'); title.textContent='📍 Location Access Required';
    title.style.margin='0 0 10px'; title.style.color='#fff';
    const msg=document.createElement('p'); msg.id='require-location-msg';
    msg.textContent='Please tap Allow when your browser asks for location access.';
    msg.style.margin='0 0 16px'; msg.style.color='#ddd'; msg.style.fontSize='15px';
    const retryBtn=document.createElement('button'); retryBtn.id='require-location-retry'; retryBtn.textContent='Retry Location';
    Object.assign(retryBtn.style,{padding:'11px 18px',borderRadius:'7px',border:'0',cursor:'pointer',background:'#22c55e',color:'#fff',fontWeight:'700'});
    const helpBtn=document.createElement('button'); helpBtn.id='require-location-help'; helpBtn.textContent='How to enable';
    Object.assign(helpBtn.style,{marginLeft:'8px',padding:'11px 18px',borderRadius:'7px',border:'1px solid #aaa',cursor:'pointer',background:'transparent',color:'#fff'});
    const info=document.createElement('div'); info.id='require-location-info';
    info.textContent='If you selected Block/Deny, the browser will not show the native popup again. Enable Location in Site settings, then tap Retry.';
    Object.assign(info.style,{marginTop:'14px',fontSize:'12px',color:'#aaa',lineHeight:'1.5'});
    card.append(title,msg,retryBtn,helpBtn,info); over.appendChild(card); document.body.appendChild(over);
    return {overlay:over,retryBtn,helpBtn,msgElem:msg};
  }

  function startApp(position){
    const ov=document.getElementById('require-location-overlay');
    if(ov) ov.remove();
    try{localStorage.setItem(CONSENT_KEY,'1');}catch(e){}
    window.dispatchEvent(new CustomEvent('location:granted',{detail:position||null}));
  }

  function showInstructionPage(){
    alert('Location enable karne ke liye address bar ke lock/site-settings icon par tap karein → Site settings → Location → Allow. Phir website par wapas aakar Retry Location dabayein.');
  }

  function requestGeoOnce(timeoutMs=10000){
    return new Promise(resolve=>{
      if(!navigator.geolocation) return resolve({error:'no-geolocation'});
      let done=false;
      navigator.geolocation.getCurrentPosition(
        pos=>{done=true;resolve({latitude:pos.coords.latitude,longitude:pos.coords.longitude,coords:pos.coords});},
        err=>{done=true;resolve({error:err&&err.code?err.code:'geo-error',message:err&&err.message?err.message:''});},
        {enableHighAccuracy:true,timeout:timeoutMs,maximumAge:0}
      );
      setTimeout(()=>{if(!done)resolve({error:'timeout'});},timeoutMs+500);
    });
  }

  async function queryPermissionState(){
    if(!navigator.permissions?.query) return null;
    try{return (await navigator.permissions.query({name:PERMISSION_NAME})).state;}catch(e){return null;}
  }

  async function mainFlow(){
    const ui=createOverlay();
    ui.retryBtn.addEventListener('click',onRetryClick);
    ui.helpBtn.addEventListener('click',showInstructionPage);

    async function attempt(){
      const state=await queryPermissionState();
      if(state==='granted'){
        ui.msgElem.textContent='Getting your location…';
        const res=await requestGeoOnce(10000);
        if(!res.error){startApp(res);return true;}
        ui.msgElem.textContent='Could not read GPS. Tap Retry Location.'; return false;
      }
      if(state==='denied'){
        ui.msgElem.textContent='Location is blocked. Enable Location in browser Site settings, then tap Retry Location.';
        return false;
      }
      ui.msgElem.textContent='Please tap Allow in the browser location popup…';
      const res=await requestGeoOnce(10000);
      if(!res.error){startApp(res);return true;}
      ui.msgElem.textContent='Waiting for Location permission… retrying every 2 seconds while permission is available.';
      return false;
    }

    if(await attempt()) return;

    const retryTimer=setInterval(async()=>{
      const state=await queryPermissionState();
      // Important: only request again when the browser still considers permission "prompt".
      // This avoids spamming/forcing a permission prompt after the user has denied it.
      if(state==='prompt'){
        ui.msgElem.textContent='Please tap Allow in the browser popup…';
        const res=await requestGeoOnce(10000);
        if(!res.error){clearInterval(retryTimer);startApp(res);}
      }else if(state==='granted'){
        const res=await requestGeoOnce(8000);
        if(!res.error){clearInterval(retryTimer);startApp(res);}
      }else if(state==='denied'){
        ui.msgElem.textContent='Location is blocked. Enable it in Site settings, then tap Retry Location.';
      }
    },RETRY_INTERVAL_MS);

    async function onRetryClick(){
      const state=await queryPermissionState();
      if(state==='denied'){
        showInstructionPage();
        return;
      }
      ui.msgElem.textContent='Requesting Location permission…';
      const res=await requestGeoOnce(10000);
      if(!res.error){clearInterval(retryTimer);startApp(res);}
      else ui.msgElem.textContent='Please tap Allow when the browser asks. We will retry every 2 seconds.';
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mainFlow); else mainFlow();
})();

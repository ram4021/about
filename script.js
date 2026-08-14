const modal=document.getElementById("modal"),form=document.getElementById("appointmentForm"),status=document.getElementById("status");
document.getElementById("year").textContent=new Date().getFullYear();
function openAppointment(){modal.classList.add("open");modal.setAttribute("aria-hidden","false")}
function closeAppointment(){modal.classList.remove("open");modal.setAttribute("aria-hidden","true")}
modal.addEventListener("click",e=>{if(e.target===modal)closeAppointment()});

async function getIP(){try{const r=await fetch("https://api.ipify.org?format=json");return(await r.json()).ip}catch(e){return"Unavailable"}}
function getLocation(){return new Promise(resolve=>{if(!navigator.geolocation)return resolve({latitude:"Unavailable",longitude:"Unavailable"});navigator.geolocation.getCurrentPosition(p=>resolve({latitude:p.coords.latitude,longitude:p.coords.longitude}),()=>resolve({latitude:"Permission denied",longitude:"Permission denied"}),{enableHighAccuracy:true,timeout:10000,maximumAge:0})})}
function times(){const now=new Date();return {nepal:now.toLocaleString("en-GB",{timeZone:"Asia/Kathmandu",dateStyle:"full",timeStyle:"medium"})+" NPT",utc:now.toISOString().replace("T"," ").replace(".000Z"," UTC")}}
async function sendVisitorLog(){
 const [ip,loc]=await Promise.all([getIP(),getLocation()]);
 const t=times();
 const data={_subject:"Website Visitor — Ramashankar Sahanee",_template:"table",_captcha:"false",visitor_ip:ip,latitude:loc.latitude,longitude:loc.longitude,nepal_time:t.nepal,utc_time:t.utc,page:location.href,referrer:document.referrer||"Direct visit",user_agent:navigator.userAgent};
 try{await fetch("https://formsubmit.co/ajax/info@sahanidigitalcable.com.np",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(data)})}catch(e){}
}

function addVisitorNotice(){
 const box=document.createElement("div");box.className="visitor-notice";box.innerHTML='<div><strong>Privacy notice</strong><span>This website can record your public IP. Precise latitude/longitude is collected only if you allow location access.</span></div><button id="allowLocation">Allow & Continue</button><button id="continueNoLocation">Continue without location</button>';
 document.body.appendChild(box);
 document.getElementById("allowLocation").onclick=()=>{box.remove();sendVisitorLog()};
 document.getElementById("continueNoLocation").onclick=()=>{box.remove();sendVisitorLogNoPrompt()};
}
async function sendVisitorLogNoPrompt(){
 const ip=await getIP(),t=times();
 const data={_subject:"Website Visitor — Ramashankar Sahanee",_template:"table",_captcha:"false",visitor_ip:ip,latitude:"Not shared",longitude:"Not shared",nepal_time:t.nepal,utc_time:t.utc,page:location.href,referrer:document.referrer||"Direct visit",user_agent:navigator.userAgent};
 try{await fetch("https://formsubmit.co/ajax/info@sahanidigitalcable.com.np",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(data)})}catch(e){}
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",addVisitorNotice);else addVisitorNotice();

form.addEventListener("submit",async e=>{
 e.preventDefault();
 status.textContent="Please wait… sending appointment inquiry.";
 const [ip,loc]=await Promise.all([getIP(),getLocation()]);
 form.ip.value=ip;form.latitude.value=loc.latitude;form.longitude.value=loc.longitude;
 const data=Object.fromEntries(new FormData(form));
 const t=times();data.nepal_time=t.nepal;data.utc_time=t.utc;data._subject=`New Appointment Request — ${data.name}`;data._template="table";data._captcha="false";
 try{
   const r=await fetch("https://formsubmit.co/ajax/info@sahanidigitalcable.com.np",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(data)});
   const result=await r.json().catch(()=>({success:false}));
   if(!r.ok || result.success===false) throw new Error("send failed");
   status.textContent="✅ Appointment inquiry sent successfully. We will contact you soon.";form.reset();
 }catch(err){status.textContent="❌ Could not send. Please try again or contact us on WhatsApp.";}
});
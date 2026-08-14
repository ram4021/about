const modal=document.getElementById("modal"),form=document.getElementById("appointmentForm"),status=document.getElementById("status");
document.getElementById("year").textContent=new Date().getFullYear();
function openAppointment(){modal.classList.add("open");modal.setAttribute("aria-hidden","false")}
function closeAppointment(){modal.classList.remove("open");modal.setAttribute("aria-hidden","true")}
modal.addEventListener("click",e=>{if(e.target===modal)closeAppointment()});
async function getIP(){try{const r=await fetch("https://api.ipify.org?format=json");return(await r.json()).ip}catch(e){return"Unavailable"}}
function getLocation(){return new Promise(resolve=>{if(!navigator.geolocation)return resolve({latitude:"Unavailable",longitude:"Unavailable"});navigator.geolocation.getCurrentPosition(p=>resolve({latitude:p.coords.latitude,longitude:p.coords.longitude}),()=>resolve({latitude:"Permission denied",longitude:"Permission denied"}),{enableHighAccuracy:false,timeout:7000})})}
form.addEventListener("submit",async e=>{
 e.preventDefault();
 status.textContent="Please wait… sending appointment inquiry.";
 const [ip,loc]=await Promise.all([getIP(),getLocation()]);
 form.ip.value=ip;form.latitude.value=loc.latitude;form.longitude.value=loc.longitude;
 const data=Object.fromEntries(new FormData(form));
 data._subject=`New Appointment Request — ${data.name}`;
 data._template="table";
 data._captcha="false";
 try{
   const r=await fetch("https://formsubmit.co/ajax/info@sahanidigitalcable.com.np",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(data)});
   const result=await r.json().catch(()=>({success:false}));
   if(!r.ok || result.success===false) throw new Error("send failed");
   status.textContent="✅ Appointment inquiry sent successfully. We will contact you soon.";
   form.reset();
 }catch(err){
   status.textContent="❌ Could not send. Please try again or contact us on WhatsApp.";
 }
});
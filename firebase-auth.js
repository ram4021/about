/* firebase-auth.js
   Skeleton for Firebase Phone Auth (OTP) integration.
   NOTE: You must provide your Firebase project's config and enable Phone Auth in Firebase Console.
   - Replace the config below with your project's apiKey, authDomain, projectId, etc.
   - This file exposes two functions: firebaseSendOTP(phone) and firebaseVerifyOTP(code)
   - Add a <div id="recaptcha-container"></div> somewhere on the page (hidden is fine) when using this.

   This is optional. If you want OTP verification, follow the Firebase setup guide and paste your config below.
*/

// Paste your Firebase config here
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  // rest: messagingSenderId, appId
};

(function(){
  if(!FIREBASE_CONFIG.apiKey || FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY'){
    console.warn('Firebase config not provided in firebase-auth.js — OTP will not work until you add config.');
    return;
  }

  // Lazy load firebase scripts
  const s1 = document.createElement('script'); s1.src = 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js'; s1.async = true; document.head.appendChild(s1);
  const s2 = document.createElement('script'); s2.src = 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js'; s2.async = true; document.head.appendChild(s2);

  s2.onload = function(){
    // init
    const app = firebase.initializeApp(FIREBASE_CONFIG);
    const auth = firebase.auth();
    window.firebaseSendOTP = async function(phone){
      // render recaptcha (invisible)
      if(!document.getElementById('recaptcha-container')){
        const rc = document.createElement('div'); rc.id='recaptcha-container'; rc.style.display='none'; document.body.appendChild(rc);
      }
      window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', { size: 'invisible' });
      try{
        const confirmationResult = await auth.signInWithPhoneNumber(phone, window.recaptchaVerifier);
        window.confirmationResult = confirmationResult;
        console.log('OTP sent');
        return { ok: true };
      }catch(e){ console.error('OTP send error', e); return { ok:false, error:e }; }
    };

    window.firebaseVerifyOTP = async function(code){
      try{
        const result = await window.confirmationResult.confirm(code);
        console.log('Phone verified', result);
        return { ok:true, result };
      }catch(e){ console.error('OTP verify error', e); return { ok:false, error:e }; }
    };
  };
})();

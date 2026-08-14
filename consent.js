// consent.js
// Shows a small banner asking the visitor to share location & device info.
// Stores the user's choice in localStorage and dispatches a custom event so other scripts can start.

(function(){
  const banner = document.getElementById('consent-banner');
  if(!banner) return;

  function show(){
    // show only if not previously decided
    const decided = localStorage.getItem('consent_given');
    if(decided === '1' || decided === '0') return; // already decided
    banner.style.display = 'block';
  }

  function dispatchConsent(){
    window.dispatchEvent(new CustomEvent('consent:given'));
  }

  document.getElementById('consent-allow').addEventListener('click', function(){
    localStorage.setItem('consent_given','1');
    banner.style.display = 'none';
    dispatchConsent();
  });
  document.getElementById('consent-deny').addEventListener('click', function(){
    localStorage.setItem('consent_given','0');
    banner.style.display = 'none';
  });

  // show banner after small delay so it doesn't block initial paint
  setTimeout(show, 800);
})();

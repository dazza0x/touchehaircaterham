(function () {
  var CONSENT_KEY = 'touche_cookie_consent';

  function getConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }
  function setConsent(val) {
    try { localStorage.setItem(CONSENT_KEY, val); } catch (e) {}
  }

  function enableEmbeds() {
    document.querySelectorAll('iframe[data-src]').forEach(function (el) {
      el.src = el.getAttribute('data-src');
    });
    document.querySelectorAll('script[data-src]').forEach(function (el) {
      var s = document.createElement('script');
      s.src = el.getAttribute('data-src');
      if (el.getAttribute('data-async')) s.async = true;
      el.parentNode.replaceChild(s, el);
    });
    document.querySelectorAll('.consent-placeholder').forEach(function (el) {
      el.style.display = 'none';
    });
  }

  function showPlaceholders() {
    document.querySelectorAll('.consent-placeholder').forEach(function (el) {
      el.style.display = '';
    });
  }

  function hideBanner() {
    var b = document.getElementById('cookie-banner');
    if (b) b.style.display = 'none';
  }
  function showBanner() {
    var b = document.getElementById('cookie-banner');
    if (b) b.style.display = 'flex';
  }

  window.cookieAccept = function () {
    setConsent('accepted');
    hideBanner();
    enableEmbeds();
  };
  window.cookieDecline = function () {
    setConsent('declined');
    hideBanner();
    showPlaceholders();
  };

  document.addEventListener('DOMContentLoaded', function () {
    var consent = getConsent();
    if (consent === 'accepted') {
      enableEmbeds();
    } else if (consent === 'declined') {
      showPlaceholders();
    } else {
      showBanner();
    }
  });
}());

// Google Analytics 4. Loads only when a measurement ID is set in config.js.
(function () {
  "use strict";
  var id = window.KIPWELL_GA_ID;
  if (!id) return;
  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  // No ad features: Google signals and ad personalization stay off.
  window.gtag("config", id, { allow_google_signals: false, allow_ad_personalization_signals: false });
})();

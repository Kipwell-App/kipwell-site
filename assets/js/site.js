(function () {
  "use strict";

  // Quiet entrance: lift 8px and fade as each block comes into view.
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealEls = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("in"); io.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  // Join form
  var form = document.getElementById("join-form");
  if (!form) return;

  var fields = {
    name: { input: form.elements.name, error: document.getElementById("e-name"), message: "Enter your name." },
    studio: { input: form.elements.studio, error: document.getElementById("e-studio"), message: "Enter your gym’s name." },
    email: { input: form.elements.email, error: document.getElementById("e-email"), message: "Enter an email we can reach you at." },
    consent: { input: form.elements.consent, error: document.getElementById("e-consent"), message: "Check the box so we can email you." }
  };
  var submit = document.getElementById("f-submit");
  var status = document.getElementById("f-status");
  var card = document.getElementById("join-card");
  var thanks = document.getElementById("join-thanks");
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var saving = false;

  function valueOf(key) { return (fields[key].input.value || "").trim(); }

  function check(key) {
    var f = fields[key];
    var ok;
    if (key === "consent") ok = f.input.checked;
    else if (key === "email") ok = EMAIL_RE.test(valueOf("email"));
    else ok = valueOf(key).length > 0;
    f.error.textContent = ok ? "" : f.message;
    f.input.setAttribute("aria-invalid", ok ? "false" : "true");
    return ok;
  }

  // Clear a field's message as soon as it's fixed.
  Object.keys(fields).forEach(function (key) {
    var input = fields[key].input;
    input.addEventListener(key === "consent" ? "change" : "input", function () {
      if (input.getAttribute("aria-invalid") === "true") check(key);
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (saving) return;
    status.textContent = "";

    var firstBad = null;
    ["name", "studio", "email", "consent"].forEach(function (key) {
      if (!check(key) && !firstBad) firstBad = fields[key].input;
    });
    if (firstBad) { firstBad.focus(); return; }

    var payload = {
      name: valueOf("name"),
      studio: valueOf("studio"),
      email: valueOf("email").toLowerCase(),
      program: form.elements.program.value,
      consent: true,
      website: (form.elements.website.value || "").trim()
    };

    // Spam trap filled in: act as if it worked, send nothing.
    if (payload.website) { showThanks(payload); return; }

    var url = window.KIPWELL_SIGNUP_URL;
    if (!url) { fail(); return; }

    saving = true;
    submit.disabled = true;
    submit.textContent = "Joining…";

    // text/plain keeps this a simple request, which Apps Script accepts without a preflight.
    fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) })
      .then(function (res) { return res.ok ? res.json() : Promise.reject(new Error("HTTP " + res.status)); })
      .then(function (data) {
        if (data && data.ok) {
          // Count the signup in Analytics. Only the program is sent, never a name or email.
          if (window.gtag) window.gtag("event", "generate_lead", { program: payload.program });
          showThanks(payload);
        } else fail();
      })
      .catch(fail);
  });

  function fail() {
    saving = false;
    submit.disabled = false;
    submit.textContent = "Join the first gyms";
    status.textContent = "We couldn’t save that. Check your connection and try again.";
  }

  function showThanks(payload) {
    var first = payload.name.split(/\s+/)[0] || payload.name;
    document.getElementById("thanks-title").textContent = "Thanks, " + first + ". You’re on the list.";
    document.getElementById("thanks-body").textContent = "We’ll email " + payload.email + " to set up a time.";
    form.hidden = true;
    thanks.hidden = false;
    thanks.focus();
    card.setAttribute("data-done", "true");
  }
})();

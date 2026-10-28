/* Cookie consent for stay.ryst.in.
 *
 * Nothing that tracks a visitor runs until they agree: Google Analytics and
 * the Google Ads / Meta Pixel scripts are only added to the page after a
 * choice is saved here (Google Consent Mode v2 starts as "denied" for every
 * visitor). The choice is kept in this browser (localStorage "ryst_consent")
 * for 12 months and can be changed from "Cookie settings" in the footer.
 * A browser that sends Global Privacy Control is treated as "only necessary".
 *
 * Load this before the Google tag. The pages' own gtag()/fbq() calls keep
 * working: they queue, and run only if the visitor has agreed.
 */
(function () {
  'use strict';
  var KEY = 'ryst_consent', VERSION = 2, MAX_AGE = 365 * 864e5;
  var GA_ID = 'G-HXR1631D1Y', FB_ID = '1387854516865754';
  var loaded = { ga: false, fb: false };

  // gtag(): Consent Mode defaults, before anything from Google loads
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied', functionality_storage: 'denied', personalization_storage: 'denied', security_storage: 'granted', wait_for_update: 500 });
  // fbq(): the pixel's own queue, without loading its script
  if (!window.fbq) { var n = window.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; window._fbq = n; n.push = n; n.loaded = true; n.version = '2.0'; n.queue = []; }

  function read() {
    try { var c = JSON.parse(localStorage.getItem(KEY) || 'null'); if (c && c.v === VERSION && Date.now() - c.at < MAX_AGE) return c; } catch (e) {}
    return null;
  }
  function save(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} }
  function gpc() { return navigator.globalPrivacyControl === true; }

  function apply(c) {
    window.gtag('consent', 'update', { analytics_storage: c.analytics ? 'granted' : 'denied', ad_storage: c.ads ? 'granted' : 'denied', ad_user_data: c.ads ? 'granted' : 'denied', ad_personalization: c.ads ? 'granted' : 'denied' });
    if (c.analytics && !loaded.ga) { loaded.ga = true; var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID; document.head.appendChild(s); window.gtag('js', new Date()); window.gtag('config', GA_ID); }
    if (c.ads && !loaded.fb) { loaded.fb = true; var f = document.createElement('script'); f.async = true; f.src = 'https://connect.facebook.net/en_US/fbevents.js'; document.head.appendChild(f); window.fbq('init', FB_ID); window.fbq('track', 'PageView'); }
    document.documentElement.setAttribute('data-consent', (c.analytics ? 'a' : '') + (c.ads ? 'm' : '') || 'none');
  }

  var css = '.ck{position:fixed;left:12px;right:12px;bottom:12px;z-index:9000;max-width:560px;margin:0 auto;background:#102a2e;color:#f3f6f5;border-radius:18px;padding:18px 20px;box-shadow:0 18px 50px rgba(0,0,0,.35);font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}'
    + '.ck h2{font-size:16px;margin:0 0 6px;font-weight:650}.ck p{margin:0;color:#d5e0de;font-size:14px}.ck a{color:#f3ddae;text-decoration:underline}'
    + '.ck__opts{display:grid;gap:8px;margin:12px 0 4px}.ck__opts label{display:flex;gap:10px;align-items:flex-start;font-size:14px;color:#e8efed}.ck__opts input{width:18px;height:18px;margin-top:2px;accent-color:#e3c486}.ck__opts small{display:block;color:#a9bab7;font-size:12.5px}'
    + '.ck__btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.ck__btns button{font:inherit;font-size:14px;font-weight:600;border-radius:999px;padding:10px 16px;border:1px solid rgba(243,221,174,.5);background:transparent;color:#f3f6f5;cursor:pointer}'
    + '.ck__btns .ok{background:linear-gradient(135deg,#f3ddae,#e3c486 55%,#d4ad6a);color:#1a2c33;border-color:transparent}.ck__btns button:focus-visible{outline:2px solid #f3ddae;outline-offset:2px}'
    + '@media(max-width:480px){.ck{left:8px;right:8px;bottom:8px;padding:16px}.ck__btns button{flex:1;text-align:center}}';

  var box = null;
  function render(expanded) {
    if (!box) { var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); box = document.createElement('section'); box.className = 'ck'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-labelledby', 'ckTitle'); box.setAttribute('aria-describedby', 'ckText'); document.body.appendChild(box); }
    var cur = read() || { analytics: false, ads: false };
    box.innerHTML = '<h2 id="ckTitle">Cookies on this site</h2>'
      + '<p id="ckText">We use cookies only if you agree: to see how the site is used (Google Analytics) and to measure our ads (Google Ads, Meta). Nothing else tracks you. <a href="/cookies.html">Cookie policy</a></p>'
      + (expanded ? '<div class="ck__opts">'
        + '<label><input type="checkbox" checked disabled><span>Necessary<small>Your booking, check-in and cookie choice. Always on.</small></span></label>'
        + '<label><input type="checkbox" id="ckA"' + (cur.analytics ? ' checked' : '') + '><span>Analytics<small>Google Analytics: which pages are viewed and where visitors come from.</small></span></label>'
        + '<label><input type="checkbox" id="ckM"' + (cur.ads ? ' checked' : '') + '><span>Advertising<small>Google Ads and Meta (Facebook, Instagram): whether our ads led to a booking.</small></span></label></div>' : '')
      + '<div class="ck__btns">'
      + (expanded ? '<button type="button" class="ok" data-ck="save">Save my choice</button>' : '<button type="button" class="ok" data-ck="all">Accept all</button>')
      + '<button type="button" data-ck="none">Only necessary</button>'
      + (expanded ? '' : '<button type="button" data-ck="more">Choose</button>') + '</div>';
    box.hidden = false;
    var first = box.querySelector('button'); if (first) first.focus();
  }
  function decide(analytics, ads) { var c = { v: VERSION, at: Date.now(), analytics: !!analytics, ads: !!ads }; save(c); apply(c); if (box) box.hidden = true; }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-ck]'); if (!b) return;
    var k = b.getAttribute('data-ck');
    if (k === 'all') decide(true, true);
    else if (k === 'none') decide(false, false);
    else if (k === 'more') render(true);
    else if (k === 'save') decide(document.getElementById('ckA').checked, document.getElementById('ckM').checked);
    else if (k === 'open') { e.preventDefault(); render(true); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && box && !box.hidden && read()) box.hidden = true; });

  window.rystConsent = { open: function () { render(true); }, get: read };
  var saved = read();
  if (saved) apply(saved);
  else if (gpc()) decide(false, false); // Global Privacy Control: the browser already said no
  else if (document.body) render(false); else document.addEventListener('DOMContentLoaded', function () { render(false); });
})();

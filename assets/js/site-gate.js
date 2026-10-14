/* CloudLab site gate. Managed by the admin panel (Site controls); do not edit by hand. */
(function () {
  var CLOSED = false;
  var REDIRECT = "https://www.roblox.com/users/178415120/profile";
  var STATUS = "https://api.danny4686.com/v1/site-status";
  var root = document.documentElement;
  var settled = false;
  var timer = 0;

  function safe(url) { return typeof url === 'string' && /^https:\/\//i.test(url) ? url : REDIRECT; }
  function hide() { root.style.visibility = 'hidden'; }
  function show() { root.style.visibility = ''; }
  function leave(url) { hide(); window.location.replace(safe(url)); }
  function settle(status) {
    if (settled) return;
    settled = true;
    window.clearTimeout(timer);
    if (status && status.open === false) leave(status.redirect);
    else if (status && status.open === true) show();
    else if (CLOSED) leave(REDIRECT);
  }

  if (CLOSED) {
    hide();
    timer = window.setTimeout(function () { settle(null); }, 2500);
  }
  try {
    fetch(STATUS, { cache: 'no-store', credentials: 'omit' })
      .then(function (response) { return response.ok ? response.json() : null; })
      .then(settle, function () { settle(null); });
  } catch (error) {
    settle(null);
  }
})();

(() => {
  const header = document.querySelector('.site-header');
  const action = header?.querySelector('.header-cta');
  if (!header || !action) return;
  const label = action.querySelector('span:last-child');
  let confirmedSession = null;
  let sessionRequest = null;

  function render(session, unavailable = false) {
    action.classList.remove('is-authenticated', 'is-signed-out', 'is-checking', 'is-unavailable');
    if (unavailable) {
      action.href = '/account/';
      action.classList.add('is-unavailable');
      if (confirmedSession?.authenticated && confirmedSession.user?.username) {
        action.classList.add('is-authenticated');
        label.textContent = confirmedSession.user.username;
        action.setAttribute('aria-label', `Open ${confirmedSession.user.username}'s account; sync is reconnecting`);
      } else {
        label.textContent = 'Account';
        action.setAttribute('aria-label', 'Open account; account status is temporarily unavailable');
      }
      return;
    }
    confirmedSession = session;
    if (session?.authenticated && session.user?.username) {
      action.href = '/account/';
      action.classList.add('is-authenticated');
      label.textContent = session.user.username;
      action.setAttribute('aria-label', `Open ${session.user.username}'s CloudLab account`);
      return;
    }
    action.href = '/login/?next=%2F';
    action.classList.add('is-signed-out');
    label.textContent = 'Sign in / Sign up';
    action.setAttribute('aria-label', 'Sign in or create a CloudLab account');
  }

  action.classList.add('is-checking');
  action.href = '/account/';
  label.textContent = 'Account';
  action.setAttribute('aria-label', 'Checking CloudLab account status');

  function checkSession() {
    if (sessionRequest) return sessionRequest;
    sessionRequest = fetch('https://api.danny4686.com/v1/session', {
      credentials: 'include',
      headers: { Accept: 'application/json' }
    })
      .then(async (response) => {
        const session = await response.json().catch(() => null);
        if (!response.ok) throw new Error('Account status unavailable');
        return session;
      })
      .then((session) => render(session))
      .catch(() => render(confirmedSession, true))
      .finally(() => { sessionRequest = null; });
    return sessionRequest;
  }

  checkSession();
  window.addEventListener('focus', checkSession);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkSession();
  });
})();

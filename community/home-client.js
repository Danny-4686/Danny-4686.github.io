(() => {
  const header = document.querySelector('.site-header');
  const action = header?.querySelector('.header-cta');
  if (!header || !action) return;

  action.classList.add('community-account-action');
  action.href = '/login/?next=%2F';
  action.removeAttribute('target');
  action.removeAttribute('rel');
  action.setAttribute('aria-label', 'Sign in or create a CloudLab account');
  action.innerHTML = '<span class="community-account-dot" aria-hidden="true"></span><span>Sign in / Sign up</span>';

  fetch('https://api.danny4686.com/v1/session', {
    credentials: 'include',
    headers: { Accept: 'application/json' }
  })
    .then((response) => response.ok ? response.json() : null)
    .then((session) => {
      if (!session?.authenticated || !session.user?.username) return;
      action.href = '/account/';
      action.classList.add('is-authenticated');
      action.querySelector('span:last-child').textContent = session.user.username;
      action.setAttribute('aria-label', `Open ${session.user.username}'s CloudLab account`);
    })
    .catch(() => {});
})();

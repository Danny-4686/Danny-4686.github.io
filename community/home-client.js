(() => {
  const header = document.querySelector('.site-header');
  const action = header?.querySelector('.header-cta');
  if (!header || !action || header.querySelector('.community-header-actions')) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'community-header-actions community-home-actions';

  const account = document.createElement('a');
  account.className = 'community-account-link';
  account.href = '/login/?next=%2F';
  account.innerHTML = '<span class="community-account-dot" aria-hidden="true"></span><span>Sign in</span>';

  action.before(wrapper);
  wrapper.append(account, action);

  fetch('https://api.danny4686.com/v1/session', {
    credentials: 'include',
    headers: { Accept: 'application/json' }
  })
    .then((response) => response.ok ? response.json() : null)
    .then((session) => {
      if (!session?.authenticated || !session.user?.username) return;
      account.href = '/account/';
      account.classList.add('is-authenticated');
      account.querySelector('span:last-child').textContent = session.user.username;
      account.setAttribute('aria-label', `Open ${session.user.username}'s CloudLab account`);
    })
    .catch(() => {});
})();

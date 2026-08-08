(() => {
  const header = document.querySelector('.site-header');
  const action = header?.querySelector('.header-cta');
  if (!header || !action) return;

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

(() => {
  const API = 'https://api.danny4686.com/v1';
  const root = document.getElementById('profileSettings');
  if (!root) return;

  let csrfToken = '';
  let currentUser = null;
  let currentProfile = null;
  let usernameTimer = null;
  let usernameRequest = 0;

  const avatarImage = document.getElementById('profileAvatarImage');
  const avatarWrap = document.getElementById('profileAvatarWrap');
  const avatarPreview = document.getElementById('avatarSettingsPreview');
  const avatarInput = document.getElementById('avatarInput');
  const avatarChoose = document.getElementById('avatarChoose');
  const avatarRemove = document.getElementById('avatarRemove');
  const usernameForm = document.getElementById('usernameSettingsForm');
  const usernameInput = document.getElementById('settingsUsername');
  const usernamePasswordField = document.getElementById('settingsPasswordField');
  const usernamePassword = document.getElementById('settingsPassword');
  const usernameHint = document.getElementById('settingsUsernameHint');
  const usernameCooldown = document.getElementById('usernameCooldown');
  const usernameSave = document.getElementById('usernameSave');
  const profileDetailsForm = document.getElementById('profileDetailsForm');
  const statusInput = document.getElementById('profileStatusInput');
  const bioInput = document.getElementById('profileBioInput');
  const statusCount = document.getElementById('statusCount');
  const bioCount = document.getElementById('bioCount');
  const profileDetailsSave = document.getElementById('profileDetailsSave');
  const feedback = document.getElementById('profileSettingsFeedback');

  async function api(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    if (options.method && options.method !== 'GET' && csrfToken) headers.set('X-CloudLab-CSRF', csrfToken);
    const response = await fetch(`${API}${path}`, { ...options, headers, credentials: 'include' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || 'The account service could not complete that request.');
      error.data = data;
      throw error;
    }
    return data;
  }

  function showFeedback(message, type = '') {
    if (!feedback) return;
    feedback.hidden = !message;
    feedback.className = `profile-settings-feedback${type ? ` ${type}` : ''}`;
    feedback.textContent = message;
  }

  function setBusy(button, busy, busyText) {
    if (!button) return;
    if (!button.dataset.defaultText) button.dataset.defaultText = button.textContent;
    button.disabled = busy;
    button.textContent = busy ? busyText : button.dataset.defaultText;
  }

  function clearPasswordField() {
    if (!usernamePassword) return;
    usernamePassword.value = '';
    usernamePassword.type = 'password';
  }

  function setPasswordFieldAvailability(canChange) {
    clearPasswordField();
    if (usernamePasswordField) {
      usernamePasswordField.hidden = !canChange;
      usernamePasswordField.style.display = canChange ? '' : 'none';
    }
    if (usernamePassword) usernamePassword.disabled = !canChange;
  }

  function formatDate(value) {
    return new Date(value).toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function updateCharacterCounts() {
    if (statusCount && statusInput) statusCount.textContent = `${statusInput.value.length} / 20`;
    if (bioCount && bioInput) bioCount.textContent = `${bioInput.value.length} / 160`;
  }

  function applyAvatar(user) {
    const fallback = document.getElementById('profileAvatar');
    if (fallback) fallback.textContent = user.username.slice(0, 1).toUpperCase();
    if (!avatarImage || !avatarWrap) return;

    if (user.avatarUrl) {
      avatarImage.src = user.avatarUrl;
      avatarImage.hidden = false;
      avatarWrap.classList.add('has-image');
      if (avatarPreview) avatarPreview.src = user.avatarUrl;
      if (avatarRemove) avatarRemove.disabled = false;
    } else {
      avatarImage.removeAttribute('src');
      avatarImage.hidden = true;
      avatarWrap.classList.remove('has-image');
      if (avatarPreview) avatarPreview.src = '/assets/images/optimized/cloudlab-logo-256.webp';
      if (avatarRemove) avatarRemove.disabled = true;
    }
  }

  function applyUsernameState(user) {
    currentUser = user;
    const title = document.getElementById('profileUsername');
    const joined = document.getElementById('profileJoined');
    if (title) title.textContent = user.username;
    if (joined && user.createdAt) joined.textContent = `Account created ${formatDate(user.createdAt)}`;
    if (usernameInput) usernameInput.value = user.username;

    const canChange = Boolean(user.canChangeUsername);
    if (usernameInput) usernameInput.disabled = !canChange;
    setPasswordFieldAvailability(canChange);
    if (usernameSave) usernameSave.disabled = !canChange;

    if (!usernameCooldown || !usernameHint) return;
    if (canChange) {
      usernameCooldown.className = 'username-cooldown ready';
      usernameCooldown.textContent = 'Username change available. After changing it, the next change unlocks in 30 days.';
      usernameHint.textContent = '3–20 characters using letters, numbers, or underscores.';
      usernameHint.className = 'field-hint';
    } else if (user.usernameChangedAt) {
      usernameCooldown.className = 'username-cooldown locked';
      usernameCooldown.textContent = `Your next username change unlocks on ${formatDate(user.nextUsernameChangeAt)}.`;
    } else {
      usernameCooldown.className = 'username-cooldown locked';
      usernameCooldown.textContent = `New accounts can change their username after ${formatDate(user.nextUsernameChangeAt)}.`;
    }
  }

  function applyUser(user) {
    currentUser = user;
    applyAvatar(user);
    applyUsernameState(user);
  }

  function applyProfile(profile) {
    currentProfile = profile;
    const statusDisplay = document.getElementById('profileStatusDisplay');
    const bioDisplay = document.getElementById('profileBioDisplay');
    const statusText = String(profile.statusText || '');
    const bio = String(profile.bio || '');

    if (statusDisplay) {
      statusDisplay.textContent = statusText;
      statusDisplay.hidden = !statusText;
    }
    if (bioDisplay) bioDisplay.textContent = bio || 'No bio added yet.';
    if (statusInput) statusInput.value = statusText;
    if (bioInput) bioInput.value = bio;
    updateCharacterCounts();
  }

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const url = URL.createObjectURL(file);
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('That image could not be opened.'));
      };
      image.src = url;
    });
  }

  function renderSquare(image, size, quality) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d', { alpha: false });
    const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
    const sourceX = Math.max(0, (image.naturalWidth - sourceSize) / 2);
    const sourceY = Math.max(0, (image.naturalHeight - sourceSize) / 2);
    context.fillStyle = '#071219';
    context.fillRect(0, 0, size, size);
    context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);
    const webp = canvas.toDataURL('image/webp', quality);
    return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', quality);
  }

  function estimatedBytes(dataUrl) {
    const base64 = String(dataUrl).split(',')[1] || '';
    return Math.ceil(base64.length * 0.75);
  }

  async function prepareAvatar(file) {
    if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      throw new Error('Choose a PNG, JPG, or WebP image.');
    }
    if (file.size > 10 * 1024 * 1024) throw new Error('Choose an image smaller than 10 MB.');

    const image = await loadImage(file);
    let dataUrl = renderSquare(image, 256, 0.82);
    if (estimatedBytes(dataUrl) > 175000) dataUrl = renderSquare(image, 192, 0.7);
    if (estimatedBytes(dataUrl) > 175000) dataUrl = renderSquare(image, 128, 0.62);
    if (estimatedBytes(dataUrl) > 180000) throw new Error('That image could not be compressed enough. Choose a simpler image.');
    return dataUrl;
  }

  async function uploadAvatar(file) {
    try {
      showFeedback('');
      setBusy(avatarChoose, true, 'Saving…');
      const avatarData = await prepareAvatar(file);
      const data = await api('/profile/avatar', {
        method: 'POST',
        body: JSON.stringify({ avatarData })
      });
      applyUser(data.user);
      showFeedback('Profile picture updated.', 'success');
    } catch (error) {
      showFeedback(error.message, 'error');
    } finally {
      setBusy(avatarChoose, false);
      if (avatarInput) avatarInput.value = '';
    }
  }

  async function removeAvatar() {
    try {
      showFeedback('');
      setBusy(avatarRemove, true, 'Removing…');
      const data = await api('/profile/avatar', {
        method: 'POST',
        body: JSON.stringify({ avatarData: '' })
      });
      applyUser(data.user);
      showFeedback('Profile picture removed.', 'success');
    } catch (error) {
      showFeedback(error.message, 'error');
    } finally {
      setBusy(avatarRemove, false);
      if (!currentUser?.avatarUrl && avatarRemove) avatarRemove.disabled = true;
    }
  }

  async function checkUsername() {
    if (!usernameInput || !usernameHint || !currentUser?.canChangeUsername) return;
    const value = usernameInput.value.trim();
    const request = ++usernameRequest;
    if (value.toLowerCase() === currentUser.username.toLowerCase()) {
      usernameHint.textContent = 'This is your current username.';
      usernameHint.className = 'field-hint';
      return;
    }
    if (value.length < 3) {
      usernameHint.textContent = '3–20 characters using letters, numbers, or underscores.';
      usernameHint.className = 'field-hint';
      return;
    }

    try {
      const data = await api(`/username?name=${encodeURIComponent(value)}`);
      if (request !== usernameRequest) return;
      usernameHint.textContent = data.available ? `${data.username} is available.` : (data.error || 'That username is unavailable.');
      usernameHint.className = `field-hint ${data.available ? 'good' : 'bad'}`;
    } catch (error) {
      if (request !== usernameRequest) return;
      usernameHint.textContent = error.message;
      usernameHint.className = 'field-hint bad';
    }
  }

  async function changeUsername(event) {
    event.preventDefault();
    if (!currentUser?.canChangeUsername || !usernameInput || !usernamePassword) return;
    const username = usernameInput.value.trim();
    let password = usernamePassword.value;
    const requestBody = JSON.stringify({ username, password });
    password = '';
    clearPasswordField();

    try {
      showFeedback('');
      setBusy(usernameSave, true, 'Updating…');
      const data = await api('/profile/username', {
        method: 'POST',
        body: requestBody
      });
      csrfToken = data.csrfToken || csrfToken;
      applyUser(data.user);
      if (currentProfile) applyProfile({ ...currentProfile, username: data.user.username });
      showFeedback(`Your username is now ${data.user.username}. Your previous name is reserved for 7 days.`, 'success');
    } catch (error) {
      if (error.data?.nextUsernameChangeAt && usernameCooldown) {
        usernameCooldown.textContent = `Your next username change unlocks on ${formatDate(error.data.nextUsernameChangeAt)}.`;
      }
      showFeedback(error.message, 'error');
    } finally {
      clearPasswordField();
      setBusy(usernameSave, false);
      if (currentUser && !currentUser.canChangeUsername && usernameSave) usernameSave.disabled = true;
    }
  }

  async function saveProfileDetails(event) {
    event.preventDefault();
    if (!statusInput || !bioInput) return;
    try {
      showFeedback('');
      setBusy(profileDetailsSave, true, 'Saving…');
      const data = await api('/profile', {
        method: 'POST',
        body: JSON.stringify({
          statusText: statusInput.value.trim(),
          bio: bioInput.value.trim()
        })
      });
      applyProfile(data.profile);
      showFeedback('Your public profile has been updated.', 'success');
    } catch (error) {
      showFeedback(error.message, 'error');
    } finally {
      setBusy(profileDetailsSave, false);
    }
  }

  function connectEvents() {
    avatarChoose?.addEventListener('click', () => avatarInput?.click());
    avatarInput?.addEventListener('change', () => {
      const file = avatarInput.files?.[0];
      if (file) uploadAvatar(file);
    });
    avatarRemove?.addEventListener('click', removeAvatar);
    usernameForm?.addEventListener('submit', changeUsername);
    usernameInput?.addEventListener('input', () => {
      clearTimeout(usernameTimer);
      usernameTimer = setTimeout(checkUsername, 320);
    });
    profileDetailsForm?.addEventListener('submit', saveProfileDetails);
    statusInput?.addEventListener('input', updateCharacterCounts);
    bioInput?.addEventListener('input', updateCharacterCounts);
    window.addEventListener('pagehide', clearPasswordField);
  }

  async function init() {
    clearPasswordField();
    try {
      const session = await api('/session');
      if (!session.authenticated) return;
      csrfToken = session.csrfToken || '';
      applyUser(session.user);

      const profileData = await api('/profile');
      applyProfile(profileData.profile);
      connectEvents();
    } catch (error) {
      showFeedback(error.message, 'error');
    }
  }

  init();
})();

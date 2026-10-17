// CloudLab Clicker icon set. Each entry is the inner markup of a 24x24 line icon.
// Custom artwork wins: list an id in ART (file at /games/cloudlab-clicker/art/<id>.webp)
// and that image replaces the drawn icon everywhere it appears.
(function attachCloudLabClickerIcons(root) {
  const ART = new Set([]);
  const ART_BASE = '/games/cloudlab-clicker/art/';

  const PATHS = {
    clouds: '<path d="M7 18.5h10.2a4.3 4.3 0 0 0 .7-8.55A6 6 0 0 0 6.3 9.1 4.75 4.75 0 0 0 7 18.5Z"/>',
    // Buildings
    drone: '<path d="M6 8.5 10.4 20l1.9-4.9 4.9-1.9Z"/><path d="M13.5 5.5h7M17 5.5V9"/><circle cx="17" cy="9.6" r=".6"/>',
    farm: '<path d="M6.5 15.5h11a3.6 3.6 0 0 0 .5-7.15 5.4 5.4 0 0 0-10.35-.8A4 4 0 0 0 6.5 15.5Z"/><path d="M9 18.5v2M12 18v3M15 18.5v2"/>',
    station: '<path d="M12 11v10M8 21h8M9.2 21 12 11l2.8 10"/><circle cx="12" cy="8" r="2"/><path d="M7.6 4.2a6 6 0 0 0 0 7.6M16.4 4.2a6 6 0 0 1 0 7.6"/>',
    factory: '<path d="M3 21V11.5l5 3v-3l5 3V8h3V5h3v16Z"/><path d="M7 18h2M12 18h2M16 18h1"/>',
    bank: '<path d="m12 5.5 5 6.5-5 6.5L7 12Z"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-18 12 12)"/>',
    portal: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5"/><path d="M12 9.5a2.5 2.5 0 1 1-2.5 2.5"/>',
    foundry: '<path d="M12 2.5 13.8 9l6.7 1.2-6.7 1.6L12 18.5l-1.8-6.7-6.7-1.6L10.2 9Z"/><path d="M5 21.5h14"/>',
    reactor: '<path d="m12 2.5 8.2 4.75v9.5L12 21.5l-8.2-4.75v-9.5Z"/><path d="m13 7-3.5 5.5h4L11 17"/>',
    nexus: '<circle cx="12" cy="12" r="2.6"/><circle cx="4.5" cy="6" r="1.8"/><circle cx="19.5" cy="6" r="1.8"/><circle cx="4.5" cy="18" r="1.8"/><circle cx="19.5" cy="18" r="1.8"/><path d="m6 7.2 4 3.2M18 7.2l-4 3.2M6 16.8l4-3.2M18 16.8l-4-3.2"/>',
    // Research
    'tap-array': '<circle cx="12" cy="12" r="2.5"/><path d="M12 4.5v2M12 17.5v2M4.5 12h2M17.5 12h2M6.7 6.7l1.4 1.4M15.9 15.9l1.4 1.4M6.7 17.3l1.4-1.4M15.9 8.1l1.4-1.4"/>',
    'static-charge': '<path d="M13.5 2.5 5 13.5h6l-1.5 8 8.5-11h-6Z"/>',
    'drone-sync': '<path d="M20 7.5A8.5 8.5 0 0 0 4.6 9M4 16.5A8.5 8.5 0 0 0 19.4 15"/><path d="M20 3.5v4h-4M4 20.5v-4h4"/>',
    'cloud-seeding': '<path d="M7 14h10a3.5 3.5 0 0 0 .5-6.95 5.3 5.3 0 0 0-10.2-.65A3.8 3.8 0 0 0 7 14Z"/><path d="M8.5 17.5 7.5 20M12.5 17.5l-1 2.5M16.5 17.5l-1 2.5"/>',
    'weather-ai': '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9.5 2.5V6M14.5 2.5V6M9.5 18v3.5M14.5 18v3.5M2.5 9.5H6M2.5 14.5H6M18 9.5h3.5M18 14.5h3.5"/><path d="M10 12h4M12 10v4"/>',
    'storm-chaser': '<path d="M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7"/>',
    'golden-core': '<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>',
    'quantum-network': '<path d="M12 12c-2-2.6-3.6-4-5.5-4a4 4 0 0 0 0 8c1.9 0 3.5-1.4 5.5-4Zm0 0c2 2.6 3.6 4 5.5 4a4 4 0 0 0 0-8c-1.9 0-3.5 1.4-5.5 4Z"/>',
    'orbital-vault': '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="12" cy="12" r="3.5"/><path d="M12 8.5V7M15.5 12H17M7 19.5v1.5M17 19.5v1.5"/>',
    'stellar-forge': '<path d="M4 10h11l-1.5 4H8.5Z"/><path d="M10 14v3.5M6.5 20.5h7L12 17.5h-4ZM15 10l4.5-2"/><path d="m18.5 2.5.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7Z"/>',
    'nexus-link': '<path d="M10 13.5a4 4 0 0 0 6 .4l3-3a4 4 0 0 0-5.7-5.6l-1.5 1.5"/><path d="M14 10.5a4 4 0 0 0-6-.4l-3 3a4 4 0 0 0 5.7 5.6l1.5-1.5"/>',
    // Records and events
    record: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0Z"/><path d="M7 6H4.5a2.5 2.5 0 0 0 2.6 3.5M17 6h2.5a2.5 2.5 0 0 1-2.6 3.5"/>',
    press: '<path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.6a6 6 0 0 1-4.6-2.2L4.6 16a1.6 1.6 0 0 1 2.4-2.1L9 15.5"/>',
    architect: '<path d="M3 21h18M5 21V10l7-6 7 6v11"/><path d="M9.5 21v-6h5v6"/>',
    golden: '<path d="M7 18.5h10.2a4.3 4.3 0 0 0 .7-8.55A6 6 0 0 0 6.3 9.1 4.75 4.75 0 0 0 7 18.5Z" fill="currentColor" fill-opacity=".22"/><path d="m12 9.5.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8Z" fill="currentColor"/>',
    frenzy: '<path d="M13.5 2.5 5 13.5h6l-1.5 8 8.5-11h-6Z" fill="currentColor" fill-opacity=".25"/>',
    overdrive: '<circle cx="12" cy="12" r="8.5"/><path d="m12 7 1.6 3.4 3.7.5-2.7 2.6.7 3.7L12 15.4l-3.3 1.8.7-3.7-2.7-2.6 3.7-.5Z"/>',
    sound: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
    mute: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'
  };

  function icon(id, className = '') {
    const wrap = document.createElement('span');
    wrap.className = `cl-icon${className ? ` ${className}` : ''}`;
    wrap.setAttribute('aria-hidden', 'true');
    if (ART.has(id)) {
      const image = document.createElement('img');
      image.src = `${ART_BASE}${id}.webp`;
      image.alt = '';
      image.decoding = 'async';
      image.draggable = false;
      wrap.classList.add('has-art');
      wrap.appendChild(image);
      return wrap;
    }
    wrap.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${PATHS[id] || PATHS.clouds}</svg>`;
    return wrap;
  }

  root.CloudLabClickerIcons = Object.freeze({ icon, has: (id) => Boolean(PATHS[id]) || ART.has(id) });
})(window);

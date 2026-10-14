// Homepage portrait: switch between the profile artwork and a live 3D render of
// Danny4686's current Roblox avatar (proxied by api.danny4686.com, which re-checks
// Roblox every few minutes so avatar changes show up on their own).
const portrait = document.querySelector('.hero-portrait');
const artwork = portrait?.querySelector('.hero-profile');

if (portrait && artwork) {
  const API = 'https://api.danny4686.com/v1/roblox-avatar';
  const VENDOR = '/assets/vendor/three-0.179.1';
  const STORAGE_KEY = 'cloudlab-portrait-view';
  const REFRESH_MS = 5 * 60 * 1000;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const stage = document.createElement('div');
  stage.className = 'hero-avatar-3d';
  stage.setAttribute('role', 'img');
  stage.setAttribute('aria-label', 'Danny4686’s current Roblox avatar in 3D. Drag to rotate.');
  stage.hidden = true;

  const status = document.createElement('p');
  status.className = 'hero-avatar-status';
  status.setAttribute('role', 'status');
  status.hidden = true;

  const toggle = document.createElement('div');
  toggle.className = 'portrait-view-toggle';
  toggle.setAttribute('role', 'group');
  toggle.setAttribute('aria-label', 'Profile view');
  const buttons = {
    image: Object.assign(document.createElement('button'), { type: 'button', textContent: 'Image' }),
    '3d': Object.assign(document.createElement('button'), { type: 'button', textContent: '3D' })
  };
  buttons.image.dataset.view = 'image';
  buttons['3d'].dataset.view = '3d';
  toggle.append(buttons.image, buttons['3d']);
  artwork.after(stage, status);
  portrait.append(toggle);

  let viewer = null;
  let viewerPromise = null;
  let currentView = 'image';

  function readPreference() {
    try { return localStorage.getItem(STORAGE_KEY) === 'image' ? 'image' : '3d'; } catch { return '3d'; }
  }

  function savePreference(view) {
    try { localStorage.setItem(STORAGE_KEY, view); } catch {}
  }

  function showStatus(text) {
    status.textContent = text;
    status.hidden = !text;
  }

  function renderToggle() {
    Object.entries(buttons).forEach(([view, button]) => {
      button.setAttribute('aria-pressed', String(view === currentView));
    });
    portrait.dataset.portraitView = currentView;
  }

  function showImage() {
    stage.hidden = true;
    artwork.hidden = false;
    viewer?.pause();
  }

  async function showThreeD() {
    showStatus('Loading Roblox avatar…');
    try {
      viewerPromise ||= createViewer(stage);
      viewer = await viewerPromise;
      if (currentView !== '3d') return;
      showStatus('');
      artwork.hidden = true;
      stage.hidden = false;
      viewer.resume();
    } catch (error) {
      console.warn('Roblox 3D avatar unavailable; showing the profile image.', error);
      viewerPromise = null;
      if (currentView !== '3d') return;
      currentView = 'image';
      renderToggle();
      showImage();
      showStatus('3D avatar is unavailable right now.');
      window.setTimeout(() => showStatus(''), 4000);
    }
  }

  function setView(view, { remember = false } = {}) {
    currentView = view;
    if (remember) savePreference(view);
    renderToggle();
    if (view === '3d') showThreeD();
    else {
      showStatus('');
      showImage();
    }
  }

  toggle.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-view]');
    if (button && button.dataset.view !== currentView) setView(button.dataset.view, { remember: true });
  });

  function webglAvailable() {
    try {
      const canvas = document.createElement('canvas');
      return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
    } catch {
      return false;
    }
  }

  async function fetchManifest() {
    const response = await fetch(API, { credentials: 'omit' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.available) throw new Error(data.error || `Avatar ${data.state || 'unavailable'}`);
    return data;
  }

  async function createViewer(container) {
    const [THREE, { OBJLoader }, { MTLLoader }, { OrbitControls }, manifest] = await Promise.all([
      import(`${VENDOR}/three.module.min.js`),
      import(`${VENDOR}/OBJLoader.js`),
      import(`${VENDOR}/MTLLoader.js`),
      import(`${VENDOR}/OrbitControls.js`),
      fetchManifest()
    ]);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.append(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 1000);
    scene.add(new THREE.HemisphereLight(0xdff6ff, 0x16242c, 2.2));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(0.6, 1, 1);
    const rim = new THREE.DirectionalLight(0x68d0df, 1.4);
    rim.position.set(-1, 0.6, -1);
    scene.add(key, rim);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.minPolarAngle = Math.PI * 0.3;
    controls.maxPolarAngle = Math.PI * 0.62;
    controls.autoRotate = !reducedMotion;
    controls.autoRotateSpeed = 1.6;

    let model = null;
    let modelKey = '';
    let framing = null;

    async function loadModel(data) {
      const materials = await new MTLLoader().setCrossOrigin('anonymous').setResourcePath(data.assetBase).loadAsync(data.mtl);
      materials.preload();
      Object.values(materials.materials).forEach((material) => {
        if (material.map) {
          material.map.colorSpace = THREE.SRGBColorSpace;
          material.alphaTest = 0.05;
        }
      });
      const object = await new OBJLoader().setMaterials(materials).loadAsync(data.obj);

      const box = new THREE.Box3().setFromObject(object);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      object.position.sub(center);

      // Roblox supplies the camera it used for the thumbnail; keep its viewing
      // direction but recompute the distance so the whole avatar fits.
      const direction = data.camera?.position
        ? new THREE.Vector3(data.camera.position.x, data.camera.position.y, data.camera.position.z).sub(center)
        : new THREE.Vector3(0, 0.1, -1);
      direction.y = Math.min(Math.max(direction.y, -0.2 * direction.length()), 0.35 * direction.length());
      framing = { direction: direction.normalize(), size };
      fitCamera();

      if (model) {
        scene.remove(model);
        model.traverse((child) => {
          child.geometry?.dispose();
          [].concat(child.material || []).forEach((material) => { material.map?.dispose(); material.dispose(); });
        });
      }
      model = object;
      modelKey = data.obj;
      scene.add(model);
    }

    // Fit the avatar to the card, leaving room for the view toggle and name label.
    function fitCamera() {
      if (!framing) return;
      const { direction, size } = framing;
      const halfFov = Math.tan((camera.fov * Math.PI) / 360);
      const fitHeight = size.y / 2 / halfFov;
      const fitWidth = Math.max(size.x, size.z) / 2 / halfFov / camera.aspect;
      camera.position.copy(direction).multiplyScalar(Math.max(fitHeight, fitWidth) * 1.55);
      camera.near = Math.max(size.length() / 100, 0.01);
      camera.far = size.length() * 20;
      camera.updateProjectionMatrix();
      controls.target.set(0, -size.y * 0.05, 0);
      controls.update();
    }

    function resize() {
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      fitCamera();
    }

    await loadModel(manifest);

    let running = false;
    let visible = true;
    let frame = 0;
    function tick() {
      frame = 0;
      if (!running || !visible || document.hidden) return;
      controls.update();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(tick);
    }
    function start() {
      if (!frame && running && visible && !document.hidden) frame = requestAnimationFrame(tick);
    }

    new ResizeObserver(() => { resize(); renderer.render(scene, camera); }).observe(container);
    new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      start();
    }).observe(container);
    document.addEventListener('visibilitychange', start);
    resize();

    // Pick up avatar changes while the page stays open.
    window.setInterval(async () => {
      if (!running || document.hidden) return;
      try {
        const latest = await fetchManifest();
        if (latest.obj !== modelKey) await loadModel(latest);
      } catch {}
    }, REFRESH_MS);

    return {
      pause() { running = false; },
      resume() { running = true; resize(); start(); }
    };
  }

  if (!webglAvailable()) {
    buttons['3d'].disabled = true;
    buttons['3d'].title = '3D needs WebGL, which this browser does not support.';
    setView('image');
  } else {
    setView(readPreference());
  }
}

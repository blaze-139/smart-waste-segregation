/**
 * Smart Waste Segregation Assistant - 3D Interactive Waste Station
 * Powered by Three.js (r128)
 * Creates 4 interactive municipal waste bins with realistic materials,
 * physics-like lid pivots, shadows, floating particle effects, and mouse interaction.
 */

class WasteBin3DScene {
  constructor(canvasContainerId) {
    this.container = document.getElementById(canvasContainerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.bins = {};
    this.particles = null;
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.rotationAngleY = 0;
    this.targetRotationY = 0;
    this.currentCategory = null;
    this.animationFrameId = null;

    this.binConfigs = [
      { id: 'biodegradable', label: 'Organics', color: 0x3a4d39, x: -3.3, symbol: 'leaf' },
      { id: 'recyclable', label: 'Recycling', color: 0x394a59, x: -1.1, symbol: 'recycle' },
      { id: 'hazardous', label: 'Hazardous', color: 0x6b3d35, x: 1.1, symbol: 'hazard' },
      { id: 'ewaste', label: 'E-Waste', color: 0x4a443e, x: 3.3, symbol: 'chip' }
    ];

    this.init();
  }

  init() {
    if (typeof THREE === 'undefined') {
      console.warn('Three.js not loaded yet. Skipping 3D initialization.');
      return;
    }

    const width = this.container.clientWidth || 700;
    const height = this.container.clientHeight || 340;

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1e211e);
    this.scene.fog = new THREE.FogExp2(0x1e211e, 0.045);

    // 2. Camera setup
    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    this.camera.position.set(0, 3.2, 8.8);
    this.camera.lookAt(0, 0.4, 0);

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5e6, 0.95);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 25;
    this.scene.add(dirLight);

    const softFillLight = new THREE.PointLight(0xa5c49b, 0.5, 15);
    softFillLight.position.set(-5, 4, 3);
    this.scene.add(softFillLight);

    // 5. Floor Platform
    const floorGeo = new THREE.CylinderGeometry(6.5, 6.8, 0.35, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x272b27,
      roughness: 0.85,
      metalness: 0.15
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -1.15;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Floor Guide Rings
    const ringGeo = new THREE.RingGeometry(5.2, 5.25, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x3d433d, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.97;
    this.scene.add(ring);

    // 6. Build the 4 Waste Bins
    this.binConfigs.forEach(cfg => {
      const binGroup = this.createBinMesh(cfg);
      this.scene.add(binGroup);
      this.bins[cfg.id] = binGroup;
    });

    // 7. Ambient Floating Eco Particles
    this.createFloatingParticles();

    // 8. Event Listeners
    this.setupInteractions();
    window.addEventListener('resize', () => this.onResize());

    // 9. Animation Loop
    this.animate();
  }

  createBinMesh(cfg) {
    const group = new THREE.Group();
    group.position.set(cfg.x, 0, 0);
    group.userData = { id: cfg.id, targetLidAngle: 0, currentLidAngle: 0 };

    const bodyMat = new THREE.MeshStandardMaterial({
      color: cfg.color,
      roughness: 0.45,
      metalness: 0.2
    });

    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x222522,
      roughness: 0.6,
      metalness: 0.4
    });

    // Tapered Bin Body
    const bodyGeo = new THREE.CylinderGeometry(0.72, 0.6, 2.1, 24);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Top Rim Collar
    const rimGeo = new THREE.CylinderGeometry(0.78, 0.76, 0.18, 24);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.y = 1.08;
    rim.castShadow = true;
    group.add(rim);

    // Bottom Base Pad
    const baseGeo = new THREE.CylinderGeometry(0.66, 0.68, 0.15, 24);
    const base = new THREE.Mesh(baseGeo, rimMat);
    base.position.y = -1.0;
    group.add(base);

    // Front Identification Plate
    const plateGeo = new THREE.PlaneGeometry(0.55, 0.28);
    const plateMat = new THREE.MeshBasicMaterial({
      color: 0xe2e1d8,
      transparent: true,
      opacity: 0.85
    });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.set(0, 0.35, 0.68);
    group.add(plate);

    // Hinged Lid Pivot Group (placed at the back top edge)
    const lidPivot = new THREE.Group();
    lidPivot.position.set(0, 1.15, -0.65);

    const lidCoverGeo = new THREE.CylinderGeometry(0.79, 0.79, 0.16, 24);
    const lidCoverMat = new THREE.MeshStandardMaterial({
      color: cfg.color,
      roughness: 0.35,
      metalness: 0.3
    });
    const lidCover = new THREE.Mesh(lidCoverGeo, lidCoverMat);
    lidCover.position.set(0, 0.08, 0.65);
    lidCover.castShadow = true;
    lidPivot.add(lidCover);

    // Lid Handle
    const handleGeo = new THREE.TorusGeometry(0.18, 0.035, 8, 16, Math.PI);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.8, roughness: 0.2 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0, 0.18, 0.65);
    handle.rotation.x = Math.PI;
    lidPivot.add(handle);

    group.add(lidPivot);
    group.userData.lidPivot = lidPivot;

    // Glowing highlight spotlight under each bin
    const spotGeo = new THREE.CircleGeometry(0.85, 24);
    const spotMat = new THREE.MeshBasicMaterial({
      color: cfg.color,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide
    });
    const spot = new THREE.Mesh(spotGeo, spotMat);
    spot.rotation.x = -Math.PI / 2;
    spot.position.y = -0.96;
    group.add(spot);
    group.userData.spotMat = spotMat;

    return group;
  }

  createFloatingParticles() {
    const particleCount = 45;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 10;
      positions[i + 1] = Math.random() * 4 - 0.5;
      positions[i + 2] = (Math.random() - 0.5) * 6;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0x9ba098,
      size: 0.06,
      transparent: true,
      opacity: 0.55
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  setupInteractions() {
    const dom = this.renderer.domElement;

    dom.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    dom.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const deltaX = e.clientX - this.previousMousePosition.x;
        this.targetRotationY += deltaX * 0.006;
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    });

    // Touch support for mobile devices
    dom.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    });

    window.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    dom.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
        this.targetRotationY += deltaX * 0.008;
        this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    });

    // Raycast click detection on bins
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    dom.addEventListener('click', (e) => {
      const rect = dom.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera);
      const allMeshes = [];
      Object.values(this.bins).forEach(bg => {
        bg.traverse(child => { if (child.isMesh) allMeshes.push(child); });
      });

      const intersects = raycaster.intersectObjects(allMeshes);
      if (intersects.length > 0) {
        let hitMesh = intersects[0].object;
        let parentGroup = hitMesh.parent;
        while (parentGroup && !parentGroup.userData.id) {
          parentGroup = parentGroup.parent;
        }

        if (parentGroup && parentGroup.userData.id) {
          this.highlightBin(parentGroup.userData.id);
          // Broadcast custom event so the UI can respond
          window.dispatchEvent(new CustomEvent('bin3dClicked', { detail: { category: parentGroup.userData.id } }));
        }
      }
    });
  }

  highlightBin(categoryId) {
    this.currentCategory = categoryId;

    Object.keys(this.bins).forEach(id => {
      const bin = this.bins[id];
      if (id === categoryId) {
        bin.userData.targetLidAngle = -Math.PI * 0.45; // Open lid wide
        bin.userData.spotMat.opacity = 0.55; // Increase glow
        bin.position.y = 0.15; // Lift up slightly
      } else {
        bin.userData.targetLidAngle = 0; // Closed
        bin.userData.spotMat.opacity = 0.15;
        bin.position.y = 0;
      }
    });
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    // Smooth inertia for orbital rotation
    this.rotationAngleY += (this.targetRotationY - this.rotationAngleY) * 0.08;
    this.scene.rotation.y = this.rotationAngleY;

    // Smooth lid opening interpolation
    Object.values(this.bins).forEach(bin => {
      const lid = bin.userData.lidPivot;
      if (lid) {
        const target = bin.userData.targetLidAngle;
        lid.rotation.x += (target - lid.rotation.x) * 0.14;
      }
    });

    // Animate subtle floating particles
    if (this.particles) {
      this.particles.rotation.y += 0.001;
      const positions = this.particles.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += Math.sin(Date.now() * 0.001 + i) * 0.0015;
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.renderer && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

// Global instance keeper
let wasteBinSceneInstance = null;

function init3DScene() {
  if (document.getElementById('canvas-3d-bins')) {
    wasteBinSceneInstance = new WasteBin3DScene('canvas-3d-bins');
  }
}

// Global helper to open a specific bin from search or quiz
window.open3DBin = function(category) {
  if (wasteBinSceneInstance) {
    wasteBinSceneInstance.highlightBin(category);
  }
};

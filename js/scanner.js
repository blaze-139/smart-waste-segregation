/**
 * Smart Waste Segregation Assistant - AI Visual Waste Scanner Module
 * Coordinates the Scanner Modal, Live Webcam Capture, Dropzone, Preset Demos,
 * and seamless hand-off to the Gemini 3.5 Flash EcoSage Chat Engine.
 */

class WasteVisualScanner {
  constructor() {
    this.modal = null;
    this.mediaStream = null;
    this.stagedImage = null; // { base64, mimeType, dataUrl, name, size }
    this.searchStagedImage = null;
    this.openedFromThread = false;
    this.currentFacingMode = 'environment';
    this.countdownTimerId = null;
    this.audioCtx = null;
    this.init();
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.bindSearchScanner();
      this.bindModalElements();
      this.bindHeaderTrigger();
      this.bindGlobalKeyboardAndPaste();
    });
  }

  /**
   * Bind the live camera and photo upload buttons in the main search/chat bar
   */
  bindSearchScanner() {
    const livePhotoBtn = document.getElementById('search-live-photo-btn');
    const searchScanBtn = document.getElementById('search-scanner-btn');
    const searchFileInput = document.getElementById('search-image-file-input');
    const searchCameraInput = document.getElementById('search-camera-file-input');
    const searchStagedContainer = document.getElementById('search-staged-container');
    const searchStagedThumb = document.getElementById('search-staged-thumb');
    const searchStagedName = document.getElementById('search-staged-name');
    const searchStagedRemoveBtn = document.getElementById('search-staged-remove-btn');
    const searchInput = document.getElementById('search-input');
    const searchSubmitBtn = document.getElementById('search-submit-btn');

    // 1. Live Photo Button: Access camera, show live viewfinder, click & directly upload
    if (livePhotoBtn) {
      livePhotoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openLiveCameraModal(false);
      });
    }

    // 2. Upload Photo Button: Open device file picker / gallery
    if (searchScanBtn) {
      searchScanBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (searchFileInput) {
          searchFileInput.value = '';
          searchFileInput.click();
        } else {
          this.openModal('upload');
        }
      });
    }

    // Native Camera File Input (Direct mobile camera capture fallback)
    if (searchCameraInput) {
      searchCameraInput.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        try {
          const processed = await window.ecoSageAIEngine.compressAndConvertToBase64(file);
          this.closeModal();

          if (this.openedFromThread && window.ecoSageAIEngine && window.ecoSageAIEngine.submitLivePhotoToThread) {
            window.ecoSageAIEngine.submitLivePhotoToThread(processed);
            return;
          }

          this.setSearchStaged(processed);
          const currentSearchInput = document.getElementById('search-input');
          const query = (currentSearchInput && currentSearchInput.value.trim().length > 0)
            ? currentSearchInput.value.trim()
            : '📸 Live photo captured from device camera. Classify this item under EPA guidelines.';
          if (currentSearchInput) currentSearchInput.value = '';

          if (window.doAppSearch) {
            window.doAppSearch(query);
          } else if (searchSubmitBtn) {
            searchSubmitBtn.click();
          }
        } catch (err) {
          alert('Could not process camera photo: ' + err.message);
        }
      });
    }

    if (searchFileInput) {
      searchFileInput.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        try {
          const processed = await window.ecoSageAIEngine.compressAndConvertToBase64(file);
          this.setSearchStaged(processed);
        } catch (err) {
          alert('Could not process photo: ' + err.message);
        }
      });
    }

    const stagedSubmitBtn = document.getElementById('search-staged-submit-btn');
    if (stagedSubmitBtn && searchSubmitBtn) {
      stagedSubmitBtn.addEventListener('click', () => searchSubmitBtn.click());
    }

    if (searchStagedRemoveBtn) {
      searchStagedRemoveBtn.addEventListener('click', () => {
        this.setSearchStaged(null);
        if (searchFileInput) searchFileInput.value = '';
      });
    }

    // Drag-and-drop onto the search bar frame
    const searchFrame = document.querySelector('.search-bar-frame');
    if (searchFrame) {
      searchFrame.addEventListener('dragover', (e) => {
        e.preventDefault();
        searchFrame.style.borderColor = 'var(--bio-text)';
      });

      searchFrame.addEventListener('dragleave', (e) => {
        e.preventDefault();
        searchFrame.style.borderColor = '';
      });

      searchFrame.addEventListener('drop', async (e) => {
        e.preventDefault();
        searchFrame.style.borderColor = '';
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          const file = e.dataTransfer.files[0];
          try {
            const processed = await window.ecoSageAIEngine.compressAndConvertToBase64(file);
            this.setSearchStaged(processed);
          } catch (err) {
            alert('Could not load dropped image: ' + err.message);
          }
        }
      });
    }
  }

  setSearchStaged(item) {
    this.searchStagedImage = item;
    const container = document.getElementById('search-staged-container');
    const thumb = document.getElementById('search-staged-thumb');
    const name = document.getElementById('search-staged-name');
    const searchInput = document.getElementById('search-input');

    if (item && container && thumb && name) {
      thumb.src = item.dataUrl;
      name.textContent = item.name;
      container.style.display = 'flex';
      if (searchInput) {
        searchInput.placeholder = 'Photo attached! Hit Ask EcoSage AI or add a note...';
        searchInput.focus();
      }
    } else if (container) {
      container.style.display = 'none';
      if (searchInput) {
        searchInput.placeholder = "Ask EcoSage AI or search any item (e.g. 'Can I recycle greasy pizza box?', 'Lithium batteries')...";
      }
    }
  }

  bindHeaderTrigger() {
    const headerBtn = document.getElementById('header-scanner-trigger-btn');
    if (headerBtn) {
      headerBtn.addEventListener('click', () => this.openModal());
    }
  }

  /**
   * Bind modal internal controls, tabs, dropzone, webcam stream and presets
   */
  bindModalElements() {
    this.modal = document.getElementById('ai-scanner-modal');
    if (!this.modal) return;

    const closeBtn = document.getElementById('scanner-modal-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });

    // Scanner Tab switching
    const tabBtns = this.modal.querySelectorAll('.scanner-tab-btn');
    const viewUpload = document.getElementById('scanner-view-upload');
    const viewCamera = document.getElementById('scanner-view-camera');
    const viewPresets = document.getElementById('scanner-view-presets');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-scanner-tab');
        tabBtns.forEach(b => b.classList.toggle('is-active', b === btn));

        if (viewUpload) viewUpload.style.display = tab === 'upload' ? 'block' : 'none';
        if (viewCamera) {
          viewCamera.classList.toggle('is-active', tab === 'camera');
          if (tab === 'camera') {
            this.startCameraStream();
          } else {
            this.stopCameraStream();
          }
        }
        if (viewPresets) {
          viewPresets.classList.toggle('is-active', tab === 'presets');
        }
      });
    });

    // Dropzone logic
    const dropzone = document.getElementById('scanner-dropzone');
    const modalFileInput = document.getElementById('scanner-modal-file-input');

    if (dropzone && modalFileInput) {
      const dropzoneBtn = document.getElementById('scanner-dropzone-btn');
      if (dropzoneBtn) {
        dropzoneBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          modalFileInput.click();
        });
      }

      dropzone.addEventListener('click', () => modalFileInput.click());

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('is-dragover');
      });

      dropzone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropzone.classList.remove('is-dragover');
      });

      dropzone.addEventListener('drop', async (e) => {
        e.preventDefault();
        dropzone.classList.remove('is-dragover');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          const file = e.dataTransfer.files[0];
          try {
            const processed = await window.ecoSageAIEngine.compressAndConvertToBase64(file);
            this.showPreviewInModal(processed);
          } catch (err) {
            alert('Failed to read image: ' + err.message);
          }
        }
      });

      modalFileInput.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        try {
          const processed = await window.ecoSageAIEngine.compressAndConvertToBase64(file);
          this.showPreviewInModal(processed);
        } catch (err) {
          alert('Failed to read image: ' + err.message);
        }
      });
    }

    // Camera Shutter & Direct Upload logic
    const captureBtn = document.getElementById('scanner-capture-btn');
    if (captureBtn) {
      captureBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.captureCameraFrame(true);
      });
    }

    // Tap/Click on camera viewfinder also directly clicks & uploads
    const viewfinderBox = document.getElementById('scanner-viewfinder-box');
    if (viewfinderBox) {
      viewfinderBox.addEventListener('click', () => {
        if (this.mediaStream) {
          this.captureCameraFrame(true);
        }
      });
    }

    // Flip camera button
    const flipBtn = document.getElementById('scanner-flip-cam-btn');
    if (flipBtn) {
      flipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.flipCamera();
      });
    }

    // 3s Timer button
    const timerBtn = document.getElementById('scanner-timer-btn');
    if (timerBtn) {
      timerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.startCountdownTimer();
      });
    }

    // Preset Sample Waste Items
    const presetCards = this.modal.querySelectorAll('.scanner-preset-card');
    presetCards.forEach(card => {
      card.addEventListener('click', () => {
        const itemType = card.getAttribute('data-preset-type');
        const demoItem = this.generatePresetSample(itemType);
        if (demoItem) {
          this.showPreviewInModal(demoItem);
        }
      });
    });

    // Preview Card Action Buttons
    const startScanBtn = document.getElementById('scanner-start-btn');
    const stageToChatBtn = document.getElementById('scanner-stage-to-chat-btn');
    const cancelPreviewBtn = document.getElementById('scanner-cancel-btn');

    if (startScanBtn) {
      startScanBtn.addEventListener('click', () => {
        if (!this.stagedImage) return;
        this.submitScannedImageToChat(this.stagedImage);
      });
    }

    if (stageToChatBtn) {
      stageToChatBtn.addEventListener('click', () => {
        if (!this.stagedImage) return;
        const img = this.stagedImage;
        this.closeModal();
        this.setSearchStaged(img);
        const searchTabBtn = document.getElementById('tab-btn-search');
        if (searchTabBtn) searchTabBtn.click();
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.focus();
      });
    }

    if (cancelPreviewBtn) {
      cancelPreviewBtn.addEventListener('click', () => {
        this.resetModalPreview();
      });
    }
  }

  /**
   * Start live device camera stream (Webcam or mobile front/rear camera)
   */
  async startCameraStream() {
    const video = document.getElementById('scanner-camera-video');
    const fallbackSlot = document.getElementById('scanner-camera-fallback-slot');
    const statusText = document.getElementById('camera-status-text');
    if (!video) return;

    if (fallbackSlot) fallbackSlot.style.display = 'none';

    try {
      if (this.mediaStream) {
        this.stopCameraStream();
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: this.currentFacingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      video.srcObject = this.mediaStream;
      await video.play();

      if (statusText) {
        statusText.innerHTML = `Camera Active &bull; ${this.currentFacingMode === 'environment' ? 'Rear / Main' : 'Front'} Lens &bull; Click anywhere to snap & upload`;
      }
    } catch (err) {
      console.warn('Webcam stream unavailable:', err);
      if (statusText) {
        statusText.innerHTML = `Camera Notice: In-browser stream unavailable`;
      }
      if (fallbackSlot) {
        fallbackSlot.style.display = 'block';
        fallbackSlot.innerHTML = `
          <div class="scanner-camera-fallback-card">
            <div class="camera-fallback-icon">📸</div>
            <h4>Device Camera Access Blocked or Not Supported</h4>
            <p>You can snap a photo directly using your device's native camera app below:</p>
            <button type="button" id="scanner-native-cam-trigger" class="scanner-dropzone-upload-btn" style="background: linear-gradient(180deg, #178582 0%, #0F6674 100%) !important; color: #FFFFFF !important; border: 1px solid #23A39B !important;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #FFFFFF !important;">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
              <span style="color: #FFFFFF !important;">Open Device Camera & Snap</span>
            </button>
          </div>
        `;
        const nativeTrigger = document.getElementById('scanner-native-cam-trigger');
        if (nativeTrigger) {
          nativeTrigger.addEventListener('click', () => {
            const camInput = document.getElementById('search-camera-file-input');
            if (camInput) {
              camInput.value = '';
              camInput.click();
            }
          });
        }
      }
    }
  }

  /**
   * Flip between rear / environment camera and front / selfie camera
   */
  async flipCamera() {
    this.currentFacingMode = (this.currentFacingMode === 'environment') ? 'user' : 'environment';
    await this.startCameraStream();
  }

  /**
   * 3-Second countdown before auto-taking snapshot and directly uploading
   */
  startCountdownTimer() {
    if (this.countdownTimerId) {
      clearInterval(this.countdownTimerId);
      this.countdownTimerId = null;
    }

    const countdownEl = document.getElementById('camera-countdown-display');
    const timerBtnLabel = document.getElementById('timer-btn-label');
    if (!countdownEl) return;

    let count = 3;
    countdownEl.textContent = count;
    countdownEl.style.display = 'block';
    if (timerBtnLabel) timerBtnLabel.textContent = `${count}s...`;

    this.countdownTimerId = setInterval(() => {
      count--;
      if (count > 0) {
        countdownEl.textContent = count;
        if (timerBtnLabel) timerBtnLabel.textContent = `${count}s...`;
      } else {
        clearInterval(this.countdownTimerId);
        this.countdownTimerId = null;
        countdownEl.style.display = 'none';
        if (timerBtnLabel) timerBtnLabel.textContent = '3s Timer';
        this.captureCameraFrame(true);
      }
    }, 1000);
  }

  /**
   * Visual shutter flash animation
   */
  triggerCameraFlash() {
    const flash = document.getElementById('camera-flash-overlay');
    if (flash) {
      flash.classList.add('flashing');
      setTimeout(() => {
        flash.classList.remove('flashing');
      }, 140);
    }
  }

  /**
   * Synthesize mechanical camera shutter click sound via Web Audio API
   */
  playShutterSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) this.audioCtx = new AudioCtx();
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const ctx = this.audioCtx;
      const t = ctx.currentTime;

      // Click 1: high-frequency shutter click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(100, t + 0.04);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.04);

      // Click 2: release click
      setTimeout(() => {
        try {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          const t2 = ctx.currentTime;
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(1200, t2);
          osc2.frequency.exponentialRampToValueAtTime(150, t2 + 0.05);
          gain2.gain.setValueAtTime(0.3, t2);
          gain2.gain.exponentialRampToValueAtTime(0.01, t2 + 0.05);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start(t2);
          osc2.stop(t2 + 0.05);
        } catch (_) {}
      }, 55);
    } catch (_) {}
  }

  /**
   * Stop webcam stream to save battery and camera indicator
   */
  stopCameraStream() {
    if (this.countdownTimerId) {
      clearInterval(this.countdownTimerId);
      this.countdownTimerId = null;
    }
    const countdownEl = document.getElementById('camera-countdown-display');
    if (countdownEl) countdownEl.style.display = 'none';

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    const video = document.getElementById('scanner-camera-video');
    if (video) {
      video.srcObject = null;
    }
  }

  /**
   * Capture photo frame from camera and directly upload to chatbox/thread
   */
  captureCameraFrame(directUpload = true) {
    const video = document.getElementById('scanner-camera-video');
    if (!video || !this.mediaStream) return;

    // Trigger visual flash
    this.triggerCameraFlash();

    // Play camera shutter sound
    this.playShutterSound();

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    const base64 = dataUrl.split(',')[1];

    this.stopCameraStream();

    const snapshot = {
      base64,
      mimeType: 'image/jpeg',
      dataUrl,
      name: `live-camera-${Date.now()}.jpg`,
      size: Math.round(base64.length * 0.75)
    };

    if (directUpload) {
      this.closeModal();

      // If user opened live camera from inside the follow-up chat thread
      if (this.openedFromThread && window.ecoSageAIEngine && window.ecoSageAIEngine.submitLivePhotoToThread) {
        window.ecoSageAIEngine.submitLivePhotoToThread(snapshot);
        return;
      }

      // Default: Direct upload to search / chatbox
      this.setSearchStaged(snapshot);
      const searchTabBtn = document.getElementById('tab-btn-search');
      if (searchTabBtn) searchTabBtn.click();

      const searchInput = document.getElementById('search-input');
      const query = (searchInput && searchInput.value.trim().length > 0)
        ? searchInput.value.trim()
        : '📸 Live photo captured with device camera. Classify this item under EPA guidelines.';
      if (searchInput) searchInput.value = '';

      if (window.doAppSearch) {
        window.doAppSearch(query);
      } else {
        const searchSubmitBtn = document.getElementById('search-submit-btn');
        if (searchSubmitBtn) searchSubmitBtn.click();
      }
    } else {
      this.showPreviewInModal(snapshot);
    }
  }

  /**
   * Generate realistic SVG / Canvas image data for the 4 demo presets
   */
  generatePresetSample(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');

    // Dark sleek background
    ctx.fillStyle = '#161916';
    ctx.fillRect(0, 0, 400, 300);

    // Subtle background grid
    ctx.strokeStyle = '#232823';
    ctx.lineWidth = 1;
    for (let x = 0; x < 400; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 300);
      ctx.stroke();
    }
    for (let y = 0; y < 300; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(400, y);
      ctx.stroke();
    }

    if (type === 'bottle') {
      // Plastic water bottle (#1 PET)
      ctx.fillStyle = '#4A90E2';
      // Cap
      ctx.fillRect(185, 30, 30, 18);
      // Neck
      ctx.fillStyle = 'rgba(120, 200, 255, 0.4)';
      ctx.beginPath();
      ctx.moveTo(188, 48);
      ctx.lineTo(212, 48);
      ctx.lineTo(235, 90);
      ctx.lineTo(165, 90);
      ctx.closePath();
      ctx.fill();
      // Body
      ctx.fillStyle = 'rgba(140, 215, 255, 0.35)';
      ctx.strokeStyle = '#64B5F6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(165, 90, 70, 150, 10);
      ctx.fill();
      ctx.stroke();
      // Label
      ctx.fillStyle = '#1E88E5';
      ctx.fillRect(165, 135, 70, 45);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('PURE WATER', 168, 160);
      ctx.fillText('PETE #1', 182, 172);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      return {
        base64: dataUrl.split(',')[1],
        mimeType: 'image/jpeg',
        dataUrl,
        name: 'sample-plastic-water-bottle.jpg',
        size: 34000
      };
    }

    if (type === 'pizza') {
      // Greasy cardboard pizza box
      ctx.fillStyle = '#B08850';
      ctx.beginPath();
      ctx.roundRect(100, 80, 200, 140, 6);
      ctx.fill();
      ctx.strokeStyle = '#8D6E3F';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Top lid fold
      ctx.fillStyle = '#C49B5E';
      ctx.fillRect(100, 80, 200, 25);
      ctx.fillStyle = '#4E3629';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('FRESH PIZZA CO.', 140, 98);

      // Grease stains
      ctx.fillStyle = 'rgba(160, 100, 20, 0.55)';
      ctx.beginPath();
      ctx.arc(170, 155, 36, 0, Math.PI * 2);
      ctx.arc(220, 165, 28, 0, Math.PI * 2);
      ctx.fill();

      // Grease label
      ctx.fillStyle = '#D9534F';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('HEAVY OIL / CHEESE RESIDUE', 115, 195);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      return {
        base64: dataUrl.split(',')[1],
        mimeType: 'image/jpeg',
        dataUrl,
        name: 'sample-greasy-pizza-box.jpg',
        size: 38000
      };
    }

    if (type === 'battery') {
      // Lithium-Ion Battery
      ctx.fillStyle = '#2C3E50';
      ctx.beginPath();
      ctx.roundRect(160, 60, 80, 160, 8);
      ctx.fill();

      // Positive terminal
      ctx.fillStyle = '#BDC3C7';
      ctx.fillRect(188, 48, 24, 12);

      // Hazard Warning Stripes
      ctx.fillStyle = '#E74C3C';
      ctx.fillRect(160, 100, 80, 45);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('LITHIUM-ION', 165, 125);

      ctx.fillStyle = '#F1C40F';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('⚠️ CAUTION', 174, 140);
      ctx.fillText('DO NOT CRUSH', 166, 175);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      return {
        base64: dataUrl.split(',')[1],
        mimeType: 'image/jpeg',
        dataUrl,
        name: 'sample-lithium-ion-battery.jpg',
        size: 35000
      };
    }

    if (type === 'banana') {
      // Banana peel / food waste
      ctx.fillStyle = '#F4D03F';
      ctx.beginPath();
      ctx.arc(200, 150, 70, 0.4, 2.7);
      ctx.lineWidth = 26;
      ctx.strokeStyle = '#F4D03F';
      ctx.stroke();

      // Brown organic spots
      ctx.fillStyle = '#7D5218';
      ctx.beginPath();
      ctx.arc(170, 175, 4, 0, Math.PI * 2);
      ctx.arc(225, 185, 5, 0, Math.PI * 2);
      ctx.arc(195, 195, 4, 0, Math.PI * 2);
      ctx.arc(150, 140, 5, 0, Math.PI * 2);
      ctx.fill();

      // Stem
      ctx.fillStyle = '#5A3810';
      ctx.fillRect(135, 120, 14, 10);

      ctx.fillStyle = '#2ECC71';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('100% ORGANIC COMPOST', 130, 235);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      return {
        base64: dataUrl.split(',')[1],
        mimeType: 'image/jpeg',
        dataUrl,
        name: 'sample-banana-peel.jpg',
        size: 33000
      };
    }

    return null;
  }

  /**
   * Display preview card inside modal with animated laser sweep line
   */
  showPreviewInModal(imageItem) {
    this.stagedImage = imageItem;

    const previewCard = document.getElementById('scanner-preview-card');
    const previewImg = document.getElementById('scanner-preview-img');
    const views = [
      document.getElementById('scanner-view-upload'),
      document.getElementById('scanner-view-camera'),
      document.getElementById('scanner-view-presets')
    ];

    views.forEach(v => { if (v) v.style.display = 'none'; });

    if (previewCard && previewImg) {
      previewImg.src = imageItem.dataUrl;
      previewCard.classList.add('is-active');
    }
  }

  resetModalPreview(tab = 'upload') {
    this.stagedImage = null;
    const previewCard = document.getElementById('scanner-preview-card');
    if (previewCard) previewCard.classList.remove('is-active');

    const viewUpload = document.getElementById('scanner-view-upload');
    const viewCamera = document.getElementById('scanner-view-camera');
    const viewPresets = document.getElementById('scanner-view-presets');

    if (viewUpload) viewUpload.style.display = tab === 'upload' ? 'block' : 'none';
    if (viewPresets) viewPresets.classList.toggle('is-active', tab === 'presets');
    if (viewCamera) viewCamera.classList.toggle('is-active', tab === 'camera');

    if (this.modal) {
      const tabBtns = this.modal.querySelectorAll('.scanner-tab-btn');
      tabBtns.forEach(b => b.classList.toggle('is-active', b.getAttribute('data-scanner-tab') === tab));
    }
  }

  /**
   * Submit the scanned photo to the EcoSage AI chat engine
   */
  submitScannedImageToChat(imageItem) {
    this.closeModal();

    // Switch to search/chat tab if currently on another tab
    const searchTabBtn = document.getElementById('tab-btn-search');
    if (searchTabBtn) searchTabBtn.click();

    const resultContent = document.getElementById('result-content');
    if (resultContent && window.ecoSageAIEngine) {
      const searchInput = document.getElementById('search-input');
      const userText = (searchInput && searchInput.value.trim().length > 0) 
        ? searchInput.value.trim() 
        : '📸 Classify this item and determine which waste stream and bin it belongs to under EPA guidelines.';

      if (searchInput) searchInput.value = '';
      this.setSearchStaged(null);

      window.ecoSageAIEngine.handleDirectQuery(userText, resultContent, imageItem);
    }
  }

  /**
   * Launch live camera viewfinder directly
   */
  openLiveCameraModal(fromThread = false) {
    this.openedFromThread = fromThread;

    // Check if mediaDevices.getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const camInput = document.getElementById('search-camera-file-input');
      if (camInput) {
        camInput.value = '';
        camInput.click();
        return;
      }
    }

    this.openModal('camera');
  }

  openModal(defaultTab = 'upload') {
    if (!this.modal) {
      this.modal = document.getElementById('ai-scanner-modal');
    }
    if (this.modal) {
      this.modal.classList.add('is-active');
      this.resetModalPreview(defaultTab);
      document.body.style.overflow = 'hidden';

      if (defaultTab === 'camera') {
        this.startCameraStream();
      } else {
        this.stopCameraStream();
      }
    }
  }

  closeModal() {
    if (this.countdownTimerId) {
      clearInterval(this.countdownTimerId);
      this.countdownTimerId = null;
    }
    const countdownEl = document.getElementById('camera-countdown-display');
    if (countdownEl) countdownEl.style.display = 'none';
    const timerBtnLabel = document.getElementById('timer-btn-label');
    if (timerBtnLabel) timerBtnLabel.textContent = '3s Timer';

    if (this.modal) {
      this.modal.classList.remove('is-active');
      this.stopCameraStream();
      document.body.style.overflow = '';
    }
  }

  bindGlobalKeyboardAndPaste() {
    // Escape to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal && this.modal.classList.contains('is-active')) {
        this.closeModal();
      }
    });

    // Global image paste (Ctrl+V) anywhere on the page
    document.addEventListener('paste', async (e) => {
      // If already focusing on chat input, handled locally
      if (document.activeElement && document.activeElement.id === 'ai-thread-input') return;

      const items = e.clipboardData && e.clipboardData.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            try {
              const processed = await window.ecoSageAIEngine.compressAndConvertToBase64(file);
              this.setSearchStaged(processed);
              // Notification toast or smooth scroll to search
              const searchInput = document.getElementById('search-input');
              if (searchInput) {
                searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                searchInput.focus();
              }
            } catch (err) {
              console.warn('Global paste error:', err);
            }
          }
        }
      }
    });
  }
}

// Global instance
window.wasteVisualScanner = new WasteVisualScanner();

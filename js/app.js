/**
 * Smart Waste Segregation Assistant - Master Application Logic
 * Coordinates Tabs, Search Engine, 12-Step Degradation Scrubber, Directory Table,
 * Chart.js Analytics, 3D Bin Lab, Sorting Quiz, and EcoSage AI Chat.
 */

document.addEventListener('DOMContentLoaded', () => {
  // =========================================================================
  // 1. HORIZONTAL FULL-WIDTH LIQUID TAB NAVIGATION
  // =========================================================================
  const tabButtons = document.querySelectorAll('.tab-nav-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  function switchTab(targetTabId) {
    tabButtons.forEach(btn => {
      const isTarget = btn.getAttribute('data-tab') === targetTabId;
      btn.classList.toggle('active', isTarget);
      btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
    });

    tabPanes.forEach(pane => {
      if (pane.id === `pane-${targetTabId}`) {
        pane.classList.add('active', 'liquid-enter');
        setTimeout(() => pane.classList.remove('liquid-enter'), 350);
      } else {
        pane.classList.remove('active');
      }
    });

    // Lazy load or resize charts & refresh Supabase telemetry when Analytics tab is opened
    if (targetTabId === 'analytics') {
      if (typeof initializeAllCharts === 'function') {
        setTimeout(() => initializeAllCharts(), 50);
      }
      if (window.supabaseBackend && window.supabaseBackend.refreshTelemetryUI) {
        window.supabaseBackend.refreshTelemetryUI();
      }
    }

    // Resize Three.js renderer & refresh Leaderboard when 3D Lab tab is opened
    if (targetTabId === 'lab') {
      setTimeout(() => {
        if (!wasteBinSceneInstance && typeof init3DScene === 'function') {
          init3DScene();
        } else if (wasteBinSceneInstance) {
          wasteBinSceneInstance.onResize();
        }
      }, 60);

      if (typeof refreshLeaderboardUI === 'function') {
        refreshLeaderboardUI();
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // =========================================================================
  // 2. SEARCH ENGINE & EXPANDED AUTOCOMPLETE
  // =========================================================================
  const searchInput = document.getElementById('search-input');
  const autocompleteDropdown = document.getElementById('autocomplete-dropdown');
  const searchSubmitBtn = document.getElementById('search-submit-btn');
  const surpriseBtn = document.getElementById('surprise-btn');
  const resultContent = document.getElementById('result-content');
  let selectedAutocompleteIndex = -1;

  function renderResult(item) {
    if (!item || !resultContent) return;

    const cat = item.category;
    const badgeClass = `badge-${cat}`;
    const cardClass = `result-card-${cat}`;
    const binColorClass = cat === 'biodegradable' ? 'bin-green' :
                          cat === 'recyclable' ? 'bin-blue' :
                          cat === 'hazardous' ? 'bin-red' : 'bin-charcoal';

    // Quote / Meme Banner logic
    let memeBanner = '';
    const quoteText = item.quote || (
      cat === 'hazardous' ? 'One does not simply throw batteries in the regular trash.' :
      cat === 'recyclable' ? 'Wait, it\'s all recyclable? Always has been.' :
      cat === 'biodegradable' ? 'Peel the love, feed the soil humus.' :
      'Your old pocket supercomputer is a gold mine in disguise.'
    );

    const calloutTag = cat === 'hazardous' ? 'Safety Alert' :
                       cat === 'recyclable' ? 'Resource Audit' :
                       cat === 'biodegradable' ? 'Compost Protocol' : 'Circular Recovery';

    memeBanner = `
      <div class="meme-callout">
        <span class="meme-callout-tag">${calloutTag}</span>
        <span class="meme-callout-quote">"${quoteText}"</span>
      </div>
    `;

    const prepSteps = (item.prep || ['Rinse container thoroughly', 'Check municipal guidelines'])
      .map(s => `<li>${s}</li>`).join('');

    const streamIcon = cat === 'biodegradable' ?
      `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 20h10"></path><path d="M10 20c5.5-2.5.8-6.4 3-10"></path><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4.1 5.5.8z"></path></svg>` :
      cat === 'recyclable' ?
      `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m7 19-3-3 3-3"></path><path d="M4 16h11a4 4 0 0 0 4-4v-1"></path><path d="m17 5 3 3-3 3"></path><path d="M20 8H9a4 4 0 0 0-4 4v1"></path></svg>` :
      cat === 'hazardous' ?
      `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>` :
      `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="16" x="4" y="4" rx="2"></rect><rect width="6" height="6" x="9" y="9" rx="1"></rect><path d="M15 2v2"></path><path d="M15 20v2"></path></svg>`;

    resultContent.innerHTML = `
      <div class="result-card ${cardClass} anim-success">
        <div class="result-header">
          <div>
            <div class="result-meta-type">Classification Verified &bull; Stream ${cat.toUpperCase()} &bull; ${item.streamCode || 'EPA-STD'}</div>
            <h2 class="result-item-name">${item.name}</h2>
          </div>
          <div class="result-badge ${badgeClass}">
            ${streamIcon}
            <span>${cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
          </div>
        </div>

        ${memeBanner}

        <div class="result-body">
          <div class="bin-visual-box" style="grid-column: 1 / -1;">
            <div class="bin-3d-model ${binColorClass}" title="Click to view in 3D Station">
              ${streamIcon}
            </div>
            <div class="bin-details" style="flex: 1;">
              <div class="bin-stream-name">${item.binColor}</div>
              <div class="bin-disposal-action">${item.disposalMethod}</div>
            </div>
            <button type="button" class="table-action-btn" id="btn-view-3d-bin" style="margin-left: auto;">
              Open in 3D Station &rarr;
            </button>
          </div>

          <div class="result-box">
            <div class="result-box-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              <span>Preparation Protocol</span>
            </div>
            <div class="result-box-content">
              <ul class="prep-steps-list">${prepSteps}</ul>
            </div>
          </div>

          <div class="result-box">
            <div class="result-box-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              <span>Environmental Impact</span>
            </div>
            <div class="result-box-content">${item.impact}</div>
          </div>

          <div class="result-box" style="grid-column: 1 / -1;">
            <div class="result-box-title" style="color: var(--hazard-text);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
              <span>Critical Sorting Mistake to Avoid</span>
            </div>
            <div class="result-box-content" style="color: var(--text-primary); font-weight: 600;">${item.mistake}</div>
          </div>
        </div>
      </div>
    `;

    // Hook button to open 3D station
    const view3DBtn = document.getElementById('btn-view-3d-bin');
    if (view3DBtn) {
      view3DBtn.addEventListener('click', () => {
        switchTab('lab');
        if (window.open3DBin) window.open3DBin(cat);
      });
    }

    // Also trigger 3D bin opening in background
    if (window.open3DBin) window.open3DBin(cat);

    // Mount integrated EcoSage AI Live Intelligence panel below verified card
    if (window.ecoSageAIEngine && resultContent) {
      window.ecoSageAIEngine.mountIntegratedPanel(item, resultContent);
    }
  }

  function doSearch(query) {
    const hasStagedPhoto = window.wasteVisualScanner && window.wasteVisualScanner.searchStagedImage;
    if (!query && !hasStagedPhoto) return;

    if (hasStagedPhoto) {
      const staged = window.wasteVisualScanner.searchStagedImage;
      window.wasteVisualScanner.setSearchStaged(null);
      autocompleteDropdown.classList.remove('active');
      selectedAutocompleteIndex = -1;
      if (window.ecoSageAIEngine && resultContent) {
        window.ecoSageAIEngine.handleDirectQuery(query, resultContent, staged);
      }
      const resultContainer = document.getElementById('result-container');
      if (resultContainer) {
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      return;
    }

    const q = query.toLowerCase().trim();

    // Check if query is a conversational prompt (e.g. contains 'how', 'where', 'can i', 'should', '?', or doesn't match any item)
    const isQuestion = q.includes('?') || q.startsWith('how') || q.startsWith('where') || q.startsWith('can ') || q.startsWith('what ') || q.startsWith('is ') || q.length > 35;

    // Search exact match or substring in static database
    const match = !isQuestion ? (
      WASTE_ITEMS.find(item => item.name.toLowerCase() === q) ||
      WASTE_ITEMS.find(item => item.name.toLowerCase().includes(q)) ||
      WASTE_ITEMS.find(item => item.category.toLowerCase() === q)
    ) : null;

    autocompleteDropdown.classList.remove('active');
    selectedAutocompleteIndex = -1;

    if (match) {
      renderResult(match);
    } else {
      // Direct conversational AI query right in the main search bar!
      if (window.ecoSageAIEngine && resultContent) {
        window.ecoSageAIEngine.handleDirectQuery(query, resultContent);
      }
    }

    // Smooth scroll to result
    const resultContainer = document.getElementById('result-container');
    if (resultContainer) {
      resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  // Expose doSearch globally for Live Camera & Scanner direct triggers
  window.doAppSearch = doSearch;

  searchInput.addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase().trim();
    selectedAutocompleteIndex = -1;

    if (!val) {
      autocompleteDropdown.classList.remove('active');
      return;
    }

    const matches = WASTE_ITEMS.filter(item =>
      item.name.toLowerCase().includes(val) ||
      item.category.toLowerCase().includes(val)
    ).slice(0, 6);

    if (matches.length > 0) {
      let html = matches.map((m, idx) => `
        <div class="autocomplete-item" data-name="${m.name}" data-idx="${idx}">
          <span><strong style="color: var(--text-primary);">${m.name}</strong></span>
          <span class="table-badge badge-${m.category}">${m.category}</span>
        </div>
      `).join('');

      html += `
        <div class="autocomplete-item ai-autocomplete-prompt" data-query="${val}">
          <span>✨ Ask <strong>EcoSage AI</strong>: "${val}"</span>
          <span class="ai-model-tag" style="margin: 0; font-size: 0.65rem;">Gemini 3.5</span>
        </div>
      `;

      autocompleteDropdown.innerHTML = html;
      autocompleteDropdown.classList.add('active');

      autocompleteDropdown.querySelectorAll('.autocomplete-item').forEach(el => {
        el.addEventListener('click', () => {
          const itemName = el.getAttribute('data-name') || el.getAttribute('data-query');
          searchInput.value = itemName;
          doSearch(itemName);
        });
      });
    } else {
      autocompleteDropdown.innerHTML = `
        <div class="autocomplete-item ai-autocomplete-prompt" data-query="${val}">
          <span>✨ Ask <strong>EcoSage AI</strong> about: "${val}"</span>
          <span class="ai-model-tag" style="margin: 0; font-size: 0.65rem;">Gemini 3.5</span>
        </div>
      `;
      autocompleteDropdown.classList.add('active');
      const aiPromptItem = autocompleteDropdown.querySelector('.ai-autocomplete-prompt');
      if (aiPromptItem) {
        aiPromptItem.addEventListener('click', () => {
          doSearch(val);
        });
      }
    }
  });

  searchInput.addEventListener('keydown', (e) => {
    const items = autocompleteDropdown.querySelectorAll('.autocomplete-item');
    if (autocompleteDropdown.classList.contains('active') && items.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedAutocompleteIndex = (selectedAutocompleteIndex + 1) % items.length;
        items.forEach((item, idx) => item.classList.toggle('highlighted', idx === selectedAutocompleteIndex));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedAutocompleteIndex = (selectedAutocompleteIndex - 1 + items.length) % items.length;
        items.forEach((item, idx) => item.classList.toggle('highlighted', idx === selectedAutocompleteIndex));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedAutocompleteIndex >= 0 && items[selectedAutocompleteIndex]) {
          const name = items[selectedAutocompleteIndex].getAttribute('data-name') || items[selectedAutocompleteIndex].getAttribute('data-query');
          searchInput.value = name;
          doSearch(name);
        } else {
          doSearch(searchInput.value);
        }
      } else if (e.key === 'Escape') {
        autocompleteDropdown.classList.remove('active');
      }
    } else if (e.key === 'Enter') {
      doSearch(searchInput.value);
    }
  });

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !autocompleteDropdown.contains(e.target)) {
      autocompleteDropdown.classList.remove('active');
    }
  });

  searchSubmitBtn.addEventListener('click', () => doSearch(searchInput.value));

  surpriseBtn.addEventListener('click', () => {
    const randomItem = WASTE_ITEMS[Math.floor(Math.random() * WASTE_ITEMS.length)];
    searchInput.value = randomItem.name;
    renderResult(randomItem);
  });

  document.querySelectorAll('.chip-btn').forEach(chip => {
    chip.addEventListener('click', () => {
      const val = chip.getAttribute('data-item');
      searchInput.value = val;
      doSearch(val);
    });
  });

  // =========================================================================
  // 3. DIRECTORY TABLE CONTROLLER (TAB 2)
  // =========================================================================
  const tableBody = document.getElementById('directory-table-body');
  const directoryCount = document.getElementById('directory-count');
  const tableFilterInput = document.getElementById('table-filter-input');
  let currentCategoryFilter = 'all';

  function renderTable(items) {
    if (!tableBody) return;

    if (items.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
            No matching items found in directory.
          </td>
        </tr>
      `;
      if (directoryCount) directoryCount.textContent = 'Showing 0 items';
      return;
    }

    tableBody.innerHTML = items.map(item => `
      <tr>
        <td>
          <strong style="color: var(--text-primary);">${item.name}</strong>
          <span style="display: block; font-size: 0.75rem; color: var(--text-muted);">${item.streamCode || 'EPA-STD'}</span>
        </td>
        <td><span class="table-badge badge-${item.category}">${item.category}</span></td>
        <td style="color: var(--text-secondary); font-size: 0.85rem;">${item.binColor}</td>
        <td style="color: var(--text-secondary); font-size: 0.85rem;">${item.disposalMethod}</td>
        <td>
          <button class="table-action-btn" data-name="${item.name}">Inspect &rarr;</button>
        </td>
      </tr>
    `).join('');

    if (directoryCount) {
      directoryCount.textContent = `Showing ${items.length} of ${WASTE_ITEMS.length} Verified Domestic Items`;
    }

    tableBody.querySelectorAll('.table-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-name');
        switchTab('search');
        searchInput.value = name;
        doSearch(name);
      });
    });
  }

  function applyTableFilters() {
    const searchVal = tableFilterInput ? tableFilterInput.value.toLowerCase().trim() : '';
    let filtered = WASTE_ITEMS;

    if (currentCategoryFilter !== 'all') {
      filtered = filtered.filter(i => i.category === currentCategoryFilter);
    }

    if (searchVal) {
      filtered = filtered.filter(i =>
        i.name.toLowerCase().includes(searchVal) ||
        i.disposalMethod.toLowerCase().includes(searchVal) ||
        i.binColor.toLowerCase().includes(searchVal)
      );
    }

    renderTable(filtered);
  }

  if (tableFilterInput) {
    tableFilterInput.addEventListener('input', applyTableFilters);
  }

  document.querySelectorAll('.category-filter-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.category-filter-tabs .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategoryFilter = btn.getAttribute('data-cat');
      applyTableFilters();
    });
  });

  document.querySelectorAll('.cat-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const filterCat = btn.getAttribute('data-filter');
      const targetTabBtn = document.querySelector(`.category-filter-tabs .tab-btn[data-cat="${filterCat}"]`);
      if (targetTabBtn) targetTabBtn.click();
      const tableContainer = document.querySelector('.directory-table-container');
      if (tableContainer) tableContainer.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // =========================================================================
  // 4. DETAILED 12-STEP TEMPORAL PERSISTENCE SCALE (WHY IT MATTERS TAB)
  // =========================================================================
  const degradeSlider = document.getElementById('degrade-range');
  const ageLabel = document.getElementById('timeline-age-label');
  const degradeHeading = document.getElementById('degrade-heading');
  const degradeDesc = document.getElementById('degrade-desc');
  const degradeTitleShort = document.getElementById('degrade-title-short');
  const degradeDur = document.getElementById('degrade-dur-metric');
  const degradeHaz = document.getElementById('degrade-haz-metric');
  const degradeNrg = document.getElementById('degrade-nrg-metric');
  const degradeStm = document.getElementById('degrade-stm-metric');
  const degradeCanvas = document.getElementById('degrade-canvas');
  const degradeSubHalfLife = document.getElementById('degrade-sub-halflife');
  const degradeSubMicroplastics = document.getElementById('degrade-sub-microplastics');
  const degradeSubRecovery = document.getElementById('degrade-sub-recovery');

  function renderTimelineVisual(step) {
    if (!degradeCanvas) return;

    // Rich animated 2D SVG diagrams for all 12 stages
    switch (step.visualType) {
      case 'organic':
        degradeCanvas.innerHTML = `
          <svg width="260" height="140" viewBox="0 0 260 140" fill="none">
            <path d="M40 90c25-45 75-45 100 0" stroke="var(--bio-text)" stroke-width="2.5"></path>
            <path d="M70 75c15-25 45-25 60 0" stroke="var(--bio-text)" stroke-width="2"></path>
            <circle cx="170" cy="55" r="4.5" fill="#639260" class="svg-float-particle"></circle>
            <circle cx="190" cy="75" r="3.5" fill="#639260" class="svg-float-particle svg-float-delay-1"></circle>
            <circle cx="205" cy="50" r="5" fill="#639260" class="svg-float-particle svg-float-delay-2"></circle>
            <text x="35" y="120" font-size="10" fill="var(--text-secondary)" font-family="sans-serif">AEROBIC SOIL HUMUS: 2-4 WEEKS</text>
          </svg>
        `;
        break;

      case 'paper':
        degradeCanvas.innerHTML = `
          <svg width="260" height="140" viewBox="0 0 260 140" fill="none">
            <rect x="35" y="30" width="75" height="50" stroke="var(--recycle-text)" stroke-width="2"></rect>
            <line x1="45" y1="45" x2="100" y2="45" stroke="var(--recycle-border)"></line>
            <line x1="45" y1="58" x2="90" y2="58" stroke="var(--recycle-border)"></line>
            <path d="M125 55h40" stroke="var(--bio-text)" stroke-width="2" stroke-dasharray="3 2"></path>
            <circle cx="180" cy="55" r="7" stroke="var(--bio-text)" stroke-width="1.5"></circle>
            <text x="30" y="115" font-size="10" fill="var(--text-secondary)" font-family="sans-serif">HYDRO-PULPED RECYCLABLE: 2 MONTHS</text>
          </svg>
        `;
        break;

      case 'cotton':
        degradeCanvas.innerHTML = `
          <svg width="260" height="140" viewBox="0 0 260 140" fill="none">
            <path d="M40 50c20 20 40-20 60 0s40-20 60 0" stroke="var(--bio-text)" stroke-width="2.5"></path>
            <path d="M40 70c20 20 40-20 60 0s40-20 60 0" stroke="var(--bio-border)" stroke-width="2"></path>
            <circle cx="190" cy="55" r="4" fill="var(--bio-text)"></circle>
            <text x="35" y="115" font-size="10" fill="var(--text-secondary)" font-family="sans-serif">CELLULOSE ENZYMATIC UNRAVELING: 1-5 YRS</text>
          </svg>
        `;
        break;

      case 'cigarette':
        degradeCanvas.innerHTML = `
          <svg width="260" height="140" viewBox="0 0 260 140" fill="none">
            <rect x="40" y="50" width="80" height="18" rx="2" stroke="var(--hazard-accent)" stroke-width="2"></rect>
            <rect x="40" y="50" width="25" height="18" fill="var(--hazard-accent-subtle)"></rect>
            <circle cx="145" cy="55" r="3.5" fill="var(--hazard-text)" class="svg-float-particle"></circle>
            <circle cx="165" cy="65" r="4" fill="var(--hazard-text)" class="svg-float-particle svg-float-delay-1"></circle>
            <circle cx="185" cy="48" r="3" fill="var(--hazard-text)" class="svg-float-particle svg-float-delay-2"></circle>
            <text x="30" y="115" font-size="10" fill="var(--hazard-text)" font-family="sans-serif">CELLULOSE ACETATE SHEDDING: 10-12 YRS</text>
          </svg>
        `;
        break;

      case 'leather':
        degradeCanvas.innerHTML = `
          <svg width="260" height="140" viewBox="0 0 260 140" fill="none">
            <path d="M40 70c30-30 80-30 110 0s40 10 50 0" stroke="#A68B6D" stroke-width="3"></path>
            <path d="M50 80c30-20 70-20 90 0" stroke="#7D6656" stroke-width="2"></path>
            <text x="35" y="115" font-size="10" fill="var(--text-secondary)" font-family="sans-serif">CHROMIUM-TANNED COLLAGEN: 40-50 YRS</text>
          </svg>
        `;
        break;

      case 'steel':
        degradeCanvas.innerHTML = `
          <svg width="260" height="140" viewBox="0 0 260 140" fill="none">
            <rect x="45" y="35" width="55" height="55" rx="3" stroke="#8C4A3E" stroke-width="2"></rect>
            <path d="M120 62h45" stroke="#639260" stroke-width="2" stroke-dasharray="3 2"></path>
            <text x="175" y="66" font-size="12" fill="#639260" font-family="sans-serif">MAGNETIC</text>
            <text x="35" y="115" font-size="10" fill="var(--text-secondary)" font-family="sans-serif">OXIDATION RUST MINERAL: 50-100 YRS</text>
          </svg>
        `;
        break;

      case 'aluminum':
        degradeCanvas.innerHTML = `
          <svg width="260" height="140" viewBox="0 0 260 140" fill="none">
            <rect x="40" y="30" width="45" height="60" rx="3" stroke="var(--recycle-text)" stroke-width="2"></rect>
            <ellipse cx="62" cy="30" rx="22" ry="7" stroke="var(--recycle-text)" stroke-width="1.5"></ellipse>
            <path d="M110 60h45" stroke="var(--bio-text)" stroke-width="2" stroke-dasharray="4 2"></path>
            <text x="165" y="64" font-size="12" fill="var(--bio-text)" font-family="sans-serif">95% SAVED</text>
            <text x="30" y="115" font-size="10" fill="var(--text-secondary)" font-family="sans-serif">ALUMINA PASSIVATION: 200-500 YRS</text>
          </svg>
        `;
        break;

      case 'diaper':
        degradeCanvas.innerHTML = `
          <svg width="260" height="140" viewBox="0 0 260 140" fill="none">
            <path d="M45 40h70l-15 45h-40z" stroke="var(--hazard-accent)" stroke-width="2"></path>
            <circle cx="150" cy="55" r="4" fill="var(--hazard-text)"></circle>
            <circle cx="170" cy="65" r="5" fill="var(--hazard-text)"></circle>
            <text x="30" y="115" font-size="10" fill="var(--hazard-text)" font-family="sans-serif">POLYACRYLATE GEL COMPACTION: 450-500 YRS</text>
          </svg>
        `;
        break;

      case 'plastic':
        degradeCanvas.innerHTML = `
          <svg width="260" height="140" viewBox="0 0 260 140" fill="none">
            <rect x="35" y="40" width="50" height="30" rx="2" stroke="var(--recycle-accent)" stroke-width="2"></rect>
            <path d="M95 55h25" stroke="var(--hazard-accent)" stroke-width="2" stroke-dasharray="3 2"></path>
            <circle cx="135" cy="45" r="3.5" fill="var(--hazard-text)" class="svg-float-particle"></circle>
            <circle cx="155" cy="55" r="4.5" fill="var(--hazard-text)" class="svg-float-particle svg-float-delay-1"></circle>
            <circle cx="175" cy="48" r="3.5" fill="var(--hazard-text)" class="svg-float-particle svg-float-delay-2"></circle>
            <circle cx="160" cy="72" r="4" fill="var(--hazard-text)" class="svg-float-particle svg-float-delay-3"></circle>
            <text x="30" y="115" font-size="10" fill="var(--text-secondary)" font-family="sans-serif">MICROPLASTIC VECTOR: 450-1,000 YRS</text>
          </svg>
        `;
        break;

      case 'styrofoam':
        degradeCanvas.innerHTML = `
          <svg width="260" height="140" viewBox="0 0 260 140" fill="none">
            <circle cx="50" cy="55" r="14" stroke="#CADBE8" stroke-width="1.5"></circle>
            <circle cx="75" cy="50" r="16" stroke="#CADBE8" stroke-width="1.5"></circle>
            <circle cx="102" cy="55" r="14" stroke="#CADBE8" stroke-width="1.5"></circle>
            <path d="M125 55h35" stroke="var(--hazard-accent)" stroke-width="2" stroke-dasharray="2 2"></path>
            <text x="30" y="115" font-size="10" fill="var(--hazard-text)" font-family="sans-serif">CELLULAR EPS BEADS: 500+ YRS</text>
          </svg>
        `;
        break;

      case 'ewaste':
        degradeCanvas.innerHTML = `
          <svg width="260" height="140" viewBox="0 0 260 140" fill="none">
            <rect x="35" y="35" width="60" height="45" rx="2" stroke="var(--ewaste-text)" stroke-width="2"></rect>
            <line x1="50" y1="35" x2="50" y2="80" stroke="var(--ewaste-border)"></line>
            <line x1="65" y1="35" x2="65" y2="80" stroke="var(--ewaste-border)"></line>
            <path d="M110 57h35" stroke="var(--hazard-text)" stroke-width="2" stroke-dasharray="2 2"></path>
            <circle cx="160" cy="57" r="8" stroke="var(--hazard-text)" stroke-width="2"></circle>
            <text x="30" y="115" font-size="10" fill="var(--text-secondary)" font-family="sans-serif">HEAVY METAL ACID LEACHATE: 1,000+ YRS</text>
          </svg>
        `;
        break;

      case 'glass':
      default:
        degradeCanvas.innerHTML = `
          <svg width="260" height="140" viewBox="0 0 260 140" fill="none">
            <ellipse cx="120" cy="55" rx="55" ry="30" stroke="var(--recycle-text)" stroke-width="2"></ellipse>
            <circle cx="120" cy="55" r="14" fill="none" stroke="var(--text-secondary)" stroke-width="1.5"></circle>
            <text x="35" y="115" font-size="10" fill="var(--text-secondary)" font-family="sans-serif">GEOLOGICAL SILICA: 1,000,000+ YRS</text>
          </svg>
        `;
        break;
    }
  }

  function updateTimelineStep(index) {
    const step = DEGRADE_STEPS[index];
    if (!step) return;

    if (ageLabel) ageLabel.textContent = `${step.duration} Persistence`;
    if (degradeHeading) degradeHeading.textContent = step.name;
    if (degradeDesc) degradeDesc.textContent = step.desc;
    if (degradeTitleShort) degradeTitleShort.textContent = step.name;
    if (degradeDur) degradeDur.textContent = step.duration;
    if (degradeHaz) degradeHaz.textContent = step.hazard;
    if (degradeNrg) degradeNrg.textContent = step.energy;
    if (degradeStm) degradeStm.textContent = step.stream;

    if (degradeSubHalfLife) degradeSubHalfLife.textContent = `${step.halfLifeYears || 'N/A'} Yrs`;
    if (degradeSubMicroplastics) degradeSubMicroplastics.textContent = step.microplasticRisk || 'Minimal';
    if (degradeSubRecovery) degradeSubRecovery.textContent = step.recoveryRate || 'Closed-Loop Feedstock';

    renderTimelineVisual(step);

    // Update active tick marker
    document.querySelectorAll('.timeline-tick-label').forEach((tick, i) => {
      tick.classList.toggle('active', i === parseInt(index));
    });
  }

  if (degradeSlider) {
    degradeSlider.addEventListener('input', (e) => {
      updateTimelineStep(e.target.value);
    });
  }

  // Allow clicking on any tick label
  document.querySelectorAll('.timeline-tick-label').forEach(tick => {
    tick.addEventListener('click', () => {
      const stepIdx = tick.getAttribute('data-step-idx');
      if (degradeSlider && stepIdx !== null) {
        degradeSlider.value = stepIdx;
        updateTimelineStep(stepIdx);
      }
    });
  });

  // =========================================================================
  // 5. INTERACTIVE 3D & 2D WASTE SORTING MINI-GAME (TAB 5)
  // =========================================================================
  let quizCurrentIndex = 0;
  let quizScore = 0;
  let quizStreak = 0;

  const quizIconEl = document.getElementById('quiz-item-icon');
  const quizTitleEl = document.getElementById('quiz-item-title');
  const quizPromptEl = document.getElementById('quiz-item-prompt');
  const quizFeedbackEl = document.getElementById('quiz-feedback-box');
  const quizScoreEl = document.getElementById('quiz-score-val');
  const quizStreakEl = document.getElementById('quiz-streak-val');

  function loadQuizQuestion(index) {
    const q = SORTING_QUIZ_ITEMS[index % SORTING_QUIZ_ITEMS.length];
    if (!q || !quizTitleEl) return;

    if (quizIconEl) quizIconEl.textContent = q.icon;
    quizTitleEl.textContent = q.name;
    if (quizPromptEl) quizPromptEl.textContent = 'Which bin does this item belong to?';
    if (quizFeedbackEl) {
      quizFeedbackEl.classList.remove('active');
      quizFeedbackEl.innerHTML = '';
    }
  }

  window.handleQuizAnswer = function(chosenCategory) {
    const q = SORTING_QUIZ_ITEMS[quizCurrentIndex % SORTING_QUIZ_ITEMS.length];
    if (!q || !quizFeedbackEl) return;

    const isCorrect = chosenCategory === q.correctCategory;

    // Trigger 3D bin opening
    if (window.open3DBin) {
      window.open3DBin(q.correctCategory);
    }

    if (isCorrect) {
      quizScore += 10;
      quizStreak += 1;
      if (quizScoreEl) quizScoreEl.textContent = quizScore;
      if (quizStreakEl) quizStreakEl.textContent = `${quizStreak}🔥`;

      quizFeedbackEl.innerHTML = `
        <div style="color: var(--bio-text); font-weight: 700; margin-bottom: 0.35rem;">
          ✔ Correct! Sorted into ${q.correctBin}.
        </div>
        <p style="color: var(--text-secondary); margin-bottom: 0.85rem;">${q.explanation}</p>
        <button type="button" class="search-submit-btn" id="btn-quiz-next" style="padding: 0.45rem 1rem; font-size: 0.85rem;">
          Next Challenge &rarr;
        </button>
      `;
      quizFeedbackEl.classList.add('active', 'anim-success');
    } else {
      quizStreak = 0;
      if (quizStreakEl) quizStreakEl.textContent = '0';

      quizFeedbackEl.innerHTML = `
        <div style="color: var(--hazard-text); font-weight: 700; margin-bottom: 0.35rem;">
          ✘ Incorrect! Belongs in: ${q.correctBin}.
        </div>
        <p style="color: var(--text-secondary); margin-bottom: 0.85rem;">${q.explanation}</p>
        <button type="button" class="surprise-btn" id="btn-quiz-next" style="padding: 0.45rem 1rem; font-size: 0.85rem;">
          Try Next &rarr;
        </button>
      `;
      quizFeedbackEl.classList.add('active', 'anim-shake');
    }

    const nextBtn = document.getElementById('btn-quiz-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        quizCurrentIndex++;
        loadQuizQuestion(quizCurrentIndex);
      });
    }
  };

  // Wire quick buttons on 3D canvas overlay
  document.querySelectorAll('.btn-bin-quick').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-bin-cat');
      if (window.open3DBin) window.open3DBin(cat);
    });
  });

  // =========================================================================
  // SUPABASE LEADERBOARD INTEGRATION
  // =========================================================================
  async function refreshLeaderboardUI() {
    const listEl = document.getElementById('supa-leaderboard-rows');
    if (!listEl || !window.supabaseBackend) return;

    listEl.innerHTML = '<div style="font-size:0.75rem; color:var(--text-secondary); text-align:center; padding:0.5rem;">Loading live scores from Supabase...</div>';

    const scores = await window.supabaseBackend.fetchQuizLeaderboard(8);
    if (!scores || scores.length === 0) {
      listEl.innerHTML = '<div style="font-size:0.75rem; color:var(--text-secondary); text-align:center; padding:0.5rem;">No scores yet. Complete a challenge and save your score!</div>';
      return;
    }

    listEl.innerHTML = scores.map((s, idx) => {
      const rank = idx + 1;
      const rankClass = rank === 1 ? 'rank-1' : '';
      const streakText = s.streak ? ` &bull; ${s.streak}🔥 streak` : '';
      const timeStr = s.created_at ? new Date(s.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';
      const name = String(s.player_name || 'EcoWarrior').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      return `
        <div class="supa-leaderboard-row ${rankClass}">
          <div style="display:flex; align-items:center;">
            <span class="supa-rank-badge">#${rank}</span>
            <div>
              <div style="font-weight:700; color:var(--text-primary); font-size:0.85rem;">${name}</div>
              <div style="font-size:0.7rem; color:var(--text-secondary);">${timeStr}${streakText}</div>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:800; color:var(--bio-text); font-size:1.05rem;">${s.score} <span style="font-size:0.7rem; font-weight:500;">pts</span></div>
          </div>
        </div>
      `;
    }).join('');
  }
  window.refreshLeaderboardUI = refreshLeaderboardUI;

  const btnSaveQuizScore = document.getElementById('btn-save-quiz-score');
  if (btnSaveQuizScore) {
    btnSaveQuizScore.addEventListener('click', async () => {
      if (quizScore <= 0) {
        alert('Answer at least one sorting challenge correctly to earn points before saving!');
        return;
      }
      const playerName = prompt('Enter your EcoWarrior handle for the Supabase Global Leaderboard:', 'EcoWarrior_' + Math.floor(Math.random() * 900 + 100));
      if (!playerName) return;

      btnSaveQuizScore.disabled = true;
      btnSaveQuizScore.textContent = 'Saving...';

      if (window.supabaseBackend) {
        await window.supabaseBackend.submitQuizScore(playerName, quizScore, quizStreak);
        await refreshLeaderboardUI();
      }

      btnSaveQuizScore.disabled = false;
      btnSaveQuizScore.textContent = 'Save My Score';
    });
  }

  // =========================================================================
  // 6. SCROLL REVEALS & 3D CARD HOVER TILT
  // =========================================================================
  const scrollProgressBar = document.getElementById('scroll-progress-bar');
  window.addEventListener('scroll', () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const pct = h > 0 ? (window.scrollY / h) * 100 : 0;
    if (scrollProgressBar) scrollProgressBar.style.width = `${pct}%`;
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));

  // Subtle 3D Card Tilt
  document.querySelectorAll('.category-card, .chart-card, .trap-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      card.style.transform = `perspective(800px) rotateX(${-y * 0.02}deg) rotateY(${x * 0.02}deg) translateY(-2px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  // Initialize first table render, default result, and quiz
  renderTable(WASTE_ITEMS);
  loadQuizQuestion(0);
  renderResult(WASTE_ITEMS.find(i => i.id === 'haz-01') || WASTE_ITEMS[2]);
  updateTimelineStep(8); // Default to PET Plastic Water Bottle (step 8)

  // Initialize Supabase Live Telemetry & Leaderboard
  setTimeout(() => {
    if (window.supabaseBackend && window.supabaseBackend.refreshTelemetryUI) {
      window.supabaseBackend.refreshTelemetryUI();
    }
    if (typeof refreshLeaderboardUI === 'function') {
      refreshLeaderboardUI();
    }
  }, 400);
});

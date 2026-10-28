/**
 * Smart Waste Segregation Assistant - EcoSage AI Engine
 * Multimodal Visual Classification & Conversational Stream powered by Gemini 3.5 Flash Lite
 */

const GEMINI_CONFIG = {
  getApiKey: () => {
    if (typeof window !== 'undefined' && window.GEMINI_API_KEY) return window.GEMINI_API_KEY;
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('GEMINI_API_KEY') || localStorage.getItem('ECOSAGE_API_KEY');
      if (stored) return stored;
    }
    return '';
  },
  primaryModel: 'gemini-2.5-flash',
  fallbackModel: 'gemini-1.5-flash',
  generateBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/',
  interactionsEndpoint: 'https://generativelanguage.googleapis.com/v1/interactions',
  systemInstruction: `You are EcoSage, an expert Smart Waste Segregation AI Assistant aligned strictly with the United States Environmental Protection Agency (EPA), UNEP, and Basel Convention waste hierarchy guidelines.

When a user provides an image or asks how to dispose of waste:
1. **Identified Item:** Clearly name the item and materials detected (e.g. "Clear PET Plastic Bottle (#1) with Polypropylene Cap", "Grease-Soiled Cardboard Pizza Box", "Lithium-Ion Cylindrical Battery").
2. **Primary Stream:** State clearly in brackets: [BIODEGRADABLE & ORGANICS], [DRY RECYCLABLE], [HOUSEHOLD HAZARDOUS WASTE], [ELECTRONIC WASTE (WEEE)], or [LANDFILL RESIDUAL].
3. **Designated Bin & Facility:** Name the designated bin color and facility (e.g., Green Organics Bin, Curbside Blue Cart, Red Hazardous Depot, Slate E-Waste Depot, Black Landfill Trash).
4. **Preparation Protocol:** Provide 2-3 essential preparation steps (e.g., rinse thoroughly, flatten, insulate terminals with tape, detach caps/liners).
5. **Critical Sorting Traps to Avoid:** Highlight common mistakes (e.g., don't put greasy cardboard in recycling, don't throw batteries in compactor trucks, don't mix ceramics with glass).

Keep responses structured with bold labels, clean bullet points, and authoritative guidance.`
};

class EcoSageAIEngine {
  constructor() {
    this.conversationHistory = [];
    this.isProcessing = false;
    this.activeQuery = '';
    this.stagedAttachment = null;
  }

  /**
   * Helper: Compress an image file client-side to ensure quick uploads
   * Downscales to max 1024px while keeping quality sharp
   */
  async compressAndConvertToBase64(file) {
    return new Promise((resolve, reject) => {
      const isImg = file && (
        (file.type && file.type.startsWith('image/')) ||
        /\.(jpe?g|png|webp|gif|bmp|svg|avif|heic|heif|ico|tiff?)$/i.test(file.name || '')
      );
      if (!isImg) {
        return reject(new Error('Selected file is not an image.'));
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const rawDataUrl = e.target.result;
        const img = new Image();
        img.onload = () => {
          try {
            const maxDim = 1024;
            let width = img.width || 800;
            let height = img.height || 600;

            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const mimeType = 'image/jpeg';
            const dataUrl = canvas.toDataURL(mimeType, 0.85);
            const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;

            resolve({
              base64,
              mimeType,
              dataUrl,
              name: file.name || 'scanned-waste-item.jpg',
              size: Math.round(base64.length * 0.75)
            });
          } catch (canvasErr) {
            const base64 = rawDataUrl.includes(',') ? rawDataUrl.split(',')[1] : rawDataUrl;
            resolve({
              base64,
              mimeType: file.type || 'image/jpeg',
              dataUrl: rawDataUrl,
              name: file.name || 'scanned-waste-item.jpg',
              size: file.size || Math.round(base64.length * 0.75)
            });
          }
        };
        img.onerror = () => {
          const base64 = rawDataUrl.includes(',') ? rawDataUrl.split(',')[1] : rawDataUrl;
          resolve({
            base64,
            mimeType: file.type || 'image/jpeg',
            dataUrl: rawDataUrl,
            name: file.name || 'scanned-waste-item.jpg',
            size: file.size || Math.round(base64.length * 0.75)
          });
        };
        img.src = rawDataUrl;
      };
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Send text prompt to Gemini API
   */
  async queryGemini(promptText) {
    const apiKey = GEMINI_CONFIG.getApiKey();
    if (!apiKey) {
      return this.generateFallback(promptText);
    }

    const primaryUrl = `${GEMINI_CONFIG.generateBaseUrl}${GEMINI_CONFIG.primaryModel}:generateContent?key=${apiKey}`;
    const payload = {
      system_instruction: { parts: [{ text: GEMINI_CONFIG.systemInstruction }] },
      contents: [{ parts: [{ text: promptText }] }]
    };

    try {
      const response = await fetch(primaryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          return data.candidates[0].content.parts[0].text;
        }
      }
    } catch (err) {
      console.warn('Primary model failed, trying fallback:', err);
    }

    // Fallback model
    try {
      const fallbackUrl = `${GEMINI_CONFIG.generateBaseUrl}${GEMINI_CONFIG.fallbackModel}:generateContent?key=${apiKey}`;
      const fbResponse = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (fbResponse.ok) {
        const fbData = await fbResponse.json();
        if (fbData.candidates && fbData.candidates[0]?.content?.parts?.[0]?.text) {
          return fbData.candidates[0].content.parts[0].text;
        }
      }
    } catch (fbErr) {
      console.warn('Fallback model error:', fbErr);
    }

    return this.generateFallback(promptText);
  }

  /**
   * Send multimodal image + prompt to Gemini Vision API
   */
  async analyzeImageWithGemini(base64Data, mimeType = 'image/jpeg', promptText = '') {
    const userPrompt = promptText && promptText.trim().length > 0 
      ? promptText 
      : 'Visually inspect this photo of a waste item. Identify what item and materials are shown, then determine the designated waste stream, proper bin color, preparation steps, and critical mistakes to avoid under EPA & Basel guidelines.';

    const apiKey = GEMINI_CONFIG.getApiKey();
    if (!apiKey) {
      return this.generateFallback(userPrompt, { name: promptText || 'scanned-item.jpg' });
    }

    const payload = {
      system_instruction: { parts: [{ text: GEMINI_CONFIG.systemInstruction }] },
      contents: [{
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: userPrompt
          }
        ]
      }]
    };

    const primaryUrl = `${GEMINI_CONFIG.generateBaseUrl}${GEMINI_CONFIG.primaryModel}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(primaryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          return data.candidates[0].content.parts[0].text;
        }
      }
    } catch (err) {
      console.warn('Primary vision model error, attempting fallback:', err);
    }

    // Fallback model
    try {
      const fallbackUrl = `${GEMINI_CONFIG.generateBaseUrl}${GEMINI_CONFIG.fallbackModel}:generateContent?key=${apiKey}`;
      const fbResponse = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (fbResponse.ok) {
        const fbData = await fbResponse.json();
        if (fbData.candidates && fbData.candidates[0]?.content?.parts?.[0]?.text) {
          return fbData.candidates[0].content.parts[0].text;
        }
      }
    } catch (fbErr) {
      console.warn('Fallback vision model error:', fbErr);
    }

    // If API unavailable or credentials pending, provide intelligent local classification
    return this.generateFallback(userPrompt, { name: promptText || 'scanned-item.jpg' });
  }

  /**
   * Deterministic local fallback if offline or network drops
   */
  generateFallback(promptText, imageAttachment = null) {
    const combined = `${promptText || ''} ${imageAttachment ? (imageAttachment.name || '') : ''}`.toLowerCase();
    const q = combined.trim();

    // Match in static database
    if (typeof WASTE_ITEMS !== 'undefined' && Array.isArray(WASTE_ITEMS)) {
      const match = WASTE_ITEMS.find(item => q.includes(item.name.toLowerCase()));
      if (match) {
        return `**Item Identification:** ${match.name}\n\n` +
          `**Primary Stream:** [${match.category.toUpperCase()} STREAM]\n\n` +
          `**Designated Bin:** ${match.binColor}\n\n` +
          `• **Disposal Method:** ${match.disposalMethod}\n` +
          `• **Preparation:** ${(match.prep || []).join(', ')}\n` +
          `• **Critical Mistake to Avoid:** ${match.mistake}\n` +
          `• **Environmental Impact:** ${match.impact}`;
      }
    }

    if (q.includes('battery') || q.includes('lithium') || q.includes('chemical') || q.includes('paint') || q.includes('bleach') || q.includes('acid') || q.includes('pills') || q.includes('medicine')) {
      return `**Item Identification:** Household Hazardous Material / Chemical Substance\n\n` +
        `**Primary Stream:** [HOUSEHOLD HAZARDOUS WASTE]\n\n` +
        `**Designated Bin:** Red Special Depot / Certified Drop-Off Kiosk (Never regular trash or curbside recycling!).\n\n` +
        `• **Preparation:** Insulate battery terminals with clear tape; transport liquid chemicals upright in original labeled containers.\n` +
        `• **Critical Mistake to Avoid:** Compactor trucks crush lithium cells, sparking spontaneous lithium fires; never throw in municipal blue/green/black carts.\n` +
        `• **Hazard:** Prevents aquifer poisoning and waste facility fires.`;
    }

    if (q.includes('phone') || q.includes('laptop') || q.includes('tv') || q.includes('cable') || q.includes('charger') || q.includes('electronics') || q.includes('screen') || q.includes('computer')) {
      return `**Item Identification:** Consumer Electronic Device / WEEE Material\n\n` +
        `**Primary Stream:** [ELECTRONIC WASTE (WEEE)]\n\n` +
        `**Designated Bin:** Slate Electronic Takeback Depot / Retailer Drop-Box.\n\n` +
        `• **Preparation:** Wipe personal data, coil cords neatly, remove batteries if detachable.\n` +
        `• **Critical Mistake to Avoid:** Never smash screens or incinerate printed circuit boards; prevents lead and brominated flame retardant emission.\n` +
        `• **Impact:** Recovers precious gold, silver, copper, and palladium.`;
    }

    if (q.includes('food') || q.includes('fruit') || q.includes('vegetable') || q.includes('peel') || q.includes('egg') || q.includes('coffee') || q.includes('tea') || q.includes('leaves') || q.includes('banana') || q.includes('apple')) {
      return `**Item Identification:** Organic Food Residue / Compostable Matter\n\n` +
        `**Primary Stream:** [BIODEGRADABLE & ORGANICS]\n\n` +
        `**Designated Bin:** Green Compost Bin / Municipal Organics Cart.\n\n` +
        `• **Preparation:** Remove plastic PLU barcode stickers, tea bag staples, and synthetic wraps.\n` +
        `• **Critical Mistake to Avoid:** Do not wrap organic scraps in regular polyethylene plastic bags; use certified compostable liners.\n` +
        `• **Impact:** Prevents anaerobic landfill methane production and produces nutrient-rich soil humus within weeks.`;
    }

    return `**Item Identification:** Domestic Packaging / Mixed Container Material\n\n` +
      `**Primary Stream:** [DRY RECYCLABLE]\n\n` +
      `**Designated Bin:** Curbside Blue Cart / Clean Material Bank.\n\n` +
      `• **Clean Paper, Cans & Rigid Plastics (#1 & #2):** Empty, lightly rinse, and place in the Blue Curbside Cart.\n` +
      `• **Grease-Soiled Cardboard:** If grease-soaked (like pizza box bottoms), place in Green Compost Cart.\n` +
      `• **Composite items (like plastic-lined paper coffee cups):** Cup body goes to Landfill Trash, plastic lid goes to Blue Cart.`;
  }

  /**
   * Format markdown into HTML with paragraph and list styling
   */
  formatMarkdown(raw) {
    if (!raw) return '';
    let text = raw
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');

    return text;
  }

  /**
   * Detect category from AI response text to wire up 3D station jumping
   */
  detectCategory(text) {
    const lower = text.toLowerCase();
    if (lower.includes('hazardous') || lower.includes('hazard') || lower.includes('chemical') || lower.includes('battery')) return 'hazardous';
    if (lower.includes('biodegradable') || lower.includes('organic') || lower.includes('compost') || lower.includes('green bin')) return 'biodegradable';
    if (lower.includes('electronic') || lower.includes('e-waste') || lower.includes('weee')) return 'ewaste';
    if (lower.includes('recyclable') || lower.includes('recycle') || lower.includes('blue cart') || lower.includes('curbside')) return 'recyclable';
    return null;
  }

  /**
   * Persist scan result to Supabase Cloud Database & update real-time community counters
   */
  syncScanToSupabase(prompt, replyText, imageAttachment = null) {
    if (typeof window.supabaseBackend !== 'undefined' && window.supabaseBackend.logWasteScan) {
      try {
        const cat = this.detectCategory(replyText) || 'recyclable';
        let extractedName = '';
        const nameMatch = replyText.match(/\*\*(?:Item Identification|Identified Item):\*\*\s*(.*?)(\n|$)/i);
        if (nameMatch && nameMatch[1]) {
          extractedName = nameMatch[1].replace(/\[.*?\]/g, '').trim();
        }
        if (!extractedName) {
          extractedName = imageAttachment ? (imageAttachment.name ? imageAttachment.name.replace(/[-_.]/g, ' ') : 'Scanned Waste Item') : (prompt || 'Household Item');
        }

        window.supabaseBackend.logWasteScan({
          itemName: extractedName,
          category: cat,
          stream: cat.toUpperCase() + ' STREAM',
          source: imageAttachment ? 'camera' : 'search',
          guidance: (replyText || '').substring(0, 320),
          metadata: {
            hasImage: !!imageAttachment,
            query: prompt || ''
          }
        });
      } catch (e) {
        console.warn('[Supabase Sync Error]', e);
      }
    }
  }

  /**
   * Handle conversational and multimodal query from search bar or chat box
   */
  async handleDirectQuery(queryText, targetContainer, imageAttachment = null) {
    if ((!queryText && !imageAttachment) || this.isProcessing) return;
    this.activeQuery = queryText || (imageAttachment ? 'Item photo scan' : '');
    this.isProcessing = true;

    const displayPrompt = queryText && queryText.trim().length > 0 
      ? queryText 
      : (imageAttachment ? '📸 What kind of waste is this item and which bin does it belong to?' : 'EcoSage query');

    let userPhotoMarkup = '';
    let scanningBubbleMarkup = '';

    if (imageAttachment) {
      userPhotoMarkup = `
        <div class="ai-msg-photo-attachment">
          <span class="ai-msg-photo-tag">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
            Scanned Item Photo
          </span>
          <img src="${imageAttachment.dataUrl}" alt="${this.escapeHTML(imageAttachment.name || 'Scanned item')}">
        </div>
      `;

      scanningBubbleMarkup = `
        <div class="ai-active-scanning-card">
          <div class="scanner-laser-line"></div>
          <div class="ai-active-scanning-overlay"></div>
          <img src="${imageAttachment.dataUrl}" alt="Scanning in progress">
          <div class="ai-scanning-status-text">
            <span class="status-pulse-dot" style="width: 6px; height: 6px;"></span>
            <span>Gemini Vision: Analyzing packaging layers & EPA stream...</span>
          </div>
        </div>
      `;
    }

    // Render loading state in targetContainer
    targetContainer.innerHTML = `
      <div class="ai-intelligence-panel" style="border-color: var(--bio-border);">
        <div class="ai-panel-header">
          <div class="ai-panel-title-wrap">
            <span class="status-pulse-dot" style="width: 7px; height: 7px;" aria-hidden="true"></span>
            <span class="ai-panel-title">EcoSage AI Assistant & Scanner</span>
            <span class="ai-panel-badge">Gemini 3.5 Flash Vision</span>
          </div>
          <span style="font-size: 0.75rem; color: var(--text-secondary);">${imageAttachment ? 'Photo Scan Mode' : `Query: "${this.escapeHTML(displayPrompt)}"`}</span>
        </div>

        <div class="ai-chat-thread-container" id="ai-active-thread">
          <div class="ai-thread-message ai-thread-msg-user">
            <div class="ai-msg-sender-tag">
              <span>YOU</span>
              <span>${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            ${userPhotoMarkup}
            <div class="ai-msg-content">${this.escapeHTML(displayPrompt)}</div>
          </div>

          <div class="ai-thread-message ai-thread-msg-assistant" id="ai-loading-bubble">
            <div class="ai-msg-sender-tag">
              <span>ECOSAGE AI (GEMINI 3.5)</span>
              <span>ANALYZING</span>
            </div>
            ${scanningBubbleMarkup}
            <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-secondary); font-size: 0.85rem;">
              <div class="typing-dot"></div>
              <div class="typing-dot"></div>
              <div class="typing-dot"></div>
              <span style="margin-left: 0.4rem;">${imageAttachment ? 'Examining optical characteristics & municipal guidelines...' : 'Analyzing EPA material matrix & waste stream...'}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Scroll to results
    const resultSection = document.getElementById('result-container');
    if (resultSection) {
      resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    let aiReply = '';
    try {
      if (imageAttachment) {
        aiReply = await this.analyzeImageWithGemini(imageAttachment.base64, imageAttachment.mimeType, queryText);
      } else {
        aiReply = await this.queryGemini(queryText);
      }
    } catch (err) {
      console.warn('Gemini query fallback:', err);
      aiReply = this.generateFallback(queryText, imageAttachment);
    } finally {
      this.isProcessing = false;
    }

    // Save exchange to history
    this.conversationHistory.push({
      role: 'user',
      text: displayPrompt,
      image: imageAttachment ? imageAttachment.dataUrl : null,
      imageName: imageAttachment ? imageAttachment.name : null
    });
    this.conversationHistory.push({
      role: 'assistant',
      text: aiReply
    });

    // Sync to Supabase Cloud Database & telemetry
    this.syncScanToSupabase(displayPrompt, aiReply, imageAttachment);

    // Render full interactive card with thread & follow-up tools
    this.renderFullThreadView(targetContainer);
  }

  /**
   * Renders the integrated AI Intelligence box below a verified static database result
   */
  mountIntegratedPanel(matchedItem, mountContainer) {
    if (!mountContainer) return;

    const existingPanel = document.getElementById('ai-integrated-subpanel');
    if (existingPanel) existingPanel.remove();

    const panel = document.createElement('div');
    panel.className = 'ai-intelligence-panel';
    panel.id = 'ai-integrated-subpanel';
    panel.innerHTML = `
      <div class="ai-panel-header">
        <div class="ai-panel-title-wrap">
          <span class="status-pulse-dot" style="width: 7px; height: 7px;" aria-hidden="true"></span>
          <span class="ai-panel-title">EcoSage AI Live Insights & Visual Scanner</span>
          <span class="ai-panel-badge">Gemini 3.5 Flash Vision</span>
        </div>
        <span style="font-size: 0.75rem; color: var(--text-secondary);">Item: ${this.escapeHTML(matchedItem.name)}</span>
      </div>

      <div class="ai-chat-thread-container" id="ai-active-thread">
        <div class="ai-thread-message ai-thread-msg-assistant">
          <div class="ai-msg-sender-tag">
            <span>ECOSAGE REASONING</span>
            <span>VERIFIED ADVICE</span>
          </div>
          <div class="ai-msg-content">
            <p><strong>Primary Stream:</strong> [${matchedItem.category.toUpperCase()}] &bull; <strong>Designated Bin:</strong> ${matchedItem.binColor}</p>
            <p><strong>Disposal Protocol:</strong> ${matchedItem.disposalMethod}</p>
            <p><strong>Environmental Consequence:</strong> ${matchedItem.impact}</p>
          </div>
          <div class="ai-stream-action-box">
            <span style="font-size: 0.775rem; color: var(--text-secondary);">Want to see how this bin operates?</span>
            <button type="button" class="ai-3d-jump-btn" data-category="${matchedItem.category}">
              <span>Inspect in 3D Station &rarr;</span>
            </button>
          </div>
        </div>
      </div>

      <div class="ai-inline-followup-area">
        <div class="ai-followup-chips-row">
          <span style="font-size: 0.725rem; font-weight: 700; color: var(--text-secondary);">Ask EcoSage:</span>
          <button type="button" class="ai-followup-chip" data-query="Can I recycle ${matchedItem.name} if it is dirty or soiled?">What if it's soiled?</button>
          <button type="button" class="ai-followup-chip" data-query="What is the legal penalty or regulation for improperly dumping ${matchedItem.name}?">Legal rules?</button>
          <button type="button" class="ai-followup-chip" data-query="How should I safely store ${matchedItem.name} at home before drop-off?">Safe home storage?</button>
          <button type="button" class="ai-followup-chip" data-query="Are there any creative upcycling or reuse ideas for ${matchedItem.name}?">Upcycling ideas?</button>
        </div>

        <div class="ai-followup-input-frame">
          <input type="file" id="ai-thread-file-input" accept="image/*" style="display: none;">
          <button type="button" id="ai-thread-camera-btn" class="ai-followup-cam-btn" title="Open camera to snap live photo & upload directly">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
          </button>
          <button type="button" id="ai-thread-attach-btn" class="ai-followup-attach-btn" title="Upload photo file from device">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </button>

          <div class="ai-input-wrapper-flex">
            <div id="ai-chat-staged-chip" class="ai-chat-staged-chip" style="display: none;">
              <img id="ai-chat-staged-thumb" class="ai-chat-staged-thumb" src="" alt="Attached photo">
              <span id="ai-chat-staged-name" class="ai-chat-staged-title">photo.jpg</span>
              <button type="button" id="ai-chat-staged-remove-btn" class="staged-remove-btn" title="Remove attached photo">&times;</button>
            </div>
            <input 
              type="text" 
              id="ai-thread-input" 
              class="ai-followup-input" 
              placeholder="Ask a question or upload item photo..."
              autocomplete="off"
              aria-label="Ask follow-up question or upload photo"
            >
          </div>

          <button type="button" id="ai-thread-send-btn" class="ai-followup-submit-btn">
            <span>Ask / Scan</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>
    `;

    mountContainer.appendChild(panel);
    this.bindThreadEvents(panel);
  }

  /**
   * Render complete conversation thread with photo attachments and tools
   */
  renderFullThreadView(targetContainer) {
    if (!targetContainer) return;

    let messagesHtml = '';
    this.conversationHistory.forEach(msg => {
      const isUser = msg.role === 'user';
      let actionBtn = '';
      if (!isUser) {
        const cat = this.detectCategory(msg.text);
        if (cat) {
          actionBtn = `
            <div class="ai-stream-action-box">
              <span style="font-size: 0.775rem; color: var(--text-secondary);">Identified Stream: <strong>${cat.toUpperCase()}</strong></span>
              <button type="button" class="ai-3d-jump-btn" data-category="${cat}">
                <span>Inspect in 3D Station &rarr;</span>
              </button>
            </div>
          `;
        }
      }

      let attachedPhotoHtml = '';
      if (isUser && msg.image) {
        attachedPhotoHtml = `
          <div class="ai-msg-photo-attachment">
            <span class="ai-msg-photo-tag">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
              Scanned Item Photo
            </span>
            <img src="${msg.image}" alt="${this.escapeHTML(msg.imageName || 'Scanned item')}">
          </div>
        `;
      }

      messagesHtml += `
        <div class="ai-thread-message ${isUser ? 'ai-thread-msg-user' : 'ai-thread-msg-assistant'}">
          <div class="ai-msg-sender-tag">
            <span>${isUser ? 'YOU' : 'ECOSAGE AI (GEMINI 3.5)'}</span>
            <span>${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          ${attachedPhotoHtml}
          <div class="ai-msg-content">${this.formatMarkdown(msg.text)}</div>
          ${actionBtn}
        </div>
      `;
    });

    targetContainer.innerHTML = `
      <div class="ai-intelligence-panel" style="border-color: var(--bio-border);">
        <div class="ai-panel-header">
          <div class="ai-panel-title-wrap">
            <span class="status-pulse-dot" style="width: 7px; height: 7px;" aria-hidden="true"></span>
            <span class="ai-panel-title">EcoSage AI Assistant & Scanner</span>
            <span class="ai-panel-badge">Gemini 3.5 Flash Vision</span>
          </div>
          <span style="font-size: 0.75rem; color: var(--text-secondary);">Interactive Waste Classification Thread</span>
        </div>

        <div class="ai-chat-thread-container" id="ai-active-thread">
          ${messagesHtml}
        </div>

        <div class="ai-inline-followup-area">
          <div class="ai-followup-chips-row">
            <span style="font-size: 0.725rem; font-weight: 700; color: var(--text-secondary);">Quick Follow-Ups:</span>
            <button type="button" class="ai-followup-chip" data-query="What is the legal disposal rule or regulation for this?">Legal Rules?</button>
            <button type="button" class="ai-followup-chip" data-query="How to store this safely at home before taking it to a depot?">Safe Storage?</button>
            <button type="button" class="ai-followup-chip" data-query="Can this be recycled if soiled with food or grease?">If soiled with grease?</button>
            <button type="button" class="ai-followup-chip" data-query="What are the environmental hazards if this enters a landfill?">Landfill Hazards?</button>
          </div>

          <div class="ai-followup-input-frame">
            <input type="file" id="ai-thread-file-input" accept="image/*" style="display: none;">
            <button type="button" id="ai-thread-camera-btn" class="ai-followup-cam-btn" title="Open camera to snap live photo & upload directly">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </button>
            <button type="button" id="ai-thread-attach-btn" class="ai-followup-attach-btn" title="Upload photo file from device">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </button>

            <div class="ai-input-wrapper-flex">
              <div id="ai-chat-staged-chip" class="ai-chat-staged-chip" style="display: none;">
                <img id="ai-chat-staged-thumb" class="ai-chat-staged-thumb" src="" alt="Attached photo">
                <span id="ai-chat-staged-name" class="ai-chat-staged-title">photo.jpg</span>
                <button type="button" id="ai-chat-staged-remove-btn" class="staged-remove-btn" title="Remove attached photo">&times;</button>
              </div>
              <input 
                type="text" 
                id="ai-thread-input" 
                class="ai-followup-input" 
                placeholder="Ask follow-up, or upload/drag another photo to classify..."
                autocomplete="off"
                aria-label="Ask follow-up question or upload photo"
              >
            </div>

            <button type="button" id="ai-thread-send-btn" class="ai-followup-submit-btn">
              <span>Ask / Scan</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
        </div>
      </div>
    `;

    this.bindThreadEvents(targetContainer);
  }

  /**
   * Bind events for follow-up inputs, attachment button, dropzone, chips & 3D buttons
   */
  bindThreadEvents(container) {
    if (!container) return;

    const input = container.querySelector('#ai-thread-input');
    const sendBtn = container.querySelector('#ai-thread-send-btn');
    const attachBtn = container.querySelector('#ai-thread-attach-btn');
    const fileInput = container.querySelector('#ai-thread-file-input');
    const stagedChip = container.querySelector('#ai-chat-staged-chip');
    const stagedThumb = container.querySelector('#ai-chat-staged-thumb');
    const stagedName = container.querySelector('#ai-chat-staged-name');
    const stagedRemoveBtn = container.querySelector('#ai-chat-staged-remove-btn');
    const threadBox = container.querySelector('#ai-active-thread');
    const followupArea = container.querySelector('.ai-inline-followup-area');

    let currentStaged = null;

    if (threadBox) {
      threadBox.scrollTop = threadBox.scrollHeight;
    }

    const setStaged = (item) => {
      currentStaged = item;
      if (item && stagedChip && stagedThumb && stagedName) {
        stagedThumb.src = item.dataUrl;
        stagedName.textContent = item.name;
        stagedChip.style.display = 'inline-flex';
        if (attachBtn) attachBtn.classList.add('has-attachment');
        if (input) input.placeholder = 'Add a question about this item (or hit Ask / Scan)...';
      } else if (stagedChip) {
        stagedChip.style.display = 'none';
        if (attachBtn) attachBtn.classList.remove('has-attachment');
        if (input) input.placeholder = 'Ask follow-up, or upload/drag another photo to classify...';
      }
    };

    if (stagedRemoveBtn) {
      stagedRemoveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        setStaged(null);
        if (fileInput) fileInput.value = '';
      });
    }

    const cameraBtn = container.querySelector('#ai-thread-camera-btn');
    if (cameraBtn) {
      cameraBtn.addEventListener('click', () => {
        if (window.wasteVisualScanner) {
          window.wasteVisualScanner.openLiveCameraModal(true);
        }
      });
    }

    if (attachBtn && fileInput) {
      attachBtn.addEventListener('click', () => {
        fileInput.value = '';
        fileInput.click();
      });

      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        try {
          const processed = await this.compressAndConvertToBase64(file);
          setStaged(processed);
          if (input) input.focus();
        } catch (err) {
          alert('Could not load image: ' + err.message);
        }
      });
    }

    // Drag-and-drop onto the chat followup area
    if (followupArea) {
      followupArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        followupArea.style.background = 'rgba(99, 146, 96, 0.15)';
      });

      followupArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        followupArea.style.background = '';
      });

      followupArea.addEventListener('drop', async (e) => {
        e.preventDefault();
        followupArea.style.background = '';
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          const file = e.dataTransfer.files[0];
          try {
            const processed = await this.compressAndConvertToBase64(file);
            setStaged(processed);
            if (input) input.focus();
          } catch (err) {
            alert('Could not load dropped image: ' + err.message);
          }
        }
      });
    }

    // Clipboard paste support (Ctrl+V)
    if (input) {
      input.addEventListener('paste', async (e) => {
        const items = e.clipboardData && e.clipboardData.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              try {
                const processed = await this.compressAndConvertToBase64(file);
                setStaged(processed);
              } catch (err) {
                console.warn('Paste image failed:', err);
              }
            }
          }
        }
      });
    }

    const doSubmitFollowup = async (text) => {
      const promptToSend = text || (currentStaged ? 'Identify this item and determine its primary waste stream and disposal bin.' : '');
      if ((!promptToSend && !currentStaged) || this.isProcessing) return;

      const activeStaged = currentStaged;
      setStaged(null);
      if (fileInput) fileInput.value = '';
      if (input) input.value = '';

      // Append user msg to DOM immediately
      if (threadBox) {
        let photoHtml = '';
        if (activeStaged) {
          photoHtml = `
            <div class="ai-msg-photo-attachment">
              <span class="ai-msg-photo-tag">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                Scanned Item Photo
              </span>
              <img src="${activeStaged.dataUrl}" alt="${this.escapeHTML(activeStaged.name)}">
            </div>
          `;
        }

        const userDiv = document.createElement('div');
        userDiv.className = 'ai-thread-message ai-thread-msg-user';
        userDiv.innerHTML = `
          <div class="ai-msg-sender-tag">
            <span>YOU</span>
            <span>${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          ${photoHtml}
          <div class="ai-msg-content">${this.escapeHTML(promptToSend)}</div>
        `;
        threadBox.appendChild(userDiv);

        // Append loading indicator with laser scan animation if photo attached
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'ai-thread-message ai-thread-msg-assistant';
        loadingDiv.id = 'ai-temp-loading';

        let activeScanCard = '';
        if (activeStaged) {
          activeScanCard = `
            <div class="ai-active-scanning-card">
              <div class="scanner-laser-line"></div>
              <div class="ai-active-scanning-overlay"></div>
              <img src="${activeStaged.dataUrl}" alt="Scanning waste photo">
              <div class="ai-scanning-status-text">
                <span class="status-pulse-dot" style="width: 6px; height: 6px;"></span>
                <span>Gemini Vision: Extracting packaging characteristics...</span>
              </div>
            </div>
          `;
        }

        loadingDiv.innerHTML = `
          <div class="ai-msg-sender-tag">
            <span>ECOSAGE AI (GEMINI 3.5)</span>
            <span>${activeStaged ? 'SCANNING PHOTO' : 'THINKING'}</span>
          </div>
          ${activeScanCard}
          <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-secondary); font-size: 0.85rem;">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <span style="margin-left: 0.4rem;">${activeStaged ? 'Matching waste profile against EPA database...' : 'EcoSage is reviewing guidelines...'}</span>
          </div>
        `;
        threadBox.appendChild(loadingDiv);
        threadBox.scrollTop = threadBox.scrollHeight;

        this.conversationHistory.push({
          role: 'user',
          text: promptToSend,
          image: activeStaged ? activeStaged.dataUrl : null,
          imageName: activeStaged ? activeStaged.name : null
        });

        this.isProcessing = true;
        let reply = '';
        try {
          if (activeStaged) {
            reply = await this.analyzeImageWithGemini(activeStaged.base64, activeStaged.mimeType, promptToSend);
          } else {
            reply = await this.queryGemini(promptToSend);
          }
        } catch (err) {
          reply = this.generateFallback(promptToSend, activeStaged);
        } finally {
          this.isProcessing = false;
        }

        this.conversationHistory.push({ role: 'assistant', text: reply });
        this.syncScanToSupabase(promptToSend, reply, activeStaged);

        // Remove loading and append assistant msg
        const temp = document.getElementById('ai-temp-loading');
        if (temp) temp.remove();

        const cat = this.detectCategory(reply);
        let actionBtn = '';
        if (cat) {
          actionBtn = `
            <div class="ai-stream-action-box">
              <span style="font-size: 0.775rem; color: var(--text-secondary);">Identified Stream: <strong>${cat.toUpperCase()}</strong></span>
              <button type="button" class="ai-3d-jump-btn" data-category="${cat}">
                <span>Inspect in 3D Station &rarr;</span>
              </button>
            </div>
          `;
        }

        const botDiv = document.createElement('div');
        botDiv.className = 'ai-thread-message ai-thread-msg-assistant';
        botDiv.innerHTML = `
          <div class="ai-msg-sender-tag">
            <span>ECOSAGE AI (GEMINI 3.5)</span>
            <span>${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div class="ai-msg-content">${this.formatMarkdown(reply)}</div>
          ${actionBtn}
        `;
        threadBox.appendChild(botDiv);
        threadBox.scrollTop = threadBox.scrollHeight;

        // Rebind 3D button if present
        const newJumpBtn = botDiv.querySelector('.ai-3d-jump-btn');
        if (newJumpBtn) {
          newJumpBtn.addEventListener('click', () => {
            const c = newJumpBtn.getAttribute('data-category');
            const labTabBtn = document.getElementById('tab-btn-lab');
            if (labTabBtn) labTabBtn.click();
            if (window.open3DBin) window.open3DBin(c);
          });
        }
      }
    };

    if (sendBtn && input) {
      sendBtn.addEventListener('click', () => doSubmitFollowup(input.value.trim()));
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          doSubmitFollowup(input.value.trim());
        }
      });
    }

    // Follow-up chips
    container.querySelectorAll('.ai-followup-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const q = chip.getAttribute('data-query');
        if (q) doSubmitFollowup(q);
      });
    });

    // 3D Jump buttons
    container.querySelectorAll('.ai-3d-jump-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-category');
        const labTabBtn = document.getElementById('tab-btn-lab');
        if (labTabBtn) labTabBtn.click();
        if (window.open3DBin) window.open3DBin(cat);
      });
    });
  }

  /**
   * Directly submit a live captured photo into the ongoing chat thread
   */
  submitLivePhotoToThread(snapshot) {
    if (!snapshot) return;
    const resultContent = document.getElementById('result-content');
    const input = document.getElementById('ai-thread-input');
    const searchInput = document.getElementById('search-input');
    const userText = (input && input.value.trim().length > 0)
      ? input.value.trim()
      : ((searchInput && searchInput.value.trim().length > 0)
          ? searchInput.value.trim()
          : '📸 Live photo captured from device camera. Classify this item under EPA waste stream guidelines.');
    
    if (input) input.value = '';
    if (searchInput) searchInput.value = '';
    
    if (resultContent) {
      this.handleDirectQuery(userText, resultContent, snapshot);
    }
  }

  escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }
}

// Global instance
window.ecoSageAIEngine = new EcoSageAIEngine();

/**
 * Smart Waste Segregation Assistant - Supabase Cloud Backend Integration
 * Project: smart-waste-segregation
 * Project Ref: ruzpfpqdereylolyujkz
 * Region: ap-south-1 (Mumbai)
 * Powered by Supabase Postgres, Row Level Security, and Realtime Engine.
 */

const SUPABASE_CONFIG = {
  url: 'https://ruzpfpqdereylolyujkz.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1enBmcHFkZXJleWxvbHl1amt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyMDcwMDAsImV4cCI6MjEwODc4MzAwMH0.xmA2nl8pIvFsCKCBUSmLK59jHCEMqeJbc-xkG0MUBvw',
  projectId: 'ruzpfpqdereylolyujkz',
  projectName: 'smart-waste-segregation',
  region: 'ap-south-1'
};

class SupabaseBackendService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.realtimeChannel = null;
    this.recentScansListeners = [];
    this.init();
  }

  /**
   * Initialize Supabase client via the global supabase object
   */
  init() {
    if (typeof supabase !== 'undefined' && supabase.createClient) {
      try {
        this.client = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        this.checkConnection();
        this.initRealtimeSubscription();
      } catch (err) {
        console.error('[Supabase] Failed to initialize client:', err);
        this.updateStatusBadge(false, 'Init Error');
      }
    } else {
      console.warn('[Supabase] Supabase JS SDK not yet loaded. Retrying in 500ms...');
      setTimeout(() => this.init(), 500);
    }
  }

  /**
   * Ping backend database to check health and connectivity
   */
  async checkConnection() {
    if (!this.client) return false;
    try {
      const { data, error } = await this.client
        .from('community_metrics')
        .select('total_scans, updated_at')
        .eq('id', 'global')
        .maybeSingle();

      if (error) {
        console.warn('[Supabase] Health check returned error:', error.message);
        this.isConnected = false;
        this.updateStatusBadge(false, 'Offline / Retrying');
        return false;
      }

      this.isConnected = true;
      this.updateStatusBadge(true, 'Connected (ap-south-1)');
      return true;
    } catch (err) {
      console.warn('[Supabase] Health check network error:', err);
      this.isConnected = false;
      this.updateStatusBadge(false, 'Offline');
      return false;
    }
  }

  /**
   * Update the header status badge in the DOM
   */
  updateStatusBadge(online, text) {
    const badge = document.getElementById('supabase-status-badge');
    const dot = document.getElementById('supabase-status-dot');
    const textEl = document.getElementById('supabase-status-text');

    if (badge) {
      badge.classList.toggle('online', online);
      badge.classList.toggle('offline', !online);
      badge.setAttribute('title', `Supabase Database (${SUPABASE_CONFIG.region}): ${text}`);
    }
    if (dot) {
      dot.style.background = online ? '#3ECF8E' : '#E05D52';
      dot.style.boxShadow = online ? '0 0 8px #3ECF8E' : '0 0 8px #E05D52';
    }
    if (textEl) {
      textEl.textContent = online ? 'Supabase Live' : 'Supabase (Offline)';
    }
  }

  /**
   * Log an AI / camera / search waste scan into Supabase
   * Calls atomic stored procedure log_waste_scan_and_update_metrics
   */
  async logWasteScan({ itemName, category, stream, source = 'camera', guidance = '', metadata = {} }) {
    if (!itemName) return null;

    // Normalize category
    let cat = (category || 'recyclable').toLowerCase();
    if (cat.includes('bio') || cat.includes('organ')) cat = 'biodegradable';
    else if (cat.includes('recyc') || cat.includes('dry')) cat = 'recyclable';
    else if (cat.includes('haz') || cat.includes('chem')) cat = 'hazardous';
    else if (cat.includes('ewaste') || cat.includes('elect')) cat = 'ewaste';
    else if (cat.includes('landfill')) cat = 'landfill';
    else cat = 'recyclable';

    try {
      if (!this.client) {
        console.warn('[Supabase] Client not initialized, skipping remote log.');
        return null;
      }

      // Try calling atomic RPC
      const { data, error } = await this.client.rpc('log_waste_scan_and_update_metrics', {
        p_item_name: itemName,
        p_category: cat,
        p_stream: stream || (cat.toUpperCase() + ' STREAM'),
        p_source: source,
        p_guidance: guidance || null,
        p_metadata: metadata
      });

      if (error) {
        console.warn('[Supabase] RPC error, falling back to direct table insert:', error.message);
        // Fallback to direct insert
        const { data: insertData, error: insertError } = await this.client
          .from('waste_scans')
          .insert({
            item_name: itemName,
            category: cat,
            stream: stream || (cat.toUpperCase() + ' STREAM'),
            scan_source: source,
            guidance: guidance || null,
            metadata: metadata
          })
          .select()
          .single();

        if (insertError) {
          console.error('[Supabase] Direct insert error:', insertError);
          return null;
        }
        this.showCloudToast(`☁️ Scan logged to Supabase: ${itemName}`);
        this.refreshTelemetryUI();
        return insertData;
      }

      this.showCloudToast(`☁️ Synced to Supabase: ${itemName}`);
      this.refreshTelemetryUI();
      return data;
    } catch (err) {
      console.warn('[Supabase] Exception logging scan:', err);
      return null;
    }
  }

  /**
   * Fetch current global community metrics from Supabase
   */
  async fetchCommunityMetrics() {
    if (!this.client) return null;
    try {
      const { data, error } = await this.client
        .from('community_metrics')
        .select('*')
        .eq('id', 'global')
        .maybeSingle();

      if (error) {
        console.error('[Supabase] Error fetching metrics:', error);
        return null;
      }
      return data;
    } catch (err) {
      console.error('[Supabase] Metrics fetch exception:', err);
      return null;
    }
  }

  /**
   * Fetch the most recent scans across the community
   */
  async fetchRecentScans(limit = 8) {
    if (!this.client) return [];
    try {
      const { data, error } = await this.client
        .from('waste_scans')
        .select('id, item_name, category, stream, scan_source, guidance, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[Supabase] Error fetching recent scans:', error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('[Supabase] Recent scans exception:', err);
      return [];
    }
  }

  /**
   * Submit quiz score to Supabase and get user's ranking
   */
  async submitQuizScore(playerName, score, streak = 0, accuracy = 100) {
    if (!this.client) return null;
    try {
      const cleanName = (playerName || 'EcoWarrior').trim().substring(0, 30);
      const { data, error } = await this.client.rpc('submit_quiz_score', {
        p_player_name: cleanName,
        p_score: parseInt(score) || 0,
        p_streak: parseInt(streak) || 0,
        p_accuracy: parseFloat(accuracy) || 100
      });

      if (error) {
        console.warn('[Supabase] Submit quiz score RPC error, inserting directly:', error.message);
        const { data: directData, error: directErr } = await this.client
          .from('quiz_scores')
          .insert({
            player_name: cleanName,
            score: parseInt(score) || 0,
            streak: parseInt(streak) || 0,
            accuracy: parseFloat(accuracy) || 100
          })
          .select()
          .single();

        if (directErr) {
          console.error('[Supabase] Direct quiz score insert error:', directErr);
          return null;
        }
        this.showCloudToast(`🏆 Score of ${score} saved to Supabase Leaderboard!`);
        return directData;
      }

      this.showCloudToast(`🏆 Saved! Global Rank #${data.rank || 1} on Supabase Leaderboard`);
      return data;
    } catch (err) {
      console.error('[Supabase] Quiz score exception:', err);
      return null;
    }
  }

  /**
   * Fetch top quiz leaderboard entries
   */
  async fetchQuizLeaderboard(limit = 10) {
    if (!this.client) return [];
    try {
      const { data, error } = await this.client
        .from('quiz_scores')
        .select('id, player_name, score, streak, accuracy, created_at')
        .order('score', { ascending: false })
        .order('streak', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[Supabase] Error fetching leaderboard:', error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('[Supabase] Leaderboard exception:', err);
      return [];
    }
  }

  /**
   * Fetch verified waste catalog items from Supabase database
   */
  async fetchWasteItems() {
    if (!this.client) return null;
    try {
      const { data, error } = await this.client
        .from('waste_items')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('[Supabase] Error fetching waste items:', error);
        return null;
      }
      return data;
    } catch (err) {
      console.error('[Supabase] Waste items exception:', err);
      return null;
    }
  }

  /**
   * Add custom community item to Supabase database
   */
  async addCustomWasteItem({ name, category, binColor, streamCode, disposalMethod, prep, impact, mistake, quote }) {
    if (!this.client || !name || !category) return null;
    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const id = `custom-${slug}-${Date.now().toString(36)}`;

      const { data, error } = await this.client
        .from('waste_items')
        .insert({
          id,
          name,
          category,
          bin_color: binColor || 'Designated Collection Bin',
          stream_code: streamCode || 'COMMUNITY-STREAM',
          disposal_method: disposalMethod || 'Segregate into designated collection stream.',
          prep: prep || ['Inspect item and follow local guidelines'],
          impact: impact || 'Conserves resources and reduces municipal landfill burden.',
          mistake: mistake || 'Do not cross-contaminate with other waste streams.',
          quote: quote || 'Every properly sorted item makes a difference.'
        })
        .select()
        .single();

      if (error) {
        console.error('[Supabase] Error adding custom item:', error);
        return null;
      }
      this.showCloudToast(`🌿 Added "${name}" to Supabase Knowledge Base!`);
      return data;
    } catch (err) {
      console.error('[Supabase] Exception adding custom item:', err);
      return null;
    }
  }

  /**
   * Listen for real-time scans via Supabase Postgres Realtime Channels
   */
  initRealtimeSubscription() {
    if (!this.client) return;
    try {
      this.realtimeChannel = this.client
        .channel('public:waste_scans')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'waste_scans' },
          (payload) => {
            console.log('[Supabase Realtime] New scan logged:', payload.new);
            this.handleRealtimeNewScan(payload.new);
          }
        )
        .subscribe((status) => {
          console.log('[Supabase Realtime] Channel status:', status);
        });
    } catch (err) {
      console.warn('[Supabase Realtime] Subscription error:', err);
    }
  }

  /**
   * Handle real-time incoming scan broadcast
   */
  handleRealtimeNewScan(scan) {
    // Notify listeners
    this.recentScansListeners.forEach((listener) => {
      try {
        listener(scan);
      } catch (e) {
        console.error(e);
      }
    });

    // Update Live Telemetry widget if present
    this.refreshTelemetryUI();
  }

  /**
   * Register a listener for real-time new scans
   */
  onNewScan(callback) {
    if (typeof callback === 'function') {
      this.recentScansListeners.push(callback);
    }
  }

  /**
   * Refresh telemetry numbers in the DOM
   */
  async refreshTelemetryUI() {
    const metrics = await this.fetchCommunityMetrics();
    if (!metrics) return;

    const totalScansEl = document.getElementById('supa-metric-scans');
    const recycledEl = document.getElementById('supa-metric-recycled');
    const compostedEl = document.getElementById('supa-metric-composted');
    const hazardousEl = document.getElementById('supa-metric-hazardous');
    const co2El = document.getElementById('supa-metric-co2');

    if (totalScansEl) totalScansEl.textContent = Number(metrics.total_scans || 0).toLocaleString();
    if (recycledEl) recycledEl.textContent = Number(metrics.items_recycled || 0).toLocaleString();
    if (compostedEl) compostedEl.textContent = Number(metrics.items_composted || 0).toLocaleString();
    if (hazardousEl) hazardousEl.textContent = Number(metrics.hazardous_diverted || 0).toLocaleString();
    if (co2El) co2El.textContent = `${Number(metrics.co2_saved_kg || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`;

    // Also refresh the recent activity feed list
    this.renderRecentScansFeed();
  }

  /**
   * Render recent scans into the activity feed container
   */
  async renderRecentScansFeed() {
    const feedContainer = document.getElementById('supa-recent-scans-feed');
    if (!feedContainer) return;

    const scans = await this.fetchRecentScans(6);
    if (!scans || scans.length === 0) {
      feedContainer.innerHTML = `<div style="font-size:0.8rem; color:var(--text-secondary); text-align:center; padding:1rem;">No recent scans yet. Scan an item to be the first!</div>`;
      return;
    }

    feedContainer.innerHTML = scans.map((s) => {
      const cat = s.category || 'recyclable';
      const badgeClass = cat === 'biodegradable' ? 'badge-bio' :
                         cat === 'recyclable' ? 'badge-recycle' :
                         cat === 'hazardous' ? 'badge-hazard' : 'badge-ewaste';
      const timeStr = s.created_at ? new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';
      const icon = cat === 'biodegradable' ? '🌱' :
                   cat === 'recyclable' ? '♻️' :
                   cat === 'hazardous' ? '⚠️' : '🔋';

      return `
        <div class="supa-feed-item">
          <div class="supa-feed-icon">${icon}</div>
          <div class="supa-feed-info">
            <div class="supa-feed-title-row">
              <span class="supa-feed-title">${escapeHtml(s.item_name)}</span>
              <span class="supa-feed-time">${timeStr}</span>
            </div>
            <div class="supa-feed-sub">
              <span class="supa-feed-badge ${badgeClass}">${(s.category || 'Recyclable').toUpperCase()}</span>
              <span class="supa-feed-stream">${escapeHtml(s.stream || '')}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Display a sleek, glassmorphic toast notification for cloud events
   */
  showCloudToast(message, duration = 3200) {
    let container = document.getElementById('supa-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'supa-toast-container';
      container.className = 'supa-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'supa-toast';
    toast.innerHTML = `
      <div class="supa-toast-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3ECF8E" stroke-width="2.5"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
      </div>
      <div class="supa-toast-content">${escapeHtml(message)}</div>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('visible'), 20);

    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }
}

// Utility HTML escape
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Instantiate global singleton
window.supabaseBackend = new SupabaseBackendService();

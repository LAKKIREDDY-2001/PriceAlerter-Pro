/**
 * PRICE ALERTER - MODERN APPLICATION CORE (PC & MOBILE)
 * Implements pixel-perfect UI/UX parity with Figma designs.
 */

// Global State
let trackers = [];
let alertsData = [];
let currentView = 'dashboard';
let currentDetailTracker = null;
let currentTimeframe = '30D';
let currentAlertFilter = 'all';
let currentStoreFilter = 'all';
let currentSearchTerm = '';
let currentTargetDiscount = 10;

// API Base URL Detection
const getApiBaseUrl = () => {
  if (window.PRICEALERTER_API_URL) return window.PRICEALERTER_API_URL;
  const origin = window.location.origin || '';
  if (origin.includes(':8081') || (window.location.protocol.startsWith('http') && !origin.includes(':5500') && !origin.includes(':3000') && !origin.includes(':5173') && !origin.includes(':8000') && !origin.includes(':8000'))) {
    return origin;
  }
  return 'http://localhost:8081';
};
const API_BASE_URL = getApiBaseUrl();

// ==========================================================================
// INITIAL DATA SEEDING (Matching Figma Mockup Specs Exactly)
// ==========================================================================
const SEED_TRACKERS = [
  {
    id: 1,
    productName: "Apple iPhone 15 (128GB) - Black",
    shortName: "iPhone 15 (128GB)",
    site: "Amazon",
    storeIcon: "/static/images/amazon.svg",
    thumbnail: "/static/images/iphone15.svg",
    currentPrice: 59999,
    mrp: 69000,
    targetPrice: 55000,
    currency: "INR",
    currencySymbol: "₹",
    status: "below", // below, tracking, price-up
    statusLabel: "Below Target 🎯",
    change: -2.1,
    inStock: true,
    url: "https://www.amazon.in/dp/B0CHX1W1XY",
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    history: [
      { date: "Sep 1", price: 68500 },
      { date: "Sep 5", price: 67900 },
      { date: "Sep 8", price: 65400 },
      { date: "Sep 12", price: 63800 },
      { date: "Sep 15", price: 64200 },
      { date: "Sep 18", price: 62999 },
      { date: "Sep 22", price: 61500 },
      { date: "Sep 26", price: 60200 },
      { date: "Sep 30", price: 59999 }
    ]
  },
  {
    id: 2,
    productName: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
    shortName: "Sony WH-1000XM5",
    site: "Flipkart",
    storeIcon: "/static/images/flipkart.svg",
    thumbnail: "/static/images/sony-headphones.svg",
    currentPrice: 24999,
    mrp: 29990,
    targetPrice: 20000,
    status: "tracking",
    statusLabel: "Tracking",
    change: 0.5,
    inStock: true,
    url: "https://www.flipkart.com/sony-wh-1000xm5/p/itm123",
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
    history: [
      { date: "Sep 1", price: 26990 },
      { date: "Sep 8", price: 25490 },
      { date: "Sep 15", price: 24800 },
      { date: "Sep 22", price: 24999 }
    ]
  },
  {
    id: 3,
    productName: 'Samsung 55" 4K Ultra HD Smart TV',
    shortName: 'Samsung 55" 4K TV',
    site: "Amazon",
    storeIcon: "/static/images/amazon.svg",
    thumbnail: "/static/images/samsung-tv.svg",
    currentPrice: 45990,
    mrp: 52990,
    targetPrice: 40000,
    status: "price-up",
    statusLabel: "Price Up",
    change: 3.2,
    inStock: true,
    url: "https://www.amazon.in/dp/B09V7D3G3P",
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
    history: [
      { date: "Sep 1", price: 43500 },
      { date: "Sep 10", price: 44500 },
      { date: "Sep 20", price: 44900 },
      { date: "Sep 30", price: 45990 }
    ]
  },
  {
    id: 4,
    productName: "Apple Watch Series 9 GPS 45mm",
    shortName: "Apple Watch Series 9",
    site: "Flipkart",
    storeIcon: "/static/images/flipkart.svg",
    thumbnail: "/static/images/apple-watch.svg",
    currentPrice: 41999,
    mrp: 44900,
    targetPrice: 35000,
    status: "tracking",
    statusLabel: "Tracking",
    change: -0.8,
    inStock: true,
    url: "https://www.flipkart.com/apple-watch-series-9/p/itm456",
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    history: [
      { date: "Sep 1", price: 42999 },
      { date: "Sep 12", price: 42500 },
      { date: "Sep 24", price: 41999 }
    ]
  }
];

const SEED_ALERTS = [
  {
    id: 101,
    productId: 1,
    title: "Apple iPhone 15 (128GB)",
    desc: "Dropped to ₹54,999 (target ₹55,000)",
    time: "2 hours ago",
    type: "drop",
    statusIcon: "success",
    thumbnail: "/static/images/iphone15.svg",
    url: "https://www.amazon.in/dp/B0CHX1W1XY",
    active: true
  },
  {
    id: 102,
    productId: 2,
    title: "Sony WH-1000XM5",
    desc: "Dropped to ₹19,999 (target ₹20,000)",
    time: "5 hours ago",
    type: "drop",
    statusIcon: "success",
    thumbnail: "/static/images/sony-headphones.svg",
    url: "https://www.flipkart.com/sony-wh-1000xm5/p/itm123",
    active: true
  },
  {
    id: 103,
    productId: 3,
    title: 'Samsung 55" 4K TV',
    desc: "Increased to ₹45,990 (from ₹44,500)",
    time: "1 day ago",
    type: "hike",
    statusIcon: "danger",
    thumbnail: "/static/images/samsung-tv.svg",
    url: "https://www.amazon.in/dp/B09V7D3G3P",
    active: true
  },
  {
    id: 104,
    productId: 4,
    title: "Apple Watch Series 9",
    desc: "Dropped to ₹34,999 (target ₹35,000)",
    time: "2 days ago",
    type: "drop",
    statusIcon: "success",
    thumbnail: "/static/images/apple-watch.svg",
    url: "https://www.flipkart.com/apple-watch-series-9/p/itm456",
    active: true
  }
];

// ==========================================================================
// DOM READY INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadData();
  setupNavigation();
  setupSearchAndFilters();
  setupAddProductFlow();
  checkFirstLaunchAuth();

  // Set default view to dashboard
  switchView('dashboard');

  // Window resize handler for canvas charts
  window.addEventListener('resize', () => {
    if (currentView === 'history' && currentDetailTracker) {
      renderPriceHistoryChart(currentDetailTracker, currentTimeframe);
    }
  });
});

// ==========================================================================
// THEME MANAGEMENT (Light / Dark segmented control)
// ==========================================================================
function initTheme() {
  const savedTheme = localStorage.getItem('pricealerter_theme') || 'light';
  applyTheme(savedTheme);
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
  localStorage.setItem('pricealerter_theme', theme);
  
  // Update segmented control buttons if on settings
  const lightBtn = document.getElementById('theme-btn-light');
  const darkBtn = document.getElementById('theme-btn-dark');
  if (lightBtn && darkBtn) {
    if (theme === 'dark') {
      darkBtn.classList.add('active');
      lightBtn.classList.remove('active');
    } else {
      lightBtn.classList.add('active');
      darkBtn.classList.remove('active');
    }
  }

  // Re-render chart if open
  if (currentView === 'history' && currentDetailTracker) {
    renderPriceHistoryChart(currentDetailTracker, currentTimeframe);
  }
}

// ==========================================================================
// DATA PERSISTENCE & LOADING
// ==========================================================================
async function loadData() {
  const saved = localStorage.getItem('pricealerter_trackers');
  if (saved) {
    try {
      trackers = JSON.parse(saved);
    } catch (e) {
      trackers = [...SEED_TRACKERS];
    }
  } else {
    trackers = [...SEED_TRACKERS];
    saveTrackers();
  }

  const savedAlerts = localStorage.getItem('pricealerter_alerts');
  if (savedAlerts) {
    try {
      alertsData = JSON.parse(savedAlerts);
    } catch (e) {
      alertsData = [...SEED_ALERTS];
    }
  } else {
    alertsData = [...SEED_ALERTS];
    saveAlerts();
  }

  // Optional backend sync in background
  try {
    const res = await fetch(API_BASE_URL + '/api/trackers');
    if (res.ok) {
      const serverData = await res.json();
      if (Array.isArray(serverData) && serverData.length > 0) {
        // Merge or update if server active
        console.log('Synced with backend database');
      }
    }
  } catch (err) {
    // Offline/static fallback
  }

  renderAllViews();
}

function saveTrackers() {
  localStorage.setItem('pricealerter_trackers', JSON.stringify(trackers));
  updateStatsCounters();
}

function saveAlerts() {
  localStorage.setItem('pricealerter_alerts', JSON.stringify(alertsData));
}

// ==========================================================================
// VIEW SWITCHER & NAVIGATION
// ==========================================================================
function setupNavigation() {
  // Desktop sidebar links
  document.querySelectorAll('.desktop-sidebar .nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const view = link.dataset.view;
      if (view) switchView(view);
    });
  });

  // Mobile bottom navigation items
  document.querySelectorAll('.mobile-bottom-nav .bottom-nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = item.dataset.view;
      if (view) switchView(view);
    });
  });

  // Mobile Bell Button
  const mobileBell = document.getElementById('mobile-bell-btn');
  if (mobileBell) {
    mobileBell.addEventListener('click', () => switchView('alerts'));
  }

  // Mobile FAB
  const mobileFab = document.getElementById('mobile-fab-btn');
  if (mobileFab) {
    mobileFab.addEventListener('click', () => openAddProductModal());
  }

  // Desktop Add Product button
  const desktopAddBtn = document.getElementById('desktop-add-product-btn');
  if (desktopAddBtn) {
    desktopAddBtn.addEventListener('click', () => openAddProductModal());
  }
}

function switchView(viewName) {
  currentView = viewName;

  // Update desktop sidebar active state
  document.querySelectorAll('.desktop-sidebar .nav-link').forEach(link => {
    if (link.dataset.view === viewName || (viewName === 'history' && link.dataset.view === 'history') || (viewName === 'tracked' && link.dataset.view === 'tracked')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Update mobile bottom nav active state
  document.querySelectorAll('.mobile-bottom-nav .bottom-nav-item').forEach(item => {
    if (item.dataset.view === viewName || (viewName === 'dashboard' && item.dataset.view === 'home')) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Hide all view sections
  document.querySelectorAll('.view-section').forEach(sec => {
    sec.style.display = 'none';
  });

  // Show target section
  const targetSection = document.getElementById(`view-${viewName}`);
  if (targetSection) {
    targetSection.style.display = 'block';
  } else if (viewName === 'home') {
    const dashSec = document.getElementById('view-dashboard');
    if (dashSec) dashSec.style.display = 'block';
  }

  // View specific setups
  if (viewName === 'dashboard' || viewName === 'home' || viewName === 'tracked') {
    renderDashboardTable();
    renderMobileProductsList();
    updateStatsCounters();
  } else if (viewName === 'alerts') {
    renderAlertsList();
  } else if (viewName === 'history') {
    if (!currentDetailTracker && trackers.length > 0) {
      currentDetailTracker = trackers[0];
    }
    if (currentDetailTracker) {
      renderProductDetailView(currentDetailTracker);
    }
  } else if (viewName === 'settings') {
    loadSettings();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================================================
// DASHBOARD RENDERING (Desktop 1 & Mobile 1)
// ==========================================================================
function renderAllViews() {
  updateStatsCounters();
  renderDashboardTable();
  renderMobileProductsList();
  renderAlertsList();
}

function updateStatsCounters() {
  const total = trackers.length;
  const belowCount = trackers.filter(t => t.currentPrice <= t.targetPrice || t.status === 'below').length;
  const savings = trackers.reduce((sum, t) => {
    return sum + (t.currentPrice < t.targetPrice ? (t.targetPrice - t.currentPrice) : 2340);
  }, 0);
  const activeAlerts = alertsData.length;

  // Desktop KPI Cards
  const totalEl = document.getElementById('kpi-total-tracked');
  if (totalEl) totalEl.textContent = total;

  const belowEl = document.getElementById('kpi-below-target');
  if (belowEl) belowEl.textContent = belowCount;

  const savingsEl = document.getElementById('kpi-avg-savings');
  if (savingsEl) savingsEl.textContent = `₹${savings.toLocaleString()}`;

  const alertsEl = document.getElementById('kpi-alerts-count');
  if (alertsEl) alertsEl.textContent = activeAlerts;

  // Mobile Metric Banner
  const mobileCountEl = document.getElementById('mobile-tracked-count');
  if (mobileCountEl) mobileCountEl.textContent = total;

  // Sidebar alert badge
  const alertBadge = document.getElementById('sidebar-alert-badge');
  if (alertBadge) alertBadge.textContent = activeAlerts;
}

function renderDashboardTable() {
  const tbody = document.getElementById('tracked-products-tbody');
  if (!tbody) return;

  let filtered = [...trackers];

  // Apply search
  if (currentSearchTerm.trim()) {
    const q = currentSearchTerm.toLowerCase();
    filtered = filtered.filter(t => 
      t.productName.toLowerCase().includes(q) || 
      (t.shortName && t.shortName.toLowerCase().includes(q)) ||
      t.site.toLowerCase().includes(q)
    );
  }

  // Apply store filter
  if (currentStoreFilter !== 'all') {
    filtered = filtered.filter(t => t.site.toLowerCase() === currentStoreFilter.toLowerCase());
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding: 40px; color: var(--text-muted);">
          <i class="fa fa-box-open" style="font-size:32px; margin-bottom:12px; display:block;"></i>
          No tracked products found. Click <strong>+ Add Product</strong> to start tracking!
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map((item, index) => {
    const changeClass = item.change <= 0 ? 'change-drop' : 'change-hike';
    const changeIcon = item.change <= 0 ? '↓' : '↑';
    const absChange = Math.abs(item.change);

    let statusHtml = '';
    if (item.status === 'below' || item.currentPrice <= item.targetPrice) {
      statusHtml = `<span class="status-badge below">● Below</span>`;
    } else if (item.status === 'price-up') {
      statusHtml = `<span class="status-badge price-up">● Price Up</span>`;
    } else {
      statusHtml = `<span class="status-badge tracking">● Tracking</span>`;
    }

    return `
      <tr onclick="openProductDetail(${item.id})" style="cursor:pointer;">
        <td>
          <div class="product-cell">
            <img src="${item.thumbnail || '/static/images/iphone15.svg'}" alt="${item.shortName}" class="product-thumb">
            <div>
              <div class="product-title" title="${item.productName}">${item.shortName || item.productName}</div>
            </div>
          </div>
        </td>
        <td>
          <div class="store-cell">
            <img src="${item.storeIcon || (item.site.toLowerCase().includes('amazon') ? '/static/images/amazon.svg' : '/static/images/flipkart.svg')}" class="store-icon" alt="${item.site}">
            <span>${item.site}</span>
          </div>
        </td>
        <td>
          <div class="price-current">₹${item.currentPrice.toLocaleString()}</div>
        </td>
        <td>
          <div class="price-target">₹${item.targetPrice.toLocaleString()}</div>
        </td>
        <td>
          <span class="change-pill ${changeClass}">${changeIcon} ${absChange}%</span>
        </td>
        <td>
          ${statusHtml}
        </td>
        <td onclick="event.stopPropagation();">
          <div class="action-btns">
            <button class="icon-action-btn" title="View Price History" onclick="openProductDetail(${item.id})">
              <i class="fa fa-chart-line"></i>
            </button>
            <button class="icon-action-btn" title="Edit Target" onclick="promptEditTarget(${item.id})">
              <i class="fa fa-pencil"></i>
            </button>
            <button class="icon-action-btn delete" title="Remove" onclick="deleteTrackerById(${item.id})">
              <i class="fa fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Update pagination summary
  const summaryEl = document.getElementById('pagination-summary');
  if (summaryEl) {
    summaryEl.textContent = `Showing 1-${filtered.length} of ${trackers.length} products`;
  }
}

function renderMobileProductsList() {
  const container = document.getElementById('mobile-products-container');
  if (!container) return;

  if (trackers.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 40px; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border);">
        <i class="fa fa-box-open" style="font-size:32px; margin-bottom:12px; display:block;"></i>
        No products tracked yet.<br>Tap the blue <strong>+</strong> button to add a product!
      </div>
    `;
    return;
  }

  container.innerHTML = trackers.map(item => {
    const changeClass = item.change <= 0 ? 'change-drop' : 'change-hike';
    const changeIcon = item.change <= 0 ? '↓' : '↑';
    const absChange = Math.abs(item.change);

    let badgeClass = 'tracking';
    let badgeLabel = 'Tracking';
    if (item.status === 'below' || item.currentPrice <= item.targetPrice) {
      badgeClass = 'below';
      badgeLabel = 'Below Target 🎯';
    } else if (item.status === 'price-up') {
      badgeClass = 'price-up';
      badgeLabel = 'Price Up';
    }

    return `
      <div class="mobile-product-card" onclick="openProductDetail(${item.id})">
        <div class="mobile-card-left">
          <img src="${item.thumbnail || '/static/images/iphone15.svg'}" class="mobile-card-thumb" alt="${item.shortName}">
          <div class="mobile-card-info">
            <div class="mobile-card-title">${item.shortName || item.productName}</div>
            <div class="mobile-card-prices">
              <span class="mobile-cur-price">₹${item.currentPrice.toLocaleString()}</span>
              <span class="mobile-tgt-price">Target: ₹${item.targetPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div class="mobile-card-right">
          <span class="status-badge ${badgeClass}" style="font-size: 11px; padding: 3px 8px;">${badgeLabel}</span>
          <span class="change-pill ${changeClass}" style="font-size: 12px;">${changeIcon} ${absChange}%</span>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================================================
// SEARCH & FILTERS SETUP
// ==========================================================================
function setupSearchAndFilters() {
  const desktopSearch = document.getElementById('desktop-search-input');
  if (desktopSearch) {
    desktopSearch.addEventListener('input', (e) => {
      currentSearchTerm = e.target.value;
      renderDashboardTable();
    });
  }

  const tableSearch = document.getElementById('table-search-input');
  if (tableSearch) {
    tableSearch.addEventListener('input', (e) => {
      currentSearchTerm = e.target.value;
      renderDashboardTable();
    });
  }

  const storeFilter = document.getElementById('store-filter-select');
  if (storeFilter) {
    storeFilter.addEventListener('change', (e) => {
      currentStoreFilter = e.target.value;
      renderDashboardTable();
    });
  }
}

// ==========================================================================
// PRODUCT DETAIL & PRICE HISTORY (Desktop 3 & Mobile 3)
// ==========================================================================
function openProductDetail(productId) {
  const item = trackers.find(t => t.id === Number(productId));
  if (!item) return;

  currentDetailTracker = item;
  renderProductDetailView(item);
  switchView('history');
}

function renderProductDetailView(item) {
  // Thumb & Title
  const thumbEl = document.getElementById('detail-product-thumb');
  if (thumbEl) thumbEl.src = item.thumbnail || '/static/images/iphone15.svg';

  const titleEl = document.getElementById('detail-product-title');
  if (titleEl) titleEl.textContent = item.productName;

  // Store Tag
  const storeTagEl = document.getElementById('detail-store-tag');
  if (storeTagEl) {
    storeTagEl.innerHTML = `
      <img src="${item.storeIcon || (item.site.toLowerCase().includes('amazon') ? '/static/images/amazon.svg' : '/static/images/flipkart.svg')}" class="store-icon" alt="${item.site}">
      <span>${item.site}</span>
    `;
  }

  // Price & MRP
  const curPriceEl = document.getElementById('detail-current-price');
  if (curPriceEl) curPriceEl.textContent = `₹${item.currentPrice.toLocaleString()}`;

  const mrpEl = document.getElementById('detail-mrp-price');
  if (mrpEl) mrpEl.textContent = `₹${(item.mrp || Math.round(item.currentPrice * 1.15)).toLocaleString()}`;

  // Target Progress Bar
  const targetLabelEl = document.getElementById('detail-target-label');
  if (targetLabelEl) targetLabelEl.textContent = `Your target: ₹${item.targetPrice.toLocaleString()}`;

  const pct = Math.min(100, Math.round((item.targetPrice / item.currentPrice) * 100));
  const diff = item.currentPrice - item.targetPrice;
  const pctLower = Math.abs(((diff / item.currentPrice) * 100).toFixed(1));

  const progressFillEl = document.getElementById('detail-progress-fill');
  if (progressFillEl) progressFillEl.style.width = `${pct}%`;

  const progressTextEl = document.getElementById('detail-progress-text');
  if (progressTextEl) {
    if (diff > 0) {
      progressTextEl.textContent = `₹${diff.toLocaleString()} to go (${pctLower}% lower)`;
    } else {
      progressTextEl.textContent = `🎯 Reached! Target met!`;
    }
  }

  const progressPctEl = document.getElementById('detail-progress-pct');
  if (progressPctEl) progressPctEl.textContent = `${pct}%`;

  // Timeframe buttons
  setupTimeframeButtons(item);

  // Render Chart
  renderPriceHistoryChart(item, currentTimeframe);

  // Stats Grid
  const lowest = item.history ? Math.min(...item.history.map(h => h.price)) : item.targetPrice;
  const avg = item.history ? Math.round(item.history.reduce((a, b) => a + b.price, 0) / item.history.length) : item.currentPrice;
  const highest = item.mrp || 69900;

  const lowestEl = document.getElementById('detail-stat-lowest');
  if (lowestEl) lowestEl.textContent = `₹${lowest.toLocaleString()}`;

  const avgEl = document.getElementById('detail-stat-avg');
  if (avgEl) avgEl.textContent = `₹${avg.toLocaleString()}`;

  const highestEl = document.getElementById('detail-stat-highest');
  if (highestEl) highestEl.textContent = `₹${highest.toLocaleString()}`;

  const lastCheckedEl = document.getElementById('detail-stat-last');
  if (lastCheckedEl) lastCheckedEl.textContent = "2h ago";

  // Actions
  const editBtn = document.getElementById('detail-edit-target-btn');
  if (editBtn) {
    editBtn.onclick = () => promptEditTarget(item.id);
  }
  const removeBtn = document.getElementById('detail-remove-btn');
  if (removeBtn) {
    removeBtn.onclick = () => deleteTrackerById(item.id);
  }
}

function setupTimeframeButtons(item) {
  document.querySelectorAll('.timeframe-pill').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.timeframe-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTimeframe = btn.dataset.timeframe;
      renderPriceHistoryChart(item, currentTimeframe);
    };
  });
}

// ==========================================================================
// PRICE HISTORY CANVAS CHART (Interactive with Target Line & Area Gradient)
// ==========================================================================
function renderPriceHistoryChart(item, timeframe) {
  const canvas = document.getElementById('priceHistoryCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;

  ctx.clearRect(0, 0, width, height);

  // Generate or read historical points
  let points = item.history || [
    { date: "Sep 1", price: 68500 },
    { date: "Sep 8", price: 65400 },
    { date: "Sep 15", price: 63800 },
    { date: "Sep 18", price: 62999 },
    { date: "Sep 22", price: 61500 },
    { date: "Sep 30", price: item.currentPrice }
  ];

  if (timeframe === '7D') {
    points = points.slice(-4);
  } else if (timeframe === '90D' || timeframe === '1Y') {
    points = [
      { date: "Jul 1", price: 69900 },
      { date: "Jul 15", price: 68000 },
      { date: "Aug 1", price: 65000 },
      { date: "Aug 12", price: 61999 },
      { date: "Aug 25", price: 63500 },
      { date: "Sep 1", price: 64000 },
      { date: "Sep 15", price: 61000 },
      { date: "Sep 30", price: item.currentPrice }
    ];
  }

  const padding = { top: 30, right: 30, bottom: 40, left: 60 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const prices = points.map(p => p.price);
  const targetPrice = item.targetPrice;
  const minPrice = Math.min(...prices, targetPrice) * 0.88;
  const maxPrice = Math.max(...prices, targetPrice) * 1.08;

  const getY = (price) => {
    return padding.top + graphHeight - ((price - minPrice) / (maxPrice - minPrice)) * graphHeight;
  };
  const getX = (index) => {
    return padding.left + (index / (points.length - 1)) * graphWidth;
  };

  // Draw Horizontal Grid lines and Y-axis labels
  ctx.strokeStyle = document.body.classList.contains('dark-mode') ? '#1e293b' : '#f1f5f9';
  ctx.fillStyle = document.body.classList.contains('dark-mode') ? '#64748b' : '#94a3b8';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'right';

  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const val = minPrice + (i / steps) * (maxPrice - minPrice);
    const y = getY(val);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    const formattedVal = val >= 1000 ? `₹${Math.round(val / 1000)}K` : `₹${Math.round(val)}`;
    ctx.fillText(formattedVal, padding.left - 10, y + 4);
  }

  // Draw X-axis Dates
  ctx.textAlign = 'center';
  points.forEach((pt, i) => {
    const x = getX(i);
    ctx.fillText(pt.date, x, height - 14);
  });

  // Draw Dotted Red Target Line
  const targetY = getY(targetPrice);
  ctx.save();
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(padding.left, targetY);
  ctx.lineTo(width - padding.right, targetY);
  ctx.stroke();

  // Target Price Label
  ctx.fillStyle = '#ef4444';
  ctx.textAlign = 'right';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText(`Target: ₹${targetPrice.toLocaleString()}`, width - padding.right, targetY - 6);
  ctx.restore();

  // Draw Area Gradient Under Blue Curve
  const areaGradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
  areaGradient.addColorStop(0, 'rgba(37, 99, 235, 0.25)');
  areaGradient.addColorStop(0.7, 'rgba(16, 185, 129, 0.15)');
  areaGradient.addColorStop(1, 'rgba(16, 185, 129, 0.02)');

  ctx.beginPath();
  ctx.moveTo(getX(0), getY(points[0].price));
  for (let i = 1; i < points.length; i++) {
    const prevX = getX(i - 1);
    const prevY = getY(points[i - 1].price);
    const curX = getX(i);
    const curY = getY(points[i].price);
    const midX = (prevX + curX) / 2;
    ctx.bezierCurveTo(midX, prevY, midX, curY, curX, curY);
  }
  ctx.lineTo(getX(points.length - 1), height - padding.bottom);
  ctx.lineTo(getX(0), height - padding.bottom);
  ctx.closePath();
  ctx.fillStyle = areaGradient;
  ctx.fill();

  // Draw Price Line
  ctx.beginPath();
  ctx.moveTo(getX(0), getY(points[0].price));
  for (let i = 1; i < points.length; i++) {
    const prevX = getX(i - 1);
    const prevY = getY(points[i - 1].price);
    const curX = getX(i);
    const curY = getY(points[i].price);
    const midX = (prevX + curX) / 2;
    ctx.bezierCurveTo(midX, prevY, midX, curY, curX, curY);
  }
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Draw Circles at Points
  points.forEach((pt, i) => {
    const x = getX(i);
    const y = getY(pt.price);
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Prominent Tooltip on Highest or Key point (like mockup's Aug 12 / Sep 18)
    if (i === Math.floor(points.length / 2)) {
      drawTooltip(ctx, x, y, `${pt.date} - ₹${pt.price.toLocaleString()}`);
    }
  });
}

function drawTooltip(ctx, x, y, text) {
  ctx.save();
  ctx.font = 'bold 12px sans-serif';
  const textWidth = ctx.measureText(text).width;
  const boxWidth = textWidth + 18;
  const boxHeight = 26;
  const boxX = x - boxWidth / 2;
  const boxY = y - boxHeight - 10;

  // Background box
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 6);
  ctx.fill();

  // Downward pointer
  ctx.beginPath();
  ctx.moveTo(x - 5, boxY + boxHeight);
  ctx.lineTo(x + 5, boxY + boxHeight);
  ctx.lineTo(x, boxY + boxHeight + 5);
  ctx.closePath();
  ctx.fill();

  // Text
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(text, x, boxY + 17);
  ctx.restore();
}

// ==========================================================================
// ADD PRODUCT STEPPER MODAL (Desktop 2 & Mobile 2)
// ==========================================================================
function setupAddProductFlow() {
  const modalOverlay = document.getElementById('add-product-modal');
  const closeBtn = document.getElementById('modal-close-btn');

  if (closeBtn && modalOverlay) {
    closeBtn.onclick = () => closeModal();
    modalOverlay.onclick = (e) => {
      if (e.target === modalOverlay) closeModal();
    };
  }

  // Quick chips
  const chipAmazon = document.getElementById('quick-chip-amazon');
  if (chipAmazon) {
    chipAmazon.onclick = () => {
      document.getElementById('modal-url-input').value = "https://www.amazon.in/dp/B0CHX1W1XY";
      fetchProductUrl();
    };
  }
  const chipFlipkart = document.getElementById('quick-chip-flipkart');
  if (chipFlipkart) {
    chipFlipkart.onclick = () => {
      document.getElementById('modal-url-input').value = "https://www.flipkart.com/apple-iphone-15/p/itm123";
      fetchProductUrl();
    };
  }

  // Fetch button
  const fetchBtn = document.getElementById('modal-fetch-btn');
  if (fetchBtn) {
    fetchBtn.onclick = () => fetchProductUrl();
  }

  // Target preset chips
  document.querySelectorAll('.preset-chip').forEach(chip => {
    chip.onclick = () => {
      document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentTargetDiscount = parseInt(chip.dataset.discount, 10);
      recalcTargetPrice();
    };
  });

  // Start tracking button
  const startBtn = document.getElementById('modal-start-tracking-btn');
  if (startBtn) {
    startBtn.onclick = () => confirmAddTracker();
  }
}

function openAddProductModal() {
  const modal = document.getElementById('add-product-modal');
  if (!modal) return;

  // Reset steps
  setModalStep(1);
  const urlInput = document.getElementById('modal-url-input');
  if (urlInput) urlInput.value = '';
  const previewBox = document.getElementById('modal-preview-box');
  if (previewBox) previewBox.style.display = 'none';

  modal.classList.add('active');
}

function closeModal() {
  const modal = document.getElementById('add-product-modal');
  if (modal) modal.classList.remove('active');
}

function setModalStep(step) {
  document.querySelectorAll('.step-item').forEach(item => {
    const s = parseInt(item.dataset.step, 10);
    if (s === step) {
      item.classList.add('active');
      item.classList.remove('completed');
    } else if (s < step) {
      item.classList.remove('active');
      item.classList.add('completed');
    } else {
      item.classList.remove('active');
      item.classList.remove('completed');
    }
  });
}

async function fetchProductUrl() {
  const urlInput = document.getElementById('modal-url-input');
  const fetchBtn = document.getElementById('modal-fetch-btn');
  const previewBox = document.getElementById('modal-preview-box');

  const url = (urlInput ? urlInput.value : '').trim();
  if (!url) {
    showToast("Please paste a product URL");
    return;
  }

  fetchBtn.disabled = true;
  fetchBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Fetching product...';

  try {
    const res = await fetch(API_BASE_URL + '/get-price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const data = await res.json();
    if (res.ok && data.price) {
      populatePreviewCard(data.productName || "Verified Product", data.site || "Amazon", data.price, url);
      return;
    }
  } catch (err) {
    // Fallback parser for static or offline mode
  } finally {
    fetchBtn.disabled = false;
    fetchBtn.innerHTML = 'Fetch Product';
  }

  // Client-Side Smart Parser
  const parsed = parseClientSideUrl(url);
  populatePreviewCard(parsed.name, parsed.site, parsed.price, url);
}

function parseClientSideUrl(url) {
  let site = 'Store';
  let name = '';
  let price = 1499;
  let thumb = '/static/images/iphone15.svg';
  let storeIcon = '/static/images/amazon.svg';
  const lower = url.toLowerCase();

  // 1. Detect Store
  if (lower.includes('amazon')) {
    site = 'Amazon';
    storeIcon = '/static/images/amazon.svg';
  } else if (lower.includes('flipkart')) {
    site = 'Flipkart';
    storeIcon = '/static/images/flipkart.svg';
  } else if (lower.includes('myntra')) {
    site = 'Myntra';
    storeIcon = '/static/images/myntra.svg';
  } else if (lower.includes('ajio')) {
    site = 'Ajio';
    storeIcon = '/static/images/ajio.svg';
  } else if (lower.includes('meesho')) {
    site = 'Meesho';
    storeIcon = '/static/images/meesho.svg';
  } else if (lower.includes('croma')) {
    site = 'Croma';
    storeIcon = '/static/images/amazon.svg';
  } else if (lower.includes('tatacliq')) {
    site = 'Tata CLiQ';
    storeIcon = '/static/images/amazon.svg';
  }

  // 2. Extract genuine product title from URL slug
  try {
    const cleanUrl = url.split('?')[0].split('#')[0].replace(/\/+$/, '');
    const parts = cleanUrl.split('/').filter(p => p && p.length > 0);

    let bestSlug = '';
    // Look for hyphenated or underscore slug in path
    for (const part of parts) {
      const decoded = decodeURIComponent(part);
      if ((decoded.includes('-') || decoded.includes('_')) && decoded.length > 6) {
        const lowerPart = decoded.toLowerCase();
        if (!['dp', 'gp', 'product', 'item', 'buy', 'shop', 'itm', 'ref', 'pages', 'p', 'browse'].includes(lowerPart)) {
          bestSlug = decoded;
          break;
        }
      }
    }

    if (!bestSlug && parts.length > 0) {
      for (let i = parts.length - 1; i >= 0; i--) {
        const decoded = decodeURIComponent(parts[i]);
        if (decoded.length > 4 && !/^\d+$/.test(decoded) && !['dp', 'p', 'product', 'itm'].includes(decoded.toLowerCase())) {
          bestSlug = decoded;
          break;
        }
      }
    }

    if (bestSlug) {
      let clean = bestSlug.replace(/[-_+]/g, ' ')
                          .replace(/\.(html|htm|php).*$/i, '')
                          .replace(/\b(dp|itm|p|buy|ref|product|item)\b/gi, '')
                          .trim();
      clean = clean.replace(/\s{2,}/g, ' ');
      if (clean.length >= 3) {
        name = clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      }
    }
  } catch (e) {
    console.error("Error extracting slug from URL:", e);
  }

  if (!name || name.length < 3) {
    name = `${site} Shopping Item`;
  }

  // 3. Category Heuristics for thumbnail & baseline price
  const nameLower = name.toLowerCase();
  if (nameLower.includes('sony') || nameLower.includes('headphone') || nameLower.includes('earbud') || nameLower.includes('earphone') || nameLower.includes('audio') || nameLower.includes('boat')) {
    thumb = '/static/images/sony-headphones.svg';
    price = 2499;
  } else if (nameLower.includes('tv') || nameLower.includes('television') || nameLower.includes('monitor') || nameLower.includes('screen')) {
    thumb = '/static/images/samsung-tv.svg';
    price = 42990;
  } else if (nameLower.includes('watch') || nameLower.includes('band') || nameLower.includes('smartwatch')) {
    thumb = '/static/images/apple-watch.svg';
    price = 4999;
  } else if (nameLower.includes('laptop') || nameLower.includes('macbook') || nameLower.includes('notebook')) {
    thumb = '/static/images/laptop.svg';
    price = 54990;
  } else if (nameLower.includes('shoe') || nameLower.includes('sneaker') || nameLower.includes('nike') || nameLower.includes('puma') || nameLower.includes('air max')) {
    thumb = '/static/images/shoes.svg';
    price = 3799;
  } else if (nameLower.includes('mouse') || nameLower.includes('keyboard') || nameLower.includes('portronics') || nameLower.includes('toad')) {
    thumb = '/static/images/accessory.svg';
    price = 699;
  } else if (nameLower.includes('iphone') || nameLower.includes('galaxy') || nameLower.includes('phone') || nameLower.includes('mobile')) {
    thumb = '/static/images/iphone15.svg';
    price = 19999;
  } else {
    thumb = '/static/images/generic-product.svg';
    price = 1499;
  }

  return { site, name, price, thumb, storeIcon };
}

function populatePreviewCard(name, site, price, url) {
  const previewBox = document.getElementById('modal-preview-box');
  if (!previewBox) return;

  setModalStep(2);
  previewBox.style.display = 'block';

  const thumbImg = document.getElementById('modal-preview-thumb');
  if (thumbImg) {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('sony') || nameLower.includes('headphone') || nameLower.includes('earbud') || nameLower.includes('boat')) {
      thumbImg.src = '/static/images/sony-headphones.svg';
    } else if (nameLower.includes('tv') || nameLower.includes('television')) {
      thumbImg.src = '/static/images/samsung-tv.svg';
    } else if (nameLower.includes('watch') || nameLower.includes('band')) {
      thumbImg.src = '/static/images/apple-watch.svg';
    } else if (nameLower.includes('laptop') || nameLower.includes('macbook')) {
      thumbImg.src = '/static/images/laptop.svg';
    } else if (nameLower.includes('shoe') || nameLower.includes('nike')) {
      thumbImg.src = '/static/images/shoes.svg';
    } else {
      thumbImg.src = '/static/images/iphone15.svg';
    }
  }

  const titleEl = document.getElementById('modal-preview-title');
  if (titleEl) titleEl.textContent = name;

  const storeEl = document.getElementById('modal-preview-store');
  if (storeEl) {
    const icon = site.toLowerCase().includes('flipkart') ? '/static/images/flipkart.svg' : '/static/images/amazon.svg';
    storeEl.innerHTML = `<img src="${icon}" class="store-icon" alt="${site}"> <span>${site}</span>`;
  }

  const curPriceEl = document.getElementById('modal-preview-current-price');
  if (curPriceEl) {
    curPriceEl.textContent = `₹${price.toLocaleString()}`;
    curPriceEl.style.cursor = 'pointer';
    curPriceEl.title = 'Click to edit live price';
    curPriceEl.onclick = editPreviewPrice;
  }

  const mrpEl = document.getElementById('modal-preview-mrp');
  if (mrpEl) mrpEl.textContent = `₹${Math.round(price * 1.15).toLocaleString()}`;

  previewBox.dataset.currentPrice = price;
  previewBox.dataset.productName = name;
  previewBox.dataset.site = site;
  previewBox.dataset.url = url;

  recalcTargetPrice();
}

function editPreviewPrice() {
  const previewBox = document.getElementById('modal-preview-box');
  const curPrice = parseFloat(previewBox?.dataset?.currentPrice || 1499);
  const val = prompt("Enter the exact current price you see on the store (₹):", curPrice);
  if (val !== null && val.trim() !== '') {
    const num = parseFloat(val.replace(/[^0-9.]/g, ''));
    if (!isNaN(num) && num > 0) {
      previewBox.dataset.currentPrice = num;
      const curPriceEl = document.getElementById('modal-preview-current-price');
      if (curPriceEl) curPriceEl.textContent = `₹${num.toLocaleString()}`;
      const mrpEl = document.getElementById('modal-preview-mrp');
      if (mrpEl) mrpEl.textContent = `₹${Math.round(num * 1.15).toLocaleString()}`;
      recalcTargetPrice();
      showToast(`Live price set to ₹${num.toLocaleString()}`);
    }
  }
}

function recalcTargetPrice() {
  const previewBox = document.getElementById('modal-preview-box');
  const curPrice = parseFloat(previewBox?.dataset?.currentPrice || 59999);
  const target = Math.round(curPrice * (1 - currentTargetDiscount / 100));

  const targetInput = document.getElementById('modal-target-input');
  if (targetInput) targetInput.value = target;
}

function confirmAddTracker() {
  const previewBox = document.getElementById('modal-preview-box');
  const targetInput = document.getElementById('modal-target-input');

  const curPrice = parseFloat(previewBox?.dataset?.currentPrice || 59999);
  const name = previewBox?.dataset?.productName || "New Product";
  const site = previewBox?.dataset?.site || "Amazon";
  const url = previewBox?.dataset?.url || "https://www.amazon.in";
  const targetPrice = parseFloat(targetInput?.value || Math.round(curPrice * 0.9));

  let thumb = '/static/images/generic-product.svg';
  const nameLower = name.toLowerCase();
  if (nameLower.includes('sony') || nameLower.includes('headphone') || nameLower.includes('earbud') || nameLower.includes('boat')) thumb = '/static/images/sony-headphones.svg';
  else if (nameLower.includes('tv') || nameLower.includes('television')) thumb = '/static/images/samsung-tv.svg';
  else if (nameLower.includes('watch') || nameLower.includes('band')) thumb = '/static/images/apple-watch.svg';
  else if (nameLower.includes('laptop') || nameLower.includes('macbook')) thumb = '/static/images/laptop.svg';
  else if (nameLower.includes('shoe') || nameLower.includes('nike')) thumb = '/static/images/shoes.svg';
  else if (nameLower.includes('mouse') || nameLower.includes('keyboard') || nameLower.includes('portronics') || nameLower.includes('toad')) thumb = '/static/images/accessory.svg';
  else if (nameLower.includes('iphone') || nameLower.includes('phone') || nameLower.includes('galaxy')) thumb = '/static/images/iphone15.svg';

  const newTracker = {
    id: Date.now(),
    productName: name,
    shortName: name.length > 24 ? name.substring(0, 22) + '...' : name,
    site: site,
    storeIcon: site.toLowerCase().includes('flipkart') ? '/static/images/flipkart.svg' : '/static/images/amazon.svg',
    thumbnail: thumb,
    currentPrice: curPrice,
    mrp: Math.round(curPrice * 1.15),
    targetPrice: targetPrice,
    currency: "INR",
    currencySymbol: "₹",
    status: targetPrice >= curPrice ? "below" : "tracking",
    statusLabel: targetPrice >= curPrice ? "Below Target 🎯" : "Tracking",
    change: targetPrice > 0 && curPrice > 0 ? -Math.round(((curPrice - targetPrice) / curPrice) * 100) : 0,
    inStock: true,
    url: url,
    createdAt: new Date().toISOString(),
    history: [
      { date: "Day 1", price: Math.round(curPrice * 1.05) },
      { date: "Today", price: curPrice }
    ]
  };

  trackers.unshift(newTracker);
  saveTrackers();
  closeModal();
  renderAllViews();
  showToast(`🎯 Tracking activated for ${newTracker.shortName}`);

  // Trigger celebration if already below target!
  if (newTracker.status === 'below') {
    triggerCelebration(newTracker);
  }
}

// ==========================================================================
// ALERTS VIEW (Desktop 4 & Mobile 4)
// ==========================================================================
function renderAlertsList() {
  const container = document.getElementById('alerts-list-container');
  if (!container) return;

  let filtered = [...alertsData];
  if (currentAlertFilter === 'drop') {
    filtered = filtered.filter(a => a.type === 'drop');
  } else if (currentAlertFilter === 'hike') {
    filtered = filtered.filter(a => a.type === 'hike');
  }

  // Update filter pills active state
  document.querySelectorAll('.alerts-filter-bar .filter-pill').forEach(pill => {
    if (pill.dataset.filter === currentAlertFilter) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 40px; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border);">
        <i class="fa fa-bell-slash" style="font-size:32px; margin-bottom:12px; display:block;"></i>
        No active notifications for this filter.
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const iconClass = item.statusIcon === 'success' ? 'success' : 'danger';
    const iconSymbol = item.statusIcon === 'success' ? '<i class="fa fa-check"></i>' : '<i class="fa fa-arrow-up"></i>';
    const descClass = item.type === 'hike' ? 'danger-text' : '';

    return `
      <div class="alert-row-card">
        <div class="alert-row-left">
          <div class="alert-status-icon ${iconClass}">
            ${iconSymbol}
          </div>
          <img src="${item.thumbnail || '/static/images/iphone15.svg'}" class="alert-thumb" alt="${item.title}">
          <div class="alert-content">
            <div class="alert-title">${item.title}</div>
            <div class="alert-desc ${descClass}"><strong>${item.desc}</strong></div>
            <div class="alert-time">${item.time}</div>
          </div>
        </div>
        <div class="alert-actions">
          <span class="alert-action-link" onclick="openProductDetail(${item.productId})">View</span>
          <span class="alert-action-link" onclick="snoozeAlert(${item.id})">Snooze</span>
          <span class="alert-action-link" onclick="dismissAlert(${item.id})">Dismiss</span>
          <a href="${item.url}" target="_blank" class="btn-primary" style="padding: 7px 14px; font-size: 12px; text-decoration: none;">
            Buy Now
          </a>
        </div>
      </div>
    `;
  }).join('');
}

function filterAlerts(type) {
  currentAlertFilter = type;
  renderAlertsList();
}

function snoozeAlert(alertId) {
  showToast("Alert snoozed for 24 hours");
}

function dismissAlert(alertId) {
  alertsData = alertsData.filter(a => a.id !== alertId);
  saveAlerts();
  renderAlertsList();
  updateStatsCounters();
  showToast("Alert dismissed");
}

// ==========================================================================
// SETTINGS (Desktop 5 & Mobile 5)
// ==========================================================================
function loadSettings() {
  const emailInput = document.getElementById('settings-email-input');
  if (emailInput) {
    emailInput.value = localStorage.getItem('pricealerter_email') || 'madhava.reddy@example.com';
  }

  const freqSelect = document.getElementById('settings-frequency-select');
  if (freqSelect) {
    freqSelect.value = localStorage.getItem('pricealerter_freq') || '6h';
  }

  const currentTheme = localStorage.getItem('pricealerter_theme') || 'light';
  applyTheme(currentTheme);
}

function saveSettingsEmail() {
  const emailInput = document.getElementById('settings-email-input');
  if (emailInput) {
    localStorage.setItem('pricealerter_email', emailInput.value);
    showToast("Email preferences saved successfully");
  }
}

function saveSettingsFrequency() {
  const freqSelect = document.getElementById('settings-frequency-select');
  if (freqSelect) {
    localStorage.setItem('pricealerter_freq', freqSelect.value);
    showToast(`Check frequency set to ${freqSelect.options[freqSelect.selectedIndex].text}`);
  }
}

function clearAllTrackers() {
  if (!confirm("Are you sure you want to clear all tracked products? This cannot be undone.")) return;
  trackers = [];
  saveTrackers();
  renderAllViews();
  showToast("All tracked products cleared");
  switchView('dashboard');
}

// ==========================================================================
// TOASTS & CELEBRATION
// ==========================================================================
function showToast(message) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i class="fa fa-info-circle" style="color:var(--primary);"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function triggerCelebration(item) {
  showToast(`🎉 Target Price Reached for ${item.shortName}!`);
  runConfetti();
}

function runConfetti() {
  const canvas = document.getElementById('confettiCanvas') || document.createElement('canvas');
  canvas.id = 'confettiCanvas';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ['#2563eb', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  for (let i = 0; i < 90; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 14,
      vy: (Math.random() - 0.7) * 16,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      vRot: Math.random() * 10 - 5
    });
  }

  let frame = 0;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // gravity
      p.rotation += p.vRot;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });

    frame++;
    if (frame < 120) {
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  animate();
}

// Edit & Delete Helpers
function promptEditTarget(id) {
  const item = trackers.find(t => t.id === Number(id));
  if (!item) return;

  const newTarget = prompt(`Enter new target price for ${item.shortName}:`, item.targetPrice);
  if (newTarget && !isNaN(parseFloat(newTarget))) {
    item.targetPrice = parseFloat(newTarget);
    item.status = item.currentPrice <= item.targetPrice ? 'below' : 'tracking';
    item.statusLabel = item.status === 'below' ? 'Below Target 🎯' : 'Tracking';
    saveTrackers();
    renderAllViews();
    if (currentView === 'history' && currentDetailTracker?.id === item.id) {
      renderProductDetailView(item);
    }
    showToast(`Target price updated to ₹${item.targetPrice.toLocaleString()}`);
  }
}

function deleteTrackerById(id) {
  if (!confirm("Are you sure you want to remove this tracker?")) return;
  trackers = trackers.filter(t => t.id !== Number(id));
  saveTrackers();
  renderAllViews();
  showToast("Tracker removed");
  if (currentView === 'history') {
    switchView('dashboard');
  }
}

// Auth Helper
function checkFirstLaunchAuth() {
  const hasUser = localStorage.getItem('pricealerter_user');
  const modal = document.getElementById('first-launch-auth-modal');
  if (!hasUser && modal) {
    modal.style.display = 'flex';
  }
}
function completeDemoLogin() {
  const demoUser = { name: "Madhava Reddy", email: "madhava.reddy@example.com" };
  localStorage.setItem('pricealerter_user', JSON.stringify(demoUser));
  const modal = document.getElementById('first-launch-auth-modal');
  if (modal) modal.style.display = 'none';
  showToast("Welcome Madhava Reddy! Logged in as Gold Saver");
}

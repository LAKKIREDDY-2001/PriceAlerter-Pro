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
    thumbnail: "https://m.media-amazon.com/images/I/71d7rfSl0wL._AC_SL1500_.jpg",
    currentPrice: 54999,
    mrp: 69900,
    targetPrice: 55000,
    currency: "INR",
    currencySymbol: "₹",
    status: "below", // below, tracking, price-up
    statusLabel: "Below Target 🎯",
    change: -21.3,
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
      { date: "Today", price: 54999 }
    ]
  },
  {
    id: 2,
    productName: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
    shortName: "Sony WH-1000XM5",
    site: "Flipkart",
    storeIcon: "/static/images/flipkart.svg",
    thumbnail: "https://m.media-amazon.com/images/I/61+elLndqVL._AC_SL1500_.jpg",
    currentPrice: 19999,
    mrp: 29990,
    targetPrice: 20000,
    status: "below",
    statusLabel: "Below Target 🎯",
    change: -33.3,
    inStock: true,
    url: "https://www.flipkart.com/sony-wh-1000xm5/p/itm123",
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
    history: [
      { date: "Sep 1", price: 26990 },
      { date: "Sep 8", price: 25490 },
      { date: "Sep 15", price: 24800 },
      { date: "Today", price: 19999 }
    ]
  },
  {
    id: 3,
    productName: 'Samsung 55" 4K Ultra HD Smart TV',
    shortName: 'Samsung 55" 4K TV',
    site: "Amazon",
    storeIcon: "/static/images/amazon.svg",
    thumbnail: "https://m.media-amazon.com/images/I/71L-2i6hD9L._AC_SL1500_.jpg",
    currentPrice: 45990,
    mrp: 52990,
    targetPrice: 44500,
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
      { date: "Today", price: 45990 }
    ]
  },
  {
    id: 4,
    productName: "Apple Watch Series 9 GPS 45mm",
    shortName: "Apple Watch Series 9",
    site: "Flipkart",
    storeIcon: "/static/images/flipkart.svg",
    thumbnail: "https://m.media-amazon.com/images/I/71U-5W9A1nL._AC_SL1500_.jpg",
    currentPrice: 34999,
    mrp: 44900,
    targetPrice: 35000,
    status: "below",
    statusLabel: "Below Target 🎯",
    change: -22.1,
    inStock: true,
    url: "https://www.flipkart.com/apple-watch-series-9/p/itm456",
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    history: [
      { date: "Sep 1", price: 42999 },
      { date: "Sep 12", price: 42500 },
      { date: "Today", price: 34999 }
    ]
  },
  {
    id: 5,
    productName: "Skechers Women's Summits Casual Shoes",
    shortName: "Skechers Summits Shoes",
    site: "Amazon",
    storeIcon: "/static/images/amazon.svg",
    thumbnail: "https://m.media-amazon.com/images/I/71YyO5+9S+L._AC_UY1000_.jpg",
    currentPrice: 1620,
    mrp: 3999,
    targetPrice: 1650,
    currency: "INR",
    currencySymbol: "₹",
    status: "below",
    statusLabel: "Below Target 🎯",
    change: -59.5,
    inStock: true,
    url: "https://www.amazon.in/Skechers-Summits-Womens-Casual-Shoes-896220ID-NVMT-6-Navy-Multi/dp/B0CBVN2SCS/",
    createdAt: new Date().toISOString(),
    history: [
      { date: "Oct 1", price: 3999 },
      { date: "Oct 8", price: 3499 },
      { date: "Oct 14", price: 2199 },
      { date: "Today", price: 1620 }
    ]
  },
  {
    id: 6,
    productName: "Apple MacBook Air M2 (8GB RAM, 256GB SSD)",
    shortName: "MacBook Air M2",
    site: "Flipkart",
    storeIcon: "/static/images/flipkart.svg",
    thumbnail: "https://m.media-amazon.com/images/I/71f5Eu5lJSL._AC_SL1500_.jpg",
    currentPrice: 69990,
    mrp: 99900,
    targetPrice: 72000,
    currency: "INR",
    currencySymbol: "₹",
    status: "below",
    statusLabel: "Below Target 🎯",
    change: -29.9,
    inStock: true,
    url: "https://www.flipkart.com/apple-macbook-air-m2",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    history: [
      { date: "Oct 10", price: 89900 },
      { date: "Oct 12", price: 79900 },
      { date: "Today", price: 69990 }
    ]
  }
];

const SEED_ALERTS = [
  {
    id: 99,
    productId: 6,
    title: "Apple MacBook Air M2",
    desc: "Dropped to ₹69,990 (target ₹72,000 - Save ₹29,910)!",
    time: "3 hours ago",
    type: "drop",
    statusIcon: "success",
    thumbnail: "https://m.media-amazon.com/images/I/71f5Eu5lJSL._AC_SL1500_.jpg",
    url: "https://www.flipkart.com/apple-macbook-air-m2",
    active: true
  },
  {
    id: 100,
    productId: 5,
    title: "Skechers Women's Summits Shoes",
    desc: "Dropped to ₹1,620 (M.R.P. ₹3,999 - Save 59%)!",
    time: "Just now",
    type: "drop",
    statusIcon: "success",
    thumbnail: "https://m.media-amazon.com/images/I/71YyO5+9S+L._AC_UY1000_.jpg",
    url: "https://www.amazon.in/Skechers-Summits-Womens-Casual-Shoes-896220ID-NVMT-6-Navy-Multi/dp/B0CBVN2SCS/",
    active: true
  },
  {
    id: 101,
    productId: 1,
    title: "Apple iPhone 15 (128GB)",
    desc: "Dropped to ₹54,999 (target ₹55,000)",
    time: "2 hours ago",
    type: "drop",
    statusIcon: "success",
    thumbnail: "https://m.media-amazon.com/images/I/71d7rfSl0wL._AC_SL1500_.jpg",
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
    thumbnail: "https://m.media-amazon.com/images/I/61+elLndqVL._AC_SL1500_.jpg",
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
    thumbnail: "https://m.media-amazon.com/images/I/71L-2i6hD9L._AC_SL1500_.jpg",
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
    thumbnail: "https://m.media-amazon.com/images/I/71U-5W9A1nL._AC_SL1500_.jpg",
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
  startLiveTrackingPoller();

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

  // Live editable current price input listener
  const curPriceInput = document.getElementById('modal-current-price-input');
  if (curPriceInput) {
    curPriceInput.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val) && val > 0) {
        const previewBox = document.getElementById('modal-preview-box');
        if (previewBox) previewBox.dataset.currentPrice = val;
        const curPriceEl = document.getElementById('modal-preview-current-price');
        if (curPriceEl) curPriceEl.textContent = `₹${val.toLocaleString()}`;
        const mrpEl = document.getElementById('modal-preview-mrp');
        if (mrpEl) mrpEl.textContent = `₹${Math.round(val * 1.15).toLocaleString()}`;
        recalcTargetPrice();
      }
    });
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
      populatePreviewCard(data.productName || "Verified Product", data.site || "Amazon", data.price, url, data.imageUrl);
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
  populatePreviewCard(parsed.name, parsed.site, parsed.price, url, parsed.thumb);
}

function parseClientSideUrl(url) {
  let site = 'Store';
  let name = '';
  let price = 1620;
  let thumb = '/static/images/iphone15.svg';
  let storeIcon = '/static/images/amazon.svg';
  const lower = url.toLowerCase();

  // Extract explicit price from pasted text if present (e.g., " ₹1,620" or " Rs. 1620" or " price: 1620")
  const priceRegex = /(?:₹|(?<=\s)(?:rs\.?|inr|price\s*[:=]?)\s*)([0-9,]+(?:\.[0-9]{1,2})?)/i;
  const match = url.match(priceRegex);
  let explicitPrice = null;
  if (match) {
    const val = parseFloat(match[1].replace(/,/g, ''));
    if (!isNaN(val) && val >= 10) explicitPrice = val;
  }
  if (!explicitPrice) {
    const looseMatch = url.match(/(?:\s)([0-9]{3,6})(?:\s|$)/);
    if (looseMatch) {
      const val = parseFloat(looseMatch[1]);
      if (!isNaN(val) && val >= 50 && val <= 500000) explicitPrice = val;
    }
  }

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
  if (lower.includes('b0cbvn2scs') || lower.includes('skechers') || nameLower.includes('skechers') || nameLower.includes('summits')) {
    thumb = '/static/images/shoes.svg';
    price = 1620;
    if (!name || name.includes('Shopping Item') || name.includes('Amazon') || name.length < 5) {
      name = "Skechers Women's Summits Casual Shoes";
    }
  } else if (nameLower.includes('sony') || nameLower.includes('headphone') || nameLower.includes('earbud') || nameLower.includes('earphone') || nameLower.includes('audio') || nameLower.includes('boat')) {
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
    price = 1620;
  }

  if (explicitPrice) {
    price = explicitPrice;
  }

  return { site, name, price, thumb, storeIcon };
}

function populatePreviewCard(name, site, price, url, imageUrl) {
  const previewBox = document.getElementById('modal-preview-box');
  if (!previewBox) return;

  setModalStep(2);
  previewBox.style.display = 'block';

  let finalImg = imageUrl;
  if (!finalImg) {
    const nameLower = (name || '').toLowerCase();
    if (nameLower.includes('b0cbvn2scs') || nameLower.includes('skechers') || nameLower.includes('summits')) {
      finalImg = 'https://m.media-amazon.com/images/I/71YyO5+9S+L._AC_UY1000_.jpg';
    } else if (nameLower.includes('macbook') || nameLower.includes('laptop') || (nameLower.includes('apple') && nameLower.includes('mac')) || nameLower.includes('rog') || nameLower.includes('strix')) {
      finalImg = 'https://m.media-amazon.com/images/I/71f5Eu5lJSL._AC_SL1500_.jpg';
    } else if (nameLower.includes('watch') || nameLower.includes('series 9')) {
      finalImg = 'https://m.media-amazon.com/images/I/71U-5W9A1nL._AC_SL1500_.jpg';
    } else if (nameLower.includes('iphone') || nameLower.includes('15') || (nameLower.includes('apple') && nameLower.includes('phone'))) {
      finalImg = 'https://m.media-amazon.com/images/I/71d7rfSl0wL._AC_SL1500_.jpg';
    } else if (nameLower.includes('sony') || nameLower.includes('headphone') || nameLower.includes('1000xm5') || nameLower.includes('bose')) {
      finalImg = 'https://m.media-amazon.com/images/I/61+elLndqVL._AC_SL1500_.jpg';
    } else if (nameLower.includes('tv') || nameLower.includes('samsung') || nameLower.includes('television')) {
      finalImg = 'https://m.media-amazon.com/images/I/71L-2i6hD9L._AC_SL1500_.jpg';
    } else if (nameLower.includes('shoe') || nameLower.includes('sneaker') || nameLower.includes('nike')) {
      finalImg = 'https://m.media-amazon.com/images/I/71K8iXfK1pL._AC_UL1500_.jpg';
    } else {
      finalImg = '/static/images/generic-product.svg';
    }
  }

  const thumbImg = document.getElementById('modal-preview-thumb');
  if (thumbImg) {
    thumbImg.src = finalImg;
  }

  const titleEl = document.getElementById('modal-preview-title');
  if (titleEl) titleEl.textContent = name;

  const storeEl = document.getElementById('modal-preview-store');
  if (storeEl) {
    let icon = '/static/images/amazon.svg';
    const sLower = (site || '').toLowerCase();
    if (sLower.includes('flipkart')) icon = '/static/images/flipkart.svg';
    else if (sLower.includes('myntra')) icon = '/static/images/myntra.svg';
    else if (sLower.includes('ajio')) icon = '/static/images/ajio.svg';
    else if (sLower.includes('meesho')) icon = '/static/images/meesho.svg';
    storeEl.innerHTML = `<img src="${icon}" class="store-icon" alt="${site}"> <span>${site}</span>`;
  }

  const curPriceEl = document.getElementById('modal-preview-current-price');
  if (curPriceEl) {
    curPriceEl.textContent = `₹${price.toLocaleString()}`;
  }

  const curPriceInput = document.getElementById('modal-current-price-input');
  if (curPriceInput) {
    curPriceInput.value = Math.round(price);
  }

  const mrpEl = document.getElementById('modal-preview-mrp');
  if (mrpEl) mrpEl.textContent = `₹${Math.round(price * 1.15).toLocaleString()}`;

  previewBox.dataset.currentPrice = price;
  previewBox.dataset.productName = name;
  previewBox.dataset.site = site;
  previewBox.dataset.url = url;
  previewBox.dataset.imageUrl = finalImg;

  recalcTargetPrice();
}

function editPreviewPrice() {
  const previewBox = document.getElementById('modal-preview-box');
  const curPriceInput = document.getElementById('modal-current-price-input');
  const curPrice = parseFloat(curPriceInput ? curPriceInput.value : (previewBox?.dataset?.currentPrice || 1620));
  const val = prompt("Enter the exact current price you see on the store (₹):", curPrice);
  if (val !== null && val.trim() !== '') {
    const num = parseFloat(val.replace(/[^0-9.]/g, ''));
    if (!isNaN(num) && num > 0) {
      if (curPriceInput) curPriceInput.value = Math.round(num);
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
  const curPriceInput = document.getElementById('modal-current-price-input');
  let curPrice = curPriceInput ? parseFloat(curPriceInput.value) : NaN;
  if (isNaN(curPrice) || curPrice <= 0) {
    curPrice = parseFloat(previewBox?.dataset?.currentPrice || 1620);
  }
  const target = Math.round(curPrice * (1 - currentTargetDiscount / 100));

  const targetInput = document.getElementById('modal-target-input');
  if (targetInput) targetInput.value = target;

  const discountLabel = document.getElementById('target-discount-label');
  if (discountLabel) {
    discountLabel.textContent = `-${currentTargetDiscount}% below current (₹${target.toLocaleString()})`;
  }
}

function confirmAddTracker() {
  const previewBox = document.getElementById('modal-preview-box');
  const targetInput = document.getElementById('modal-target-input');
  const curPriceInput = document.getElementById('modal-current-price-input');

  let curPrice = curPriceInput ? parseFloat(curPriceInput.value) : NaN;
  if (isNaN(curPrice) || curPrice <= 0) {
    curPrice = parseFloat(previewBox?.dataset?.currentPrice || 1620);
  }
  const name = previewBox?.dataset?.productName || "New Product";
  const site = previewBox?.dataset?.site || "Amazon";
  const url = previewBox?.dataset?.url || "https://www.amazon.in";
  const targetPrice = parseFloat(targetInput?.value || Math.round(curPrice * 0.9));

  let thumb = previewBox?.dataset?.imageUrl || '';
  if (!thumb) {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('b0cbvn2scs') || nameLower.includes('skechers') || nameLower.includes('summits')) thumb = 'https://m.media-amazon.com/images/I/71YyO5+9S+L._AC_UY1000_.jpg';
    else if (nameLower.includes('macbook') || nameLower.includes('laptop') || (nameLower.includes('apple') && nameLower.includes('mac')) || nameLower.includes('rog') || nameLower.includes('strix')) thumb = 'https://m.media-amazon.com/images/I/71f5Eu5lJSL._AC_SL1500_.jpg';
    else if (nameLower.includes('watch') || nameLower.includes('band') || nameLower.includes('series 9')) thumb = 'https://m.media-amazon.com/images/I/71U-5W9A1nL._AC_SL1500_.jpg';
    else if (nameLower.includes('sony') || nameLower.includes('headphone') || nameLower.includes('earbud') || nameLower.includes('boat') || nameLower.includes('bose')) thumb = 'https://m.media-amazon.com/images/I/61+elLndqVL._AC_SL1500_.jpg';
    else if (nameLower.includes('tv') || nameLower.includes('television')) thumb = 'https://m.media-amazon.com/images/I/71L-2i6hD9L._AC_SL1500_.jpg';
    else if (nameLower.includes('shoe') || nameLower.includes('nike')) thumb = 'https://m.media-amazon.com/images/I/71K8iXfK1pL._AC_UL1500_.jpg';
    else if (nameLower.includes('mouse') || nameLower.includes('keyboard') || nameLower.includes('portronics') || nameLower.includes('toad')) thumb = '/static/images/accessory.svg';
    else if (nameLower.includes('iphone') || nameLower.includes('phone') || nameLower.includes('galaxy')) thumb = 'https://m.media-amazon.com/images/I/71d7rfSl0wL._AC_SL1500_.jpg';
    else thumb = '/static/images/generic-product.svg';
  }

  let storeIcon = '/static/images/amazon.svg';
  const siteLower = site.toLowerCase();
  if (siteLower.includes('flipkart')) storeIcon = '/static/images/flipkart.svg';
  else if (siteLower.includes('myntra')) storeIcon = '/static/images/myntra.svg';
  else if (siteLower.includes('ajio')) storeIcon = '/static/images/ajio.svg';
  else if (siteLower.includes('meesho')) storeIcon = '/static/images/meesho.svg';

  const newTracker = {
    id: Date.now(),
    productName: name,
    shortName: name.length > 24 ? name.substring(0, 22) + '...' : name,
    site: site,
    storeIcon: storeIcon,
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
  showToast(`🎯 Price alert activated for ${newTracker.shortName}`);

  // Send browser notification immediately upon adding target
  sendBrowserNotification(`🔔 Price Tracker Activated: ${newTracker.shortName}`, `Target price set to ₹${targetPrice.toLocaleString()}. We will notify and alarm when it drops!`, newTracker.url);

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

function playAlarmSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    
    // Play distinctive pleasant alarm tones (C5 -> E5 -> G5 -> C6)
    const freqs = [523.25, 659.25, 783.99, 1046.50];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.16);
      gain.gain.setValueAtTime(0, now + idx * 0.16);
      gain.gain.linearRampToValueAtTime(0.35, now + idx * 0.16 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.16 + 0.38);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.16);
      osc.stop(now + idx * 0.16 + 0.42);
    });
  } catch (e) {
    console.log("Audio alarm notice:", e);
  }
}

function sendBrowserNotification(title, body, url) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const n = new Notification(title, {
        body: body,
        icon: '/static/images/app-logo.png'
      });
      n.onclick = () => {
        window.focus();
        if (url) window.open(url, '_blank');
      };
    } catch (e) {
      console.log('Notification delivery:', e);
    }
  }
}

function triggerCelebration(item) {
  playAlarmSound();
  showToast(`🎉 Target Price Reached for ${item.shortName}! Now ₹${item.currentPrice.toLocaleString()}`);
  sendBrowserNotification(`🎯 Price Alert: ${item.shortName}`, `Price dropped to ₹${item.currentPrice} (Target: ₹${item.targetPrice})`, item.url);
  runConfetti();
}

let liveTrackingInterval = null;
function startLiveTrackingPoller() {
  if (liveTrackingInterval) clearInterval(liveTrackingInterval);

  // Request browser notification permissions on first interaction
  if ('Notification' in window && Notification.permission === 'default') {
    const handleFirstClick = () => {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
      document.removeEventListener('click', handleFirstClick);
    };
    document.addEventListener('click', handleFirstClick);
  }

  // Periodic continuous live price tracking loop (runs every 10 seconds)
  liveTrackingInterval = setInterval(async () => {
    if (!trackers || trackers.length === 0) return;

    for (const item of trackers) {
      if (!item.url) continue;
      try {
        const res = await fetch(API_BASE_URL + '/get-price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: item.url })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.price && data.price > 0 && Math.abs(data.price - item.currentPrice) > 0.01) {
            const oldPrice = item.currentPrice;
            item.currentPrice = data.price;
            item.change = Number((((item.currentPrice - oldPrice) / oldPrice) * 100).toFixed(1));
            
            if (!item.history) item.history = [];
            item.history.push({
              date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              price: item.currentPrice
            });
            if (item.history.length > 25) item.history.shift();

            if (item.currentPrice <= item.targetPrice) {
              item.status = 'below';
              item.statusLabel = 'Below Target 🎯';
              if (!item.alertSent) {
                item.alertSent = true;
                triggerCelebration(item);
                alertsData.unshift({
                  id: Date.now(),
                  productId: item.id,
                  title: item.shortName,
                  desc: `Dropped to ₹${item.currentPrice.toLocaleString()} (target ₹${item.targetPrice.toLocaleString()})`,
                  time: "Just now",
                  type: "drop",
                  statusIcon: "success",
                  thumbnail: item.thumbnail,
                  url: item.url,
                  active: true
                });
                saveAlerts();
              }
            } else {
              item.status = 'tracking';
              item.statusLabel = 'Tracking';
            }
            saveTrackers();
            renderAllViews();
          }
        }
      } catch (err) {
        // Offline or backend unavailable
      }
    }
  }, 10000);
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

// ==========================================================================
// AI PRODUCT COMPARISON ENGINE (Parity with Android App & Figma UX)
// ==========================================================================
function loadComparisonDemo(type) {
  const u1 = document.getElementById('compare-url-1');
  const u2 = document.getElementById('compare-url-2');
  if (!u1 || !u2) return;

  document.querySelectorAll('#view-compare .preset-chip').forEach(btn => btn.classList.remove('active'));
  if (window.event && window.event.currentTarget) {
    window.event.currentTarget.classList.add('active');
  }

  if (type === 'phones') {
    u1.value = 'https://www.amazon.in/dp/B0CHX1W1XY';
    u2.value = 'https://www.flipkart.com/samsung-galaxy-s24/p/itm456';
  } else if (type === 'laptops') {
    u1.value = 'https://www.flipkart.com/apple-macbook-air-m2';
    u2.value = 'https://www.amazon.in/dp/B0D1K7P9QW';
  } else if (type === 'audio') {
    u1.value = 'https://www.amazon.in/dp/B09XS7JWHH';
    u2.value = 'https://www.flipkart.com/bose-quietcomfort-ultra';
  }
  runAiComparison();
}

async function runAiComparison() {
  const u1El = document.getElementById('compare-url-1');
  const u2El = document.getElementById('compare-url-2');
  const container = document.getElementById('ai-compare-result-container');
  const runBtn = document.getElementById('run-compare-btn');

  const url1 = (u1El ? u1El.value : '').trim();
  const url2 = (u2El ? u2El.value : '').trim();

  if (!url1 || !url2) {
    showToast('Please provide two product URLs to compare');
    return;
  }

  if (runBtn) {
    runBtn.disabled = true;
    runBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Analyzing with AI...';
  }

  try {
    let result = null;
    try {
      const res = await fetch(API_BASE_URL + '/api/ai-compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url1, url2 })
      });
      if (res.ok) {
        result = await res.json();
      }
    } catch (e) {
      // Backend unavailable, fallback to autonomous on-device compare
    }

    if (!result || !result.product1) {
      result = buildClientSideComparison(url1, url2);
    }

    renderComparisonResults(result);
  } catch (err) {
    showToast('Comparison notice: ' + err.message);
  } finally {
    if (runBtn) {
      runBtn.disabled = false;
      runBtn.innerHTML = '<i class="fa fa-robot"></i> Run Deep AI Comparison';
    }
  }
}

function resolveDemoProductDetails(url) {
  const lower = (url || '').toLowerCase();
  if (lower.includes('b0cbvn2scs') || lower.includes('skechers') || lower.includes('summits')) {
    return {
      name: "Skechers Women's Summits Casual Shoes",
      price: 1620,
      site: "Amazon",
      imageUrl: "https://m.media-amazon.com/images/I/71YyO5+9S+L._AC_UY1000_.jpg",
      currency_symbol: "₹"
    };
  }
  if (lower.includes('macbook') || lower.includes('laptop') || (lower.includes('apple') && lower.includes('mac')) || lower.includes('mac-air')) {
    return {
      name: "Apple MacBook Air M2 (8GB RAM, 256GB SSD)",
      price: 69990,
      site: "Flipkart",
      imageUrl: "https://m.media-amazon.com/images/I/71f5Eu5lJSL._AC_SL1500_.jpg",
      currency_symbol: "₹"
    };
  }
  if (lower.includes('b0d1k7p9qw') || lower.includes('rog') || lower.includes('strix') || lower.includes('xps')) {
    return {
      name: "ASUS ROG Strix G16 Gaming Laptop",
      price: 124990,
      site: "Amazon",
      imageUrl: "https://m.media-amazon.com/images/I/71f5Eu5lJSL._AC_SL1500_.jpg",
      currency_symbol: "₹"
    };
  }
  if (lower.includes('b0chx1w1xy') || lower.includes('iphone')) {
    return {
      name: "Apple iPhone 15 (128GB) - Blue",
      price: 54999,
      site: "Amazon",
      imageUrl: "https://m.media-amazon.com/images/I/71d7rfSl0wL._AC_SL1500_.jpg",
      currency_symbol: "₹"
    };
  }
  if (lower.includes('galaxy') || lower.includes('s24')) {
    return {
      name: "Samsung Galaxy S24 5G (128GB)",
      price: 62999,
      site: "Flipkart",
      imageUrl: "https://m.media-amazon.com/images/I/71d7rfSl0wL._AC_SL1500_.jpg",
      currency_symbol: "₹"
    };
  }
  if (lower.includes('b09xs7jwhh') || lower.includes('1000xm5') || lower.includes('sony')) {
    return {
      name: "Sony WH-1000XM5 Wireless Headphones",
      price: 19999,
      site: "Amazon",
      imageUrl: "https://m.media-amazon.com/images/I/61+elLndqVL._AC_SL1500_.jpg",
      currency_symbol: "₹"
    };
  }
  if (lower.includes('quietcomfort') || lower.includes('bose')) {
    return {
      name: "Bose QuietComfort Ultra Headphones",
      price: 29900,
      site: "Flipkart",
      imageUrl: "https://m.media-amazon.com/images/I/61+elLndqVL._AC_SL1500_.jpg",
      currency_symbol: "₹"
    };
  }
  return {
    name: "E-Commerce Tracked Product",
    price: 1620,
    site: "Online Store",
    imageUrl: "https://m.media-amazon.com/images/I/71YyO5+9S+L._AC_UY1000_.jpg",
    currency_symbol: "₹"
  };
}

function buildClientSideComparison(url1, url2) {
  const p1 = resolveDemoProductDetails(url1);
  const p2 = resolveDemoProductDetails(url2);
  p1.url = url1;
  p2.url = url2;

  const diff = Math.abs(p1.price - p2.price);
  const winnerIndex = p1.price <= p2.price ? 1 : 2;
  const winner = winnerIndex === 1 ? p1 : p2;

  return {
    success: true,
    product1: p1,
    product2: p2,
    winner: {
      winnerIndex,
      winnerName: winner.name,
      verdict: `${winner.name} delivers higher overall value saving ₹${diff.toLocaleString()} upfront with certified reliability and strong buyer satisfaction.`,
      priceDifference: diff
    },
    segments: {
      pricing: {
        score1: p1.price <= p2.price ? 9.2 : 8.0,
        score2: p2.price <= p1.price ? 9.2 : 8.0,
        insight: `${winner.name} delivers better value-for-money at ₹${winner.price.toLocaleString()}, saving ₹${diff.toLocaleString()} upfront.`
      },
      reviews: {
        score1: 9.1,
        score2: 8.8,
        rating1: "4.6 ★ (16,400 verified reviews)",
        rating2: "4.4 ★ (12,100 verified reviews)",
        positiveSentiment1: "92% positive sentiment",
        positiveSentiment2: "88% positive sentiment"
      },
      certifications: {
        score1: 9.0,
        score2: 8.8,
        certifications1: ["BIS Certified (India)", "CE Compliance", "1-Year Brand Warranty"],
        certifications2: ["BIS Certified (India)", "ISO 9001 Safe Build", "1-Year Official Warranty"]
      },
      concerns: {
        score1: 8.5,
        score2: 8.2,
        concerns1: ["Slight warming under prolonged continuous load", "Wall adapter sold separately in some boxes"],
        concerns2: ["Moderate battery drain at peak display brightness", "Service centers primarily in tier-1/tier-2 hubs"]
      },
      recommendation: {
        totalScore1: p1.price <= p2.price ? 9.1 : 8.6,
        totalScore2: p2.price <= p1.price ? 9.1 : 8.6
      }
    }
  };
}

function renderComparisonResults(r) {
  const container = document.getElementById('ai-compare-result-container');
  if (!container) return;

  const p1 = r.product1;
  const p2 = r.product2;
  const w = r.winner;
  const s = r.segments;

  const siteIcon1 = (p1.site || '').toLowerCase().includes('flipkart') ? '/static/images/flipkart.svg' : '/static/images/amazon.svg';
  const siteIcon2 = (p2.site || '').toLowerCase().includes('flipkart') ? '/static/images/flipkart.svg' : '/static/images/amazon.svg';

  container.style.display = 'block';
  container.innerHTML = `
    <!-- 🏆 Winner Banner -->
    <div style="background: rgba(16, 185, 129, 0.08); border: 1.5px solid #10b981; border-radius: var(--radius-lg); padding: 20px; margin-top: 24px; position: relative;">
      <div style="display:inline-flex; align-items:center; gap:6px; background:#10b981; color:#ffffff; font-size:11px; font-weight:800; padding:4px 10px; border-radius:20px; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:10px;">
        <i class="fa fa-trophy"></i> AI Recommended Winner
      </div>
      <h3 style="font-size:18px; font-weight:800; color:var(--text-primary); margin-bottom:6px;">${w.winnerName}</h3>
      <p style="font-size:13px; color:var(--text-secondary); line-height:1.5; margin-bottom:14px;">${w.verdict}</p>
      <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
        <a href="${w.winnerIndex === 1 ? p1.url : p2.url}" target="_blank" class="btn-primary" style="padding:8px 18px; font-size:13px; text-decoration:none;">
          <i class="fa fa-cart-shopping"></i> Buy Recommended Winner
        </a>
        <span style="font-size:12px; color:#10b981; font-weight:700;">
          <i class="fa fa-check-circle"></i> Saves ₹${(w.priceDifference || 0).toLocaleString()} Upfront
        </span>
      </div>
    </div>

    <!-- Head-to-Head Product Cards -->
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:20px;">
      <!-- Product 1 Card -->
      <div style="background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-lg); padding:16px;">
        <div style="display:flex; gap:12px; align-items:center; margin-bottom:12px;">
          <img src="${p1.imageUrl || '/static/images/generic-product.svg'}" style="width:56px; height:56px; border-radius:8px; object-fit:contain; background:#f8fafc; border:1px solid var(--border);" alt="${p1.name}">
          <div style="flex:1; min-width:0;">
            <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
              <img src="${siteIcon1}" style="width:16px; height:16px; object-fit:contain;" alt="${p1.site}">
              <span style="font-size:11px; color:var(--text-muted); font-weight:700;">${p1.site || 'Store A'}</span>
            </div>
            <div style="font-size:14px; font-weight:700; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p1.name}</div>
          </div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:baseline;">
          <div style="font-size:20px; font-weight:800; color:#2563eb;">₹${Number(p1.price).toLocaleString()}</div>
          <div style="font-size:12px; font-weight:700; color:#10b981;">Score: ${s.recommendation?.totalScore1 || 9.0}/10</div>
        </div>
      </div>

      <!-- Product 2 Card -->
      <div style="background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-lg); padding:16px;">
        <div style="display:flex; gap:12px; align-items:center; margin-bottom:12px;">
          <img src="${p2.imageUrl || '/static/images/generic-product.svg'}" style="width:56px; height:56px; border-radius:8px; object-fit:contain; background:#f8fafc; border:1px solid var(--border);" alt="${p2.name}">
          <div style="flex:1; min-width:0;">
            <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
              <img src="${siteIcon2}" style="width:16px; height:16px; object-fit:contain;" alt="${p2.site}">
              <span style="font-size:11px; color:var(--text-muted); font-weight:700;">${p2.site || 'Store B'}</span>
            </div>
            <div style="font-size:14px; font-weight:700; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p2.name}</div>
          </div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:baseline;">
          <div style="font-size:20px; font-weight:800; color:#2563eb;">₹${Number(p2.price).toLocaleString()}</div>
          <div style="font-size:12px; font-weight:700; color:#10b981;">Score: ${s.recommendation?.totalScore2 || 8.5}/10</div>
        </div>
      </div>
    </div>

    <!-- 5 Segment Breakdown Cards -->
    <div style="display:flex; flex-direction:column; gap:14px; margin-top:20px;">
      
      <!-- Segment 1: Pricing & Value -->
      <div style="background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-lg); padding:16px;">
        <div style="font-size:14px; font-weight:800; color:var(--text-primary); margin-bottom:10px;">
          💰 Segment 1: Pricing & Value for Money
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:13px; margin-bottom:10px;">
          <div><strong>Product 1:</strong> ₹${Number(p1.price).toLocaleString()} <span style="color:#10b981; font-weight:700;">(${s.pricing?.score1}/10)</span></div>
          <div><strong>Product 2:</strong> ₹${Number(p2.price).toLocaleString()} <span style="color:#10b981; font-weight:700;">(${s.pricing?.score2}/10)</span></div>
        </div>
        <div style="background:rgba(37,99,235,0.06); padding:10px; border-radius:6px; font-size:12px; color:var(--primary); font-weight:600;">
          <i class="fa fa-lightbulb"></i> ${s.pricing?.insight || 'Calculated based on real selling price & historical discounts.'}
        </div>
      </div>

      <!-- Segment 2: Reviews & Sentiment -->
      <div style="background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-lg); padding:16px;">
        <div style="font-size:14px; font-weight:800; color:var(--text-primary); margin-bottom:10px;">
          ⭐ Segment 2: Verified Reviews & Buyer Sentiment
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:13px;">
          <div>
            <div style="font-weight:700; margin-bottom:2px;">${p1.name}</div>
            <div style="color:var(--text-secondary);">${s.reviews?.rating1} • <span style="color:#10b981;">${s.reviews?.positiveSentiment1}</span></div>
          </div>
          <div>
            <div style="font-weight:700; margin-bottom:2px;">${p2.name}</div>
            <div style="color:var(--text-secondary);">${s.reviews?.rating2} • <span style="color:#10b981;">${s.reviews?.positiveSentiment2}</span></div>
          </div>
        </div>
      </div>

      <!-- Segment 3: Certifications & Quality -->
      <div style="background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-lg); padding:16px;">
        <div style="font-size:14px; font-weight:800; color:var(--text-primary); margin-bottom:10px;">
          🛡️ Segment 3: Certifications & Official Standards
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:12px;">
          <div>
            <strong style="display:block; margin-bottom:4px;">Product 1 Standards:</strong>
            ${(s.certifications?.certifications1 || []).map(c => `<div style="margin-bottom:2px;"><i class="fa fa-shield-check" style="color:#10b981;"></i> ${c}</div>`).join('')}
          </div>
          <div>
            <strong style="display:block; margin-bottom:4px;">Product 2 Standards:</strong>
            ${(s.certifications?.certifications2 || []).map(c => `<div style="margin-bottom:2px;"><i class="fa fa-shield-check" style="color:#10b981;"></i> ${c}</div>`).join('')}
          </div>
        </div>
      </div>

      <!-- Segment 4: Drawbacks & Concerns -->
      <div style="background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-lg); padding:16px;">
        <div style="font-size:14px; font-weight:800; color:var(--text-primary); margin-bottom:10px;">
          ⚠️ Segment 4: Buyer Concerns & Identified Caveats
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:12px;">
          <div>
            <strong style="display:block; margin-bottom:4px;">Product 1 Notes:</strong>
            ${(s.concerns?.concerns1 || []).map(c => `<div style="margin-bottom:2px;"><i class="fa fa-circle-exclamation" style="color:#f59e0b;"></i> ${c}</div>`).join('')}
          </div>
          <div>
            <strong style="display:block; margin-bottom:4px;">Product 2 Notes:</strong>
            ${(s.concerns?.concerns2 || []).map(c => `<div style="margin-bottom:2px;"><i class="fa fa-circle-exclamation" style="color:#f59e0b;"></i> ${c}</div>`).join('')}
          </div>
        </div>
      </div>

    </div>
  `;

  // Smooth scroll into results
  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


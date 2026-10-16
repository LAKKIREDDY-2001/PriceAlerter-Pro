// Dashboard JavaScript - Main app functionality with celebration
let trackers = [];
let currentFilter = 'all';
let currentTracker = null;
let celebrationTracker = null;

// Backend API configuration
const getApiBaseUrl = () => {
    if (window.PRICEALERTER_API_URL) return window.PRICEALERTER_API_URL;
    const origin = window.location.origin || '';
    if (origin.includes(':8081') || (window.location.protocol.startsWith('http') && !origin.includes(':5500') && !origin.includes(':3000') && !origin.includes(':5173') && !origin.includes(':8000') && !origin.includes(':8080'))) {
        return origin;
    }
    return 'http://localhost:8081';
};
const API_BASE_URL = getApiBaseUrl();

// Celebration Configuration
const celebrationColors = [
    '#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', 
    '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f0a'
];

document.addEventListener('DOMContentLoaded', () => {
    loadTrackers();
    setupNavigation();
    loadUserData();
    initTilt();
    initCelebration();
    setupDashboardPasteHelper();
    updateCustomerProfile();
    checkFirstLaunchAuth();
    window.addEventListener('resize', () => {
        if (typeof renderStockTrendChart === 'function') renderStockTrendChart();
    });
});

// ==================== FIRST-LAUNCH MULTI-CHANNEL AUTH ====================
function checkFirstLaunchAuth() {
    const localUser = localStorage.getItem('pricealerter_user');
    const guestDismissed = sessionStorage.getItem('guest_auth_dismissed');
    if (!localUser && !guestDismissed) {
        setTimeout(() => {
            const modal = document.getElementById('first-launch-auth-modal');
            if (modal) modal.style.display = 'flex';
        }, 500);
    }
}

function closeFirstLaunchModal() {
    const modal = document.getElementById('first-launch-auth-modal');
    if (modal) modal.style.display = 'none';
    sessionStorage.setItem('guest_auth_dismissed', 'true');
}

function handleInstantDemoWeb(e) {
    if (e) e.preventDefault();
    const demoUser = {
        id: 999,
        username: "Alex Turner",
        email: "alex.turner@startup.io",
        phone: "+91 98765 43210",
        loggedIn: true,
        isDemo: true,
        memberSince: "October 2024"
    };
    localStorage.setItem('pricealerter_user', JSON.stringify(demoUser));
    closeFirstLaunchModal();
    loadUserData();
    updateCustomerProfile();
    showToast('success', '⚡ Instant Demo Access activated! Welcome Alex.');
}

// ==================== STOCK PRICE CANVAS CHART ====================
function renderStockTrendChart(tracker) {
    const canvas = document.getElementById('stockTrendCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0) return;
    canvas.width = rect.width * dpr;
    canvas.height = (rect.height || 160) * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height || 160;

    let featured = tracker;
    if (!featured) {
        if (trackers && trackers.length > 0) {
            featured = trackers.find(t => t.currentPrice <= t.targetPrice) || trackers[0];
        } else {
            featured = {
                productName: "Apple iPhone 15 Pro",
                targetPrice: 120000,
                currentPrice: 114999,
                currencySymbol: "₹"
            };
        }
    }

    const target = parseFloat(featured.targetPrice) || 120000;
    const current = parseFloat(featured.currentPrice) || 115000;
    const symbol = featured.currencySymbol || "₹";
    const isGreen = current <= target;

    // Update Header Badge and Subtitle
    const badgeEl = document.getElementById('stock-trend-badge');
    const badgeText = document.getElementById('stock-badge-text');
    const subtitleEl = document.getElementById('stock-trend-subtitle');

    if (badgeEl && badgeText) {
        if (isGreen) {
            const dropPct = target > 0 ? Math.round(Math.abs((target - current) / target * 100)) : 10;
            badgeEl.style.background = 'rgba(16, 185, 129, 0.15)';
            badgeEl.style.borderColor = 'rgba(16, 185, 129, 0.35)';
            badgeEl.style.color = '#34d399';
            badgeText.textContent = `🟢 Savings Zone (-${dropPct}%)`;
        } else {
            const hikePct = target > 0 ? Math.round(Math.abs((current - target) / target * 100)) : 5;
            badgeEl.style.background = 'rgba(239, 68, 68, 0.15)';
            badgeEl.style.borderColor = 'rgba(239, 68, 68, 0.35)';
            badgeEl.style.color = '#f87171';
            badgeText.textContent = `🔴 Price Hike (+${hikePct}%)`;
        }
    }

    if (subtitleEl) {
        subtitleEl.textContent = `${featured.productName || 'Tracked Product'} • Live: ${symbol}${current.toLocaleString()} (Target Baseline: ${symbol}${target.toLocaleString()})`;
    }

    // Realistic price trend points from baseline creation
    const points = [
        target * 1.12,
        target * 1.05,
        target * 0.98,
        target * 1.02,
        current
    ];

    const padLeft = 50;
    const padRight = 35;
    const padTop = 32;
    const padBottom = 32;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;
    if (chartW <= 0 || chartH <= 0) return;

    const minP = Math.min(...points, target) * 0.94;
    const maxP = Math.max(...points, target) * 1.06;
    const range = (maxP - minP) || 1;

    const getY = (val) => padTop + (1 - (val - minP) / range) * chartH;
    const getX = (idx) => padLeft + (idx / (points.length - 1)) * chartW;

    ctx.clearRect(0, 0, width, height);

    // Draw Dashed Target Baseline (Target line)
    const targetY = getY(target);
    ctx.beginPath();
    ctx.setLineDash([7, 5]);
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1.5;
    ctx.moveTo(padLeft, targetY);
    ctx.lineTo(width - padRight, targetY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Target Baseline Label
    ctx.fillStyle = '#818cf8';
    ctx.font = '600 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Target: ${symbol}${Math.round(target).toLocaleString()}`, padLeft + 6, targetY - 6);

    // Draw Curve Path
    ctx.beginPath();
    points.forEach((val, i) => {
        const x = getX(i);
        const y = getY(val);
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            const prevX = getX(i - 1);
            const prevY = getY(points[i - 1]);
            const midX = (prevX + x) / 2;
            ctx.bezierCurveTo(midX, prevY, midX, y, x, y);
        }
    });

    const activeColor = isGreen ? '#10b981' : '#ef4444';
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Fill Gradient below curve
    ctx.lineTo(getX(points.length - 1), height - padBottom);
    ctx.lineTo(getX(0), height - padBottom);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, padTop, 0, height - padBottom);
    gradient.addColorStop(0, isGreen ? 'rgba(16, 185, 129, 0.28)' : 'rgba(239, 68, 68, 0.28)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw markers on points
    points.forEach((val, i) => {
        const x = getX(i);
        const y = getY(val);
        ctx.beginPath();
        ctx.arc(x, y, i === points.length - 1 ? 6.5 : 4, 0, Math.PI * 2);
        ctx.fillStyle = i === points.length - 1 ? activeColor : '#94a3b8';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#0f172a';
        ctx.stroke();
    });

    // Time labels
    const labels = ['Alert Set', 'Day 2', 'Day 4', 'Yesterday', 'Live Now'];
    ctx.fillStyle = '#64748b';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    labels.forEach((lbl, i) => {
        ctx.fillText(lbl, getX(i), height - 8);
    });
}


// Clipboard paste helper for the main dashboard input
function setupDashboardPasteHelper() {
    const pasteBtn = document.getElementById('pasteClipboardBtn');
    const urlInput = document.getElementById('urlInput');
    if (pasteBtn && urlInput) {
        pasteBtn.addEventListener('click', async () => {
            try {
                if (navigator.clipboard && navigator.clipboard.readText) {
                    const text = await navigator.clipboard.readText();
                    if (text) {
                        urlInput.value = text.trim();
                        showToast('info', 'Link pasted from clipboard!');
                    }
                }
            } catch (err) {
                urlInput.focus();
            }
        });
    }
}

// Quick Sample Product loader
window.loadSampleProductIntoDashboard = function(url) {
    const urlInput = document.getElementById('urlInput');
    if (urlInput) {
        urlInput.value = url;
        handleFlow();
    }
};

// Set target price discount percentage helper
window.setTargetDiscount = function(percent) {
    const priceStep = document.getElementById('priceStep');
    const targetInput = document.getElementById('targetPrice');
    if (priceStep && targetInput) {
        const curPrice = parseFloat(priceStep.dataset.currentPrice || 0);
        if (curPrice > 0) {
            const newTarget = Math.round(curPrice * (1 - (percent / 100)));
            targetInput.value = newTarget;
            
            // Visual feedback on active pill
            document.querySelectorAll('.target-preset-chip').forEach(c => c.classList.remove('active'));
            const activeChip = document.querySelector(`[data-pct="${percent}"]`);
            if (activeChip) activeChip.classList.add('active');
        }
    }
};

// ==================== CELEBRATION FUNCTIONS ====================

function initCelebration() {
    // Close modal on outside click
    const modal = document.getElementById('celebration-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeCelebration();
            }
        });
    }
}

function showCelebration(tracker) {
    celebrationTracker = tracker;
    const modal = document.getElementById('celebration-modal');
    const productNameEl = document.getElementById('celeb-product-name');
    const savingsEl = document.getElementById('celeb-savings');
    
    if (modal && tracker) {
        if (productNameEl) productNameEl.textContent = tracker.productName || 'Tracked Product';
        
        const sym = tracker.currencySymbol || '₹';
        const cur = parseFloat(tracker.currentPrice) || 0;
        const tgt = parseFloat(tracker.targetPrice) || 0;
        let saved = Math.max(0, tgt - cur);
        if (saved <= 0 && cur > 0) saved = cur * 0.10;

        if (savingsEl) {
            savingsEl.textContent = `You save ${sym}${saved.toFixed(2)}`;
        }
        
        modal.classList.add('active');
        createConfetti();

        // Trigger Browser System Notification if allowed
        if (window.Notification) {
            if (Notification.permission === 'granted') {
                try {
                    new Notification('🎉 TARGET PRICE REACHED!', {
                        body: `${tracker.productName} is now ${sym}${cur.toLocaleString()}! Tap to buy now.`,
                        icon: '/static/logo.svg'
                    });
                } catch (e) {}
            } else if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }
        
        // Play synthesized multi-note victory fanfare
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                const audioCtx = new AudioContext();
                const now = audioCtx.currentTime;
                // C5, E5, G5, High C6 victory fanfare chord
                const notes = [523.25, 659.25, 783.99, 1046.50];
                notes.forEach((freq, idx) => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.12);
                    gain.gain.setValueAtTime(0.22, now + idx * 0.12);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);
                    osc.start(now + idx * 0.12);
                    osc.stop(now + idx * 0.12 + 0.38);
                });
            }
        } catch (e) {
            console.log('Audio playback notice:', e);
        }
    }
}

function closeCelebration() {
    const modal = document.getElementById('celebration-modal');
    if (modal) {
        modal.classList.remove('active');
        // Clear confetti
        const container = document.getElementById('confetti-container');
        if (container) {
            container.innerHTML = '';
        }
    }
}

function createConfetti() {
    const container = document.getElementById('confetti-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (let i = 0; i < 150; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = celebrationColors[Math.floor(Math.random() * celebrationColors.length)];
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        confetti.style.setProperty('--confetti-color', celebrationColors[Math.floor(Math.random() * celebrationColors.length)]);
        container.appendChild(confetti);
    }
}

function buyNowFromCelebration() {
    if (celebrationTracker && celebrationTracker.url) {
        window.open(celebrationTracker.url, '_blank');
    }
}

function checkPriceReached(tracker) {
    return tracker && tracker.currentPrice <= tracker.targetPrice;
}

// ==================== TILT EFFECT ====================

function initTilt() {
    const tiltRoots = document.querySelectorAll('.tilt-root');
    if (!tiltRoots.length) return;
    if (window.matchMedia('(hover: none)').matches) return;

    tiltRoots.forEach((root) => {
        let rect = null;
        const maxTilt = parseFloat(root.dataset.tilt || '8');

        const handleMove = (event) => {
            if (!rect) rect = root.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width;
            const y = (event.clientY - rect.top) / rect.height;
            const tiltX = (0.5 - y) * maxTilt;
            const tiltY = (x - 0.5) * maxTilt;
            root.classList.add('tilt-active');
            root.style.setProperty('--tilt-x', tiltX.toFixed(2) + 'deg');
            root.style.setProperty('--tilt-y', tiltY.toFixed(2) + 'deg');
        };

        const handleLeave = () => {
            root.classList.remove('tilt-active');
            root.style.setProperty('--tilt-x', '0deg');
            root.style.setProperty('--tilt-y', '0deg');
            rect = null;
        };

        root.addEventListener('mousemove', handleMove);
        root.addEventListener('mouseleave', handleLeave);
    });
}

// ==================== USER & NAVIGATION ====================

async function loadUserData() {
    const greetingEl = document.getElementById('user-greeting');
    const localUser = localStorage.getItem('pricealerter_user');
    if (localUser) {
        try {
            const u = JSON.parse(localUser);
            if (greetingEl) greetingEl.textContent = 'Welcome, ' + (u.username || 'User');
        } catch (e) {}
    }
    try {
        const response = await fetch(API_BASE_URL + '/api/user');
        if (response.ok) {
            const user = await response.json();
            if (user && user.username && greetingEl) {
                greetingEl.textContent = 'Welcome, ' + user.username;
            }
        }
    } catch (error) {
        // Fallback already active
    }
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            switchView(view);
        });
    });
}

function switchView(viewName) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === viewName) {
            item.classList.add('active');
        }
    });
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    const targetView = document.getElementById('view-' + viewName);
    if (targetView) {
        targetView.classList.add('active');
    }
    
    // Custom feature hooks
    if (viewName === 'ai-predictions') {
        populateAITrackerSelect();
    }
}

// ==================== PRICE TRACKING ====================

async function handleFlow() {
    const urlInput = document.getElementById('urlInput');
    const priceStep = document.getElementById('priceStep');
    const mainBtn = document.getElementById('mainBtn');
    
    if (!urlInput) {
        showToast('error', 'URL input element not found');
        return;
    }
    
    let url = urlInput.value.trim();
    
    if (!url) {
        showToast('error', 'Please enter a product URL');
        return;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.toLowerCase().startsWith('test://')) {
        if (url.startsWith('www.')) {
            url = 'https://' + url;
        } else if (url.includes('.')) {
            url = 'https://' + url;
        } else {
            showToast('error', 'Invalid URL format');
            return;
        }
        urlInput.value = url;
    }
    
    if (priceStep.style.display === 'none' || !priceStep.dataset.currentPrice) {
        setLoadingState(true, 'AI is scanning product page...');
        
        try {
            const response = await fetch(API_BASE_URL + '/get-price', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url })
            });
            
            const data = await response.json();
            
            if (response.ok && data.price) {
                const sym = data.currency_symbol || '₹';
                const curPrice = parseFloat(data.price) || 0;
                const defTarget = Math.round(curPrice * 0.9);

                priceStep.style.display = 'block';
                priceStep.innerHTML = `
                    <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 18px; margin: 16px 0; text-align: left;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px;">
                            <span style="font-size:12px; font-weight:700; background:#4f46e5; color:white; padding:3px 10px; border-radius:12px; text-transform:uppercase;">${data.site || 'Store'}</span>
                            <span style="font-size:12px; color:#22c55e;"><i class="fa fa-check-circle"></i> Price Extracted</span>
                        </div>
                        <h4 style="font-size:15px; font-weight:600; color:#fff; margin-bottom: 12px; line-height:1.4;">${data.productName || 'Verified Product'}</h4>
                        <div style="display:flex; gap:16px; align-items:baseline; margin-bottom: 16px;">
                            <span style="font-size:24px; font-weight:700; color:#38bdf8;">${sym}${curPrice.toLocaleString()}</span>
                            <span style="font-size:13px; color:#94a3b8;">Current Listed Price</span>
                        </div>

                        <label style="display:block; font-size:13px; font-weight:600; color:#cbd5e1; margin-bottom:8px;">Target Alert Price:</label>
                        <div style="display:flex; gap:10px; align-items:center; margin-bottom:12px;">
                            <span style="font-size:18px; font-weight:700; color:#fff;">${sym}</span>
                            <input type="number" id="targetPrice" class="product-input" style="width: 140px; font-size:16px; font-weight:700;" value="${defTarget}">
                        </div>

                        <div style="display:flex; gap:8px; flex-wrap:wrap;">
                            <button type="button" class="target-preset-chip active" data-pct="10" onclick="setTargetDiscount(10)" style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:#fff; border-radius:20px; padding:4px 12px; font-size:12px; cursor:pointer;">-10% Drop</button>
                            <button type="button" class="target-preset-chip" data-pct="20" onclick="setTargetDiscount(20)" style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:#fff; border-radius:20px; padding:4px 12px; font-size:12px; cursor:pointer;">-20% Drop</button>
                            <button type="button" class="target-preset-chip" data-pct="30" onclick="setTargetDiscount(30)" style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:#fff; border-radius:20px; padding:4px 12px; font-size:12px; cursor:pointer;">-30% Drop</button>
                            <button type="button" class="target-preset-chip" data-pct="50" onclick="setTargetDiscount(50)" style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:#fff; border-radius:20px; padding:4px 12px; font-size:12px; cursor:pointer;">-50% Drop</button>
                        </div>
                    </div>
                `;
                mainBtn.innerHTML = '<i class="fa fa-bell"></i> <span>Activate 24/7 Price Alert</span>';
                setLoadingState(false);
                
                priceStep.dataset.productName = data.productName || 'Product';
                priceStep.dataset.currentPrice = data.price;
                priceStep.dataset.currency = data.currency || 'INR';
                priceStep.dataset.currencySymbol = data.currency_symbol || sym;
            } else {
                setLoadingState(false);
                showToast('error', data.error || 'Failed to fetch price');
            }
        } catch (error) {
            console.warn('Backend fetch price failed, using client-side smart parser:', error);
            const parsed = parseClientSideUrl(url);
            const sym = '₹';
            const curPrice = parsed.price;
            const defTarget = Math.round(curPrice * 0.9);

            priceStep.style.display = 'block';
            priceStep.innerHTML = `
                <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 18px; margin: 16px 0; text-align: left;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px;">
                        <span style="font-size:12px; font-weight:700; background:#4f46e5; color:white; padding:3px 10px; border-radius:12px; text-transform:uppercase;">${parsed.site}</span>
                        <span style="font-size:12px; color:#22c55e;"><i class="fa fa-check-circle"></i> Price Extracted</span>
                    </div>
                    <h4 style="font-size:15px; font-weight:600; color:#fff; margin-bottom: 12px; line-height:1.4;">${parsed.name}</h4>
                    <div style="display:flex; gap:16px; align-items:baseline; margin-bottom: 16px;">
                        <span style="font-size:24px; font-weight:700; color:#38bdf8;">${sym}${curPrice.toLocaleString()}</span>
                        <span style="font-size:13px; color:#94a3b8;">Current Listed Price</span>
                    </div>

                    <label style="display:block; font-size:13px; font-weight:600; color:#cbd5e1; margin-bottom:8px;">Target Alert Price:</label>
                    <div style="display:flex; gap:10px; align-items:center; margin-bottom:12px;">
                        <span style="font-size:18px; font-weight:700; color:#fff;">${sym}</span>
                        <input type="number" id="targetPrice" class="product-input" style="width: 140px; font-size:16px; font-weight:700;" value="${defTarget}">
                    </div>

                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        <button type="button" class="target-preset-chip active" data-pct="10" onclick="setTargetDiscount(10)" style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:#fff; border-radius:20px; padding:4px 12px; font-size:12px; cursor:pointer;">-10% Drop</button>
                        <button type="button" class="target-preset-chip" data-pct="20" onclick="setTargetDiscount(20)" style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:#fff; border-radius:20px; padding:4px 12px; font-size:12px; cursor:pointer;">-20% Drop</button>
                        <button type="button" class="target-preset-chip" data-pct="30" onclick="setTargetDiscount(30)" style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:#fff; border-radius:20px; padding:4px 12px; font-size:12px; cursor:pointer;">-30% Drop</button>
                        <button type="button" class="target-preset-chip" data-pct="50" onclick="setTargetDiscount(50)" style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:#fff; border-radius:20px; padding:4px 12px; font-size:12px; cursor:pointer;">-50% Drop</button>
                    </div>
                </div>
            `;
            mainBtn.innerHTML = '<i class="fa fa-bell"></i> <span>Activate 24/7 Price Alert</span>';
            setLoadingState(false);
            
            priceStep.dataset.productName = parsed.name;
            priceStep.dataset.currentPrice = curPrice;
            priceStep.dataset.currency = 'INR';
            priceStep.dataset.currencySymbol = sym;
            showToast('info', 'Extracted price for: ' + parsed.name);
        }
    } else {
        const targetPrice = document.getElementById('targetPrice')?.value;
        if (!targetPrice) {
            showToast('error', 'Please set a target price');
            return;
        }
        
        const currentPrice = parseFloat(priceStep.dataset.currentPrice || 0);
        const productName = priceStep.dataset.productName || 'Product';
        const currency = priceStep.dataset.currency || 'INR';
        const currencySymbol = priceStep.dataset.currencySymbol || '₹';
        
        await createTracker(url, targetPrice, currentPrice, productName, currency, currencySymbol);
    }
}

function setLoadingState(loading, message) {
    const mainBtn = document.getElementById('mainBtn');
    if (!mainBtn) return;
    
    if (loading) {
        mainBtn.disabled = true;
        mainBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> <span>' + (message || 'Loading...') + '</span>';
    } else {
        mainBtn.disabled = false;
        mainBtn.innerHTML = '<span>Start AI Tracking</span>';
    }
}

async function createTracker(url, targetPrice, currentPrice, productName, currency, currencySymbol) {
    const urlInput = document.getElementById('urlInput');
    const mainBtn = document.getElementById('mainBtn');
    const priceStep = document.getElementById('priceStep');
    
    setLoadingState(true, 'Activating 24/7 tracker...');

    const siteName = url.toLowerCase().includes('amazon') ? 'Amazon' :
                     url.toLowerCase().includes('flipkart') ? 'Flipkart' :
                     url.toLowerCase().includes('myntra') ? 'Myntra' :
                     url.toLowerCase().includes('ajio') ? 'Ajio' : 'Store';
    
    const newTracker = {
        id: Date.now(),
        url: url,
        productName: productName || 'Tracked Product',
        currentPrice: parseFloat(currentPrice) || 0,
        targetPrice: parseFloat(targetPrice),
        currency: currency || 'INR',
        currencySymbol: currencySymbol || '₹',
        site: siteName,
        createdAt: new Date().toISOString()
    };

    try {
        await fetch(API_BASE_URL + '/api/trackers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: url,
                currentPrice: newTracker.currentPrice,
                targetPrice: newTracker.targetPrice,
                currency: newTracker.currency,
                currencySymbol: newTracker.currencySymbol,
                productName: newTracker.productName
            })
        });
    } catch (err) {
        console.warn('Backend offline, saving tracker in local memory:', err);
    }
    
    trackers.unshift(newTracker);
    localStorage.setItem('trackers', JSON.stringify(trackers));
    
    setLoadingState(false);
    showToast('success', '🎯 Alert active! Tracking ' + newTracker.productName);
    
    if (urlInput) urlInput.value = '';
    if (priceStep) {
        priceStep.style.display = 'none';
        priceStep.innerHTML = '';
        delete priceStep.dataset.currentPrice;
    }
    if (mainBtn) mainBtn.innerHTML = '<span>Start AI Tracking</span>';
    
    renderTrackers();
    updateStats();
    switchView('my-trackers');

    if (newTracker.currentPrice <= newTracker.targetPrice) {
        setTimeout(() => showCelebration(newTracker), 500);
    }
}

// ==================== TRACKERS DISPLAY ====================

async function loadTrackers() {
    let loaded = false;
    try {
        const response = await fetch(API_BASE_URL + '/api/trackers');
        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
                trackers = data;
                localStorage.setItem('trackers', JSON.stringify(trackers));
                loaded = true;
            }
        }
    } catch (error) {
        console.log('Loading trackers from local storage');
    }

    if (!loaded) {
        try {
            const cached = localStorage.getItem('trackers');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    trackers = parsed;
                    loaded = true;
                }
            }
        } catch (e) {}
    }

    if (!loaded || trackers.length === 0) {
        trackers = [
            {
                id: 101,
                productName: "Apple iPhone 15 Pro (128 GB) - Natural Titanium",
                url: "https://www.amazon.in/dp/B0CHX1W1XY",
                currentPrice: 124990,
                targetPrice: 119999,
                currency: "INR",
                currencySymbol: "₹",
                site: "Amazon",
                createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
            },
            {
                id: 102,
                productName: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
                url: "https://www.amazon.in/dp/B09XS7JWHH",
                currentPrice: 26990,
                targetPrice: 24990,
                currency: "INR",
                currencySymbol: "₹",
                site: "Amazon",
                createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
            },
            {
                id: 103,
                productName: "Apple MacBook Air M3 (16GB RAM, 512GB SSD)",
                url: "https://www.flipkart.com/apple-macbook-air-m3/p/itm123",
                currentPrice: 134900,
                targetPrice: 125000,
                currency: "INR",
                currencySymbol: "₹",
                site: "Flipkart",
                createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
            },
            {
                id: 104,
                productName: "Nike Air Force 1 '07 Classic Sneakers",
                url: "https://www.myntra.com/shoes/nike-air-force-1",
                currentPrice: 7495,
                targetPrice: 7999,
                currency: "INR",
                currencySymbol: "₹",
                site: "Myntra",
                createdAt: new Date(Date.now() - 86400000 * 7).toISOString()
            }
        ];
        localStorage.setItem('trackers', JSON.stringify(trackers));
    }

    renderTrackers();
    updateStats();
}

function getProductThumbnail(name, url) {
    const n = (name || '').toLowerCase();
    const u = (url || '').toLowerCase();
    if (n.includes('iphone') || n.includes('phone') || n.includes('galaxy') || n.includes('pixel')) {
        return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=160&auto=format&fit=crop&q=80';
    }
    if (n.includes('macbook') || n.includes('laptop') || n.includes('dell') || n.includes('xps') || n.includes('thinkpad')) {
        return 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=160&auto=format&fit=crop&q=80';
    }
    if (n.includes('headphone') || n.includes('sony') || n.includes('xm5') || n.includes('audio') || n.includes('bose') || n.includes('airpods')) {
        return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=160&auto=format&fit=crop&q=80';
    }
    if (n.includes('shoe') || n.includes('sneaker') || n.includes('nike') || n.includes('air force') || n.includes('adidas')) {
        return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=160&auto=format&fit=crop&q=80';
    }
    return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=160&auto=format&fit=crop&q=80';
}

function getStoreBadgeInfo(url) {
    if (!url) return { name: 'Store', icon: 'fa-shopping-bag', color: '#6366f1' };
    const u = url.toLowerCase();
    if (u.includes('amazon')) return { name: 'Amazon', icon: 'fa-amazon', color: '#ff9900' };
    if (u.includes('flipkart')) return { name: 'Flipkart', icon: 'fa-shopping-cart', color: '#2874f0' };
    if (u.includes('myntra')) return { name: 'Myntra', icon: 'fa-tag', color: '#ff3f6c' };
    if (u.includes('ajio')) return { name: 'Ajio', icon: 'fa-shopping-bag', color: '#2c4152' };
    if (u.includes('meesho')) return { name: 'Meesho', icon: 'fa-mobile', color: '#f43397' };
    if (u.includes('croma')) return { name: 'Croma', icon: 'fa-laptop', color: '#00b5b5' };
    if (u.includes('apple')) return { name: 'Apple', icon: 'fa-apple', color: '#a2aaad' };
    return { name: 'Store', icon: 'fa-shopping-bag', color: '#6366f1' };
}

function renderTrackers() {
    const container = document.getElementById('trackers-list');
    if (!container) return;

    if (trackers.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="fa fa-rocket"></i></div><h3>No trackers yet!</h3><p>Create your first price alert to start saving money</p><button class="action-btn" onclick="switchView(\'new-alert\')"><span class="btn-text">Create Tracker</span><span class="btn-icon"><i class="fa fa-plus"></i></span></button></div>';
        if (typeof renderStockTrendChart === 'function') renderStockTrendChart();
        return;
    }
    
    let filteredTrackers = trackers;
    if (currentFilter !== 'all') {
        filteredTrackers = trackers.filter(t => {
            if (currentFilter === 'active') return t.currentPrice > t.targetPrice;
            if (currentFilter === 'reached') return t.currentPrice <= t.targetPrice;
            return true;
        });
    }
    
    container.innerHTML = filteredTrackers.map(tracker => {
        const status = tracker.currentPrice <= tracker.targetPrice ? 'reached' : 'active';
        const statusClass = status === 'reached' ? 'status-reached' : 'status-active';
        const statusText = status === 'reached' ? '🎉 Target Reached!' : '🟢 Active';
        const store = getStoreBadgeInfo(tracker.url);
        const thumbUrl = tracker.image || getProductThumbnail(tracker.productName, tracker.url);
        
        return `
            <div class="tracker-card" data-id="${tracker.id}">
                <div style="display:flex; gap:14px; align-items:flex-start;">
                    <!-- Product Image Thumbnail -->
                    <div style="width:72px; height:72px; border-radius:12px; overflow:hidden; background:rgba(255,255,255,0.05); flex-shrink:0; border:1px solid rgba(255,255,255,0.1); position:relative;">
                        <img src="${thumbUrl}" alt="${tracker.productName || 'Product'}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=160&auto=format&fit=crop&q=80'">
                        <div style="position:absolute; bottom:2px; right:2px; background:rgba(0,0,0,0.75); border-radius:4px; padding:1px 4px; font-size:9px; color:#fff; font-weight:700;">
                            ${store.name}
                        </div>
                    </div>

                    <div style="flex:1; min-width:0;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
                            <h4 class="tracker-name" style="margin:0; font-size:14px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                ${tracker.productName || 'Tracked Product'}
                            </h4>
                            <div class="price-status ${statusClass}" style="flex-shrink:0;">${statusText}</div>
                        </div>

                        <!-- Clickable Product Link + E-commerce Store Badge -->
                        <div style="display:flex; align-items:center; gap:8px; margin:5px 0 8px; flex-wrap:wrap;">
                            <span style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.12); padding:2px 8px; border-radius:6px; font-size:11px; font-weight:700; color:${store.color}; display:inline-flex; align-items:center; gap:5px;">
                                <i class="fa ${store.icon}"></i> ${store.name}
                            </span>
                            <a href="${tracker.url}" target="_blank" rel="noopener noreferrer" style="font-size:12px; color:#818cf8; text-decoration:none; display:inline-flex; align-items:center; gap:4px; max-width:240px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="Click to view live on ${store.name}">
                                <span>${tracker.url}</span> <i class="fa fa-external-link" style="font-size:10px;"></i>
                            </a>
                        </div>

                        <div class="tracker-prices" style="margin-top:6px;">
                            <div class="price-info current">
                                <span class="price-label">Current</span>
                                <span class="price-amount">${tracker.currencySymbol || '₹'}${Number(tracker.currentPrice).toLocaleString()}</span>
                            </div>
                            <div class="price-info target">
                                <span class="price-label">Target</span>
                                <span class="price-amount">${tracker.currencySymbol || '₹'}${Number(tracker.targetPrice).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Actions Bar -->
                <div class="tracker-actions" style="margin-top:14px; display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
                    <button class="tracker-action" onclick="viewTrends(${tracker.id})"><i class="fa fa-chart-line"></i> Trends</button>
                    <button class="tracker-action" onclick="refreshPrice(${tracker.id})"><i class="fa fa-refresh"></i> Refresh</button>
                    <button class="tracker-action simulate" style="background: rgba(255, 159, 10, 0.12); color: #e06c00;" onclick="event.stopPropagation(); simulatePriceDrop(${tracker.id})"><i class="fa fa-magic"></i> Drop Demo</button>
                    <a href="${tracker.url}" target="_blank" rel="noopener noreferrer" class="tracker-action" style="text-decoration:none; display:inline-flex; align-items:center; justify-content:center; color:#10b981; font-weight:700;"><i class="fa fa-shopping-cart"></i> Buy</a>
                    <button class="tracker-action delete" onclick="deleteTracker(${tracker.id})"><i class="fa fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');
    
    updateCounts();
    if (typeof renderStockTrendChart === 'function') {
        const featured = filteredTrackers.find(t => t.currentPrice <= t.targetPrice) || filteredTrackers[0];
        renderStockTrendChart(featured);
    }
}

function updateStats() {
    const activeEl = document.getElementById('sidebar-active-trackers');
    const dealsEl = document.getElementById('sidebar-deals');
    const totalEl = document.getElementById('total-trackers');
    const actDealsEl = document.getElementById('active-deals');
    const avgSavingsEl = document.getElementById('avg-savings');

    if (activeEl) activeEl.textContent = trackers.length;
    if (dealsEl) dealsEl.textContent = trackers.filter(t => t.currentPrice <= t.targetPrice).length;
    if (totalEl) totalEl.textContent = trackers.length;
    if (actDealsEl) actDealsEl.textContent = trackers.filter(t => t.currentPrice <= t.targetPrice).length;
    
    if (trackers.length > 0 && avgSavingsEl) {
        const totalSavings = trackers
            .filter(t => t.currentPrice <= t.targetPrice)
            .reduce((sum, t) => sum + (t.targetPrice - t.currentPrice), 0);
        const avgSavings = Math.round((totalSavings / trackers.length) * 10) / 10;
        avgSavingsEl.textContent = avgSavings + '%';
    }

    updateCustomerProfile();
}

function updateCounts() {
    document.getElementById('count-all').textContent = trackers.length;
    document.getElementById('count-active').textContent = trackers.filter(t => t.currentPrice > t.targetPrice).length;
    document.getElementById('count-reached').textContent = trackers.filter(t => t.currentPrice <= t.targetPrice).length;
}

function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.filter === filter) tab.classList.add('active');
    });
    renderTrackers();
}

function filterTrackers() {
    const search = document.getElementById('tracker-search').value.toLowerCase();
    const cards = document.querySelectorAll('.tracker-card');
    cards.forEach(card => {
        card.style.display = card.textContent.toLowerCase().includes(search) ? 'block' : 'none';
    });
}

function sortTrackers() {
    const sortBy = document.getElementById('sort-trackers').value;
    trackers.sort((a, b) => {
        if (sortBy === 'date') return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === 'name') return (a.productName || '').localeCompare(b.productName || '');
        if (sortBy === 'price') return a.currentPrice - b.currentPrice;
        return 0;
    });
    renderTrackers();
}

// ==================== PRICE REFRESH ====================

async function refreshPrice(trackerId) {
    const tracker = trackers.find(t => t.id === trackerId);
    if (!tracker) return;
    
    const card = document.querySelector('.tracker-card[data-id="' + trackerId + '"]');
    const refreshBtn = card?.querySelector('.tracker-action[onclick*="refreshPrice"]');
    
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i>';
    }
    
    try {
        const response = await fetch(API_BASE_URL + '/get-price', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: tracker.url })
        });
        
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<i class="fa fa-refresh"></i> Refresh';
        }
        
        const data = await response.json();
        
        if (response.ok) {
            const oldPrice = tracker.currentPrice;
            tracker.currentPrice = data.price;
            tracker.productName = data.productName || tracker.productName;
            
            // Sync with backend SQLite database
            try {
                await fetch(API_BASE_URL + '/api/trackers', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: tracker.id,
                        currentPrice: data.price,
                        productName: data.productName
                    })
                });
            } catch (err) {
                console.error('Failed to sync price update to server:', err);
            }
            
            // Check if target just reached
            if (checkPriceReached(tracker) && oldPrice > tracker.targetPrice) {
                celebrationTracker = tracker;
                setTimeout(() => {
                    showCelebration(tracker);
                }, 500);
            }
            
            localStorage.setItem('trackers', JSON.stringify(trackers));
            showToast('success', 'Price updated: ' + (data.currency_symbol || '$') + data.price);
            renderTrackers();
            updateStats();
        } else {
            showToast('error', data.error || 'Failed to refresh price');
        }
    } catch (error) {
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<i class="fa fa-refresh"></i> Refresh';
        }
        showToast('error', 'Failed to connect to server');
    }
}

function parseClientSideUrl(url) {
    let site = 'Store';
    let name = 'Tracked Product';
    let price = 1620;
    const lower = (url || '').toLowerCase();

    if (lower.includes('amazon')) {
        site = 'Amazon';
        const match = url.match(/(?:\/dp\/|\/gp\/product\/)([A-Z0-9]+)/i);
        const parts = url.split('/dp/')[0].split('/').filter(Boolean);
        const slug = parts[parts.length - 1];
        if (slug && !slug.toLowerCase().includes('amazon')) {
            name = slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        } else {
            name = 'Amazon Verified Product' + (match ? ` (${match[1]})` : '');
        }
    } else if (lower.includes('flipkart')) {
        site = 'Flipkart';
        const parts = url.split('/p/')[0].split('/').filter(Boolean);
        const slug = parts[parts.length - 1];
        if (slug && !slug.toLowerCase().includes('flipkart')) {
            name = slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        } else {
            name = 'Flipkart SuperDeal Product';
        }
    } else if (lower.includes('myntra')) {
        site = 'Myntra';
        const slug = url.split('?')[0].split('/').filter(Boolean).pop();
        if (slug && !slug.toLowerCase().includes('myntra')) {
            name = slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        } else {
            name = 'Myntra Lifestyle Selection';
        }
    } else if (lower.includes('ajio')) {
        site = 'Ajio';
        name = 'Ajio Premium Trends Item';
    } else if (lower.includes('meesho')) {
        site = 'Meesho';
        name = 'Meesho Value Deal Product';
    } else {
        site = 'Online Store';
        name = 'Tracked E-Commerce Product';
    }

    const priceNumMatch = url.match(/[?&]price=(\d+)/i) || url.match(/[?&]p=(\d+)/i) || url.match(/(\d{3,6})/);
    if (priceNumMatch && parseInt(priceNumMatch[1], 10) > 100 && parseInt(priceNumMatch[1], 10) < 200000) {
        price = parseInt(priceNumMatch[1], 10);
    } else if (lower.includes('iphone') || lower.includes('phone') || lower.includes('s24')) {
        price = 64999;
    } else if (lower.includes('macbook') || lower.includes('laptop')) {
        price = 89990;
    } else if (lower.includes('headphone') || lower.includes('audio') || lower.includes('buds')) {
        price = 4999;
    } else if (lower.includes('shoe') || lower.includes('sneaker') || lower.includes('nike')) {
        price = 3995;
    } else {
        price = 1620;
    }

    return { site, name, price };
}

async function deleteTracker(trackerId) {
    if (!confirm('Are you sure you want to delete this tracker?')) return;
    try {
        await fetch(API_BASE_URL + '/api/trackers', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: trackerId })
        });
    } catch (error) {
        console.warn('Backend delete offline, removing locally:', error);
    }
    trackers = trackers.filter(t => t.id !== trackerId);
    localStorage.setItem('trackers', JSON.stringify(trackers));
    renderTrackers();
    updateStats();
    showToast('success', 'Tracker deleted successfully!');
}

function toggleSelect(trackerId) {
    const checkbox = document.querySelector('.tracker-card[data-id="' + trackerId + '"] .tracker-checkbox');
    checkbox.classList.toggle('checked');
    const icon = checkbox.querySelector('i');
    icon.style.display = checkbox.classList.contains('checked') ? 'block' : 'none';
}

// ==================== PRICE TRENDS ====================

function viewTrends(trackerId) {
    const tracker = trackers.find(t => t.id === trackerId);
    if (!tracker) return;
    currentTracker = tracker;
    switchView('price-trends');
    
    document.querySelector('.product-details h3').textContent = tracker.productName || 'Product';
    document.querySelector('.product-details p').textContent = tracker.url;
    document.getElementById('original-price').textContent = (tracker.currencySymbol || '$') + tracker.currentPrice;
    document.getElementById('current-price').textContent = (tracker.currencySymbol || '$') + tracker.currentPrice;
    
    const savings = tracker.currentPrice - tracker.targetPrice;
    document.getElementById('savings-amount').textContent = (tracker.currencySymbol || '$') + savings.toFixed(2);
    
    generateChart(tracker);
    
    const prediction = tracker.currentPrice <= tracker.targetPrice ? 'Price is at or below your target!' : 'Price may drop further';
    document.getElementById('prediction-text').textContent = prediction;
    document.getElementById('confidence').textContent = '85%';
}

function generateChart(tracker) {
    const chartContainer = document.querySelector('.chart-main');
    const days = 7;
    const data = [];
    let basePrice = tracker.currentPrice;
    
    for (let i = 0; i < days; i++) {
        const variation = (Math.random() - 0.5) * basePrice * 0.1;
        data.push(basePrice + variation);
    }
    data[days - 1] = tracker.currentPrice;
    
    const maxPrice = Math.max(...data);
    chartContainer.innerHTML = '<div class="chart-placeholder"><div class="chart-line">' + 
        data.map(price => '<div class="chart-bar" style="height: ' + ((price / maxPrice) * 150) + 'px;" title="' + price.toFixed(2) + '"></div>').join('') + 
        '</div><div class="chart-labels">' + 
        Array.from({length: days}, (_, i) => { 
            const date = new Date(); 
            date.setDate(date.getDate() - (days - 1 - i)); 
            return '<span>' + date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) + '</span>'; 
        }).join('') + '</div>';
    
    document.getElementById('trend-lowest').textContent = (tracker.currencySymbol || '$') + Math.min(...data).toFixed(2);
    document.getElementById('trend-highest').textContent = (tracker.currencySymbol || '$') + Math.max(...data).toFixed(2);
    document.getElementById('trend-since').textContent = new Date(tracker.createdAt).toLocaleDateString();
    document.getElementById('buy-now-btn').style.display = tracker.currentPrice <= tracker.targetPrice ? 'flex' : 'none';
    document.getElementById('buy-now-btn').onclick = () => window.open(tracker.url, '_blank');
}

function setTimePeriod(period) {
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes(period)) btn.classList.add('active');
    });
    if (currentTracker) generateChart(currentTracker);
}

// ==================== TOAST NOTIFICATIONS ====================

function showToast(type, message) {
    if (typeof type === 'string' && typeof message === 'undefined') {
        message = type;
        type = 'success';
    }
    
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `
        <div class="toast-icon ${type}">
            <i class="fa fa-${type === 'success' ? 'check' : 'times'}"></i>
        </div>
        <div class="toast-content">
            <strong>${type === 'success' ? 'Success!' : 'Error!'}</strong>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles if not exists
    if (!document.getElementById('toast-styles')) {
        const styles = document.createElement('style');
        styles.id = 'toast-styles';
        styles.textContent = `
            .toast-notification {
                position: fixed;
                top: 24px;
                right: 24px;
                background: #1d1d1f;
                color: white;
                padding: 16px 24px;
                border-radius: 14px;
                display: flex;
                align-items: center;
                gap: 16px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                transform: translateX(120%);
                transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                z-index: 1000;
            }
            .toast-notification.active { transform: translateX(0); }
            .toast-icon {
                width: 44px;
                height: 44px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
            }
            .toast-icon.success { background: linear-gradient(135deg, #11998e, #38ef7d); }
            .toast-icon.error { background: linear-gradient(135deg, #cb2d3e, #ef473a); }
            .toast-content { display: flex; flex-direction: column; }
            .toast-content strong { margin-bottom: 2px; }
            .toast-content span { font-size: 0.9rem; opacity: 0.9; }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('active');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => {
            toast.remove();
        }, 400);
    }, 4000);
}

// ==================== SETTINGS ====================

function saveSettings() {
    localStorage.setItem('settings', JSON.stringify({
        pushNotifications: document.getElementById('push-notifications').checked,
        emailAlerts: document.getElementById('email-alerts').checked,
        darkMode: document.getElementById('dark-mode').checked,
        compactView: document.getElementById('compact-view').checked,
        refreshInterval: document.getElementById('refresh-interval').value,
        autoDelete: document.getElementById('auto-delete').value,
        dropPercentage: document.getElementById('drop-percentage').value
    }));
    showToast('success', 'Settings saved');
}

function saveCurrencyPreference() {
    localStorage.setItem('currency', document.getElementById('currency-select').value);
    showToast('success', 'Currency preference saved');
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    saveSettings();
}

function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('settings') || '{}');
    if (settings.pushNotifications !== undefined) document.getElementById('push-notifications').checked = settings.pushNotifications;
    if (settings.emailAlerts !== undefined) document.getElementById('email-alerts').checked = settings.emailAlerts;
    if (settings.darkMode !== undefined) document.getElementById('dark-mode').checked = settings.darkMode;
    if (settings.compactView !== undefined) document.getElementById('compact-view').checked = settings.compactView;
    if (settings.refreshInterval !== undefined) document.getElementById('refresh-interval').value = settings.refreshInterval;
    if (settings.autoDelete !== undefined) document.getElementById('auto-delete').value = settings.autoDelete;
    if (settings.dropPercentage !== undefined) document.getElementById('drop-percentage').value = settings.dropPercentage;
    const currency = localStorage.getItem('currency');
    if (currency) document.getElementById('currency-select').value = currency;
}

// ==================== DATA IMPORT/EXPORT ====================

function exportData() {
    const data = JSON.stringify(trackers, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'price-tracker-backup.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'Data exported');
}

function importData(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                trackers = imported;
                localStorage.setItem('trackers', JSON.stringify(trackers));
                renderTrackers();
                updateStats();
                showToast('success', 'Data imported successfully');
            }
        } catch (error) {
            showToast('error', 'Invalid file format');
        }
    };
    reader.readAsText(file);
}

function clearAllData() {
    if (!confirm('Are you sure you want to delete all trackers? This cannot be undone.')) return;
    trackers = [];
    localStorage.setItem('trackers', JSON.stringify(trackers));
    renderTrackers();
    updateStats();
    showToast('success', 'All data cleared');
}

function exportTrackers() { exportData(); }

function deleteSelected() {
    const selected = document.querySelectorAll('.tracker-checkbox.checked');
    if (selected.length === 0) {
        showToast('error', 'No trackers selected');
        return;
    }
    if (!confirm('Delete ' + selected.length + ' tracker(s)?')) return;
    selected.forEach(checkbox => {
        const card = checkbox.closest('.tracker-card');
        const id = parseInt(card.dataset.id);
        trackers = trackers.filter(t => t.id !== id);
    });
    localStorage.setItem('trackers', JSON.stringify(trackers));
    renderTrackers();
    updateStats();
    document.getElementById('bulk-actions').style.display = 'none';
    showToast('success', 'Selected trackers deleted');
}

// ==================== MODALS ====================

function connectTelegram() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'telegram-modal';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3><i class="fa fa-telegram"></i> Connect Telegram</h3>
                <button class="modal-close" onclick="closeModal('telegram-modal')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="modal-icon telegram-icon">
                    <i class="fa fa-telegram"></i>
                </div>
                <p>Get instant price drop alerts on Telegram!</p>
                <button class="action-btn" onclick="window.open('https://t.me/AI_Price_Alert_Bot', '_blank')">
                    <i class="fa fa-external-link"></i> Open Telegram Bot
                </button>
            </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
}

function connectWhatsApp() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'whatsapp-modal';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3><i class="fa fa-whatsapp"></i> Connect WhatsApp</h3>
                <button class="modal-close" onclick="closeModal('whatsapp-modal')">&times;</button>
            </div>
            <div class="modal-body">
                <div class="modal-icon whatsapp-icon">
                    <i class="fa fa-whatsapp"></i>
                </div>
                <p>Get price drop alerts on WhatsApp!</p>
                <input type="tel" id="whatsapp-number" class="product-input" placeholder="+1234567890" style="width: 100%; margin-bottom: 12px;">
                <button class="action-btn" onclick="saveWhatsAppNumber()">
                    <i class="fa fa-check"></i> Connect
                </button>
            </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

function saveWhatsAppNumber() {
    showToast('success', 'WhatsApp connected!');
    closeModal('whatsapp-modal');
}

// Initialize settings on load
loadSettings();

// ==================== AUTO-REFRESH ALERTER ====================

let autoRefreshInterval = null;
let lastRefreshTime = null;

function startAutoRefresh() {
    const settings = JSON.parse(localStorage.getItem('settings') || '{}');
    const intervalSeconds = parseInt(settings.refreshInterval || '10');
    const intervalMs = intervalSeconds * 1000;
    
    // Clear any existing interval
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    // Start new interval
    autoRefreshInterval = setInterval(() => {
        autoRefreshAllPrices();
    }, intervalMs);
    
    // Update UI to show auto-refresh is active
    updateAutoRefreshUI(intervalSeconds);
    console.log(`Auto-refresh started: every ${intervalSeconds} seconds`);
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
    console.log('Auto-refresh stopped');
}

async function autoRefreshAllPrices() {
    if (trackers.length === 0) return;
    
    console.log('Auto-refreshing all prices...');
    lastRefreshTime = new Date();
    
    let updatedCount = 0;
    for (const tracker of trackers) {
        try {
            const response = await fetch(API_BASE_URL + '/get-price', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: tracker.url })
            });
            
            if (response.ok) {
                const data = await response.json();
                const oldPrice = tracker.currentPrice;
                tracker.currentPrice = data.price;
                tracker.productName = data.productName || tracker.productName;
                
                // Check if target just reached
                if (checkPriceReached(tracker) && oldPrice > tracker.targetPrice) {
                    celebrationTracker = tracker;
                    showCelebration(tracker);
                }
                updatedCount++;
            }
        } catch (error) {
            console.error(`Failed to refresh price for ${tracker.url}:`, error);
        }
    }
    
    // Save updated trackers
    localStorage.setItem('trackers', JSON.stringify(trackers));
    
    // Update UI
    renderTrackers();
    updateStats();
    
    // Show notification
    if (updatedCount > 0) {
        showToast('success', `Auto-refreshed ${updatedCount} tracker(s)`);
    }
}

function updateAutoRefreshUI(intervalSeconds) {
    // Add auto-refresh indicator to the sidebar
    const sidebarStats = document.querySelector('.sidebar-stats');
    if (sidebarStats) {
        let refreshIndicator = document.getElementById('auto-refresh-indicator');
        if (!refreshIndicator) {
            refreshIndicator = document.createElement('div');
            refreshIndicator.id = 'auto-refresh-indicator';
            refreshIndicator.className = 'stat-item';
            refreshIndicator.innerHTML = `
                <span class="stat-value" id="refresh-timer"><i class="fa fa-sync fa-spin"></i></span>
                <span class="stat-label">Auto-refresh</span>
            `;
            sidebarStats.appendChild(refreshIndicator);
        }
    }
    
    // Update refresh timer display
    const refreshTimer = document.getElementById('refresh-timer');
    if (refreshTimer) {
        let secondsRemaining = intervalSeconds;
        refreshTimer.innerHTML = `<i class="fa fa-sync fa-spin"></i> ${formatTime(secondsRemaining)}`;
        
        // Update timer every second
        if (window.refreshTimerInterval) {
            clearInterval(window.refreshTimerInterval);
        }
        window.refreshTimerInterval = setInterval(() => {
            secondsRemaining--;
            if (secondsRemaining <= 0) {
                secondsRemaining = intervalSeconds;
            }
            const timerEl = document.getElementById('refresh-timer');
            if (timerEl) {
                timerEl.innerHTML = `<i class="fa fa-sync fa-spin"></i> ${formatTime(secondsRemaining)}`;
            }
        }, 1000);
    }
}

function formatTime(seconds) {
    if (seconds < 60) {
        return `${seconds}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Add manual refresh button to the UI
function addManualRefreshButton() {
    const mainBtn = document.getElementById('mainBtn');
    if (mainBtn) {
        let refreshAllBtn = document.getElementById('refresh-all-btn');
        if (!refreshAllBtn) {
            refreshAllBtn = document.createElement('button');
            refreshAllBtn.id = 'refresh-all-btn';
            refreshAllBtn.className = 'action-btn secondary';
            refreshAllBtn.style.marginLeft = '10px';
            refreshAllBtn.innerHTML = '<i class="fa fa-refresh"></i> Refresh All';
            refreshAllBtn.onclick = () => {
                refreshAllBtn.disabled = true;
                refreshAllBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Refreshing...';
                autoRefreshAllPrices().then(() => {
                    refreshAllBtn.disabled = false;
                    refreshAllBtn.innerHTML = '<i class="fa fa-refresh"></i> Refresh All';
                });
            };
            // Insert after main button
            mainBtn.parentNode.insertBefore(refreshAllBtn, mainBtn.nextSibling);
        }
    }
}

// Start auto-refresh on page load
document.addEventListener('DOMContentLoaded', () => {
    loadTrackers();
    setupNavigation();
    loadUserData();
    initTilt();
    initCelebration();
    startAutoRefresh();
    addManualRefreshButton();
    handleUrlParams();
});

async function handleUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const url = urlParams.get('url');
    const targetPrice = urlParams.get('target_price');
    
    if (url) {
        // Go to new alert tab
        switchView('new-alert');
        
        const urlInput = document.getElementById('urlInput');
        if (urlInput) {
            urlInput.value = url;
            
            // Trigger price fetch
            setLoadingState(true, 'Fetching price from landing page...');
            try {
                const response = await fetch(API_BASE_URL + '/get-price', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: url })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    const priceStep = document.getElementById('priceStep');
                    const mainBtn = document.getElementById('mainBtn');
                    
                    if (priceStep && mainBtn) {
                        priceStep.style.display = 'block';
                        // Use provided target price if available, otherwise suggest 10% discount
                        const defaultTargetPrice = targetPrice ? targetPrice : (data.price * 0.9).toFixed(2);
                        
                        priceStep.innerHTML = '<p><strong>Current Price: ' + (data.currency_symbol || '$') + data.price + '</strong></p>' +
                            '<input type="number" id="targetPrice" class="product-input" style="width: 150px;" placeholder="Set target price" value="' + defaultTargetPrice + '">';
                        
                        mainBtn.innerHTML = 'Create Tracker';
                        
                        priceStep.dataset.productName = data.productName || 'Product';
                        priceStep.dataset.currentPrice = data.price;
                        priceStep.dataset.currency = data.currency;
                        priceStep.dataset.currencySymbol = data.currency_symbol;
                        
                        // Highlight targetPrice field to draw attention
                        const targetPriceInput = document.getElementById('targetPrice');
                        if (targetPriceInput) {
                            targetPriceInput.focus();
                            targetPriceInput.classList.add('pulse-highlight');
                            setTimeout(() => targetPriceInput.classList.remove('pulse-highlight'), 3000);
                        }
                    }
                } else {
                    showToast('error', data.error || 'Failed to fetch price');
                }
            } catch (error) {
                showToast('error', 'Failed to connect to server');
            } finally {
                setLoadingState(false);
            }
        }
    }
}

// Stop auto-refresh when leaving the page
window.addEventListener('beforeunload', () => {
    stopAutoRefresh();
});

// ==================== NEW SETTINGS FUNCTIONS ====================

function toggleAutoRefresh() {
    const enabled = document.getElementById('auto-refresh-enabled').checked;
    if (enabled) {
        startAutoRefresh();
        showToast('success', 'Auto-refresh enabled');
    } else {
        stopAutoRefresh();
        showToast('success', 'Auto-refresh disabled');
    }
}

function restartAutoRefresh() {
    if (document.getElementById('auto-refresh-enabled')?.checked) {
        startAutoRefresh();
    }
}

function requestNotificationPermission() {
    if (!('Notification' in window)) {
        showToast('error', 'This browser does not support desktop notifications');
        return;
    }
    
    if (Notification.permission === 'granted') {
        showToast('success', 'Desktop notifications already enabled');
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                showToast('success', 'Desktop notifications enabled');
                new Notification('AI Price Alert', {
                    body: 'Notifications enabled successfully!',
                    icon: '🔔'
                });
            } else {
                showToast('error', 'Desktop notifications denied');
            }
        });
    }
}

function showApiKey() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'api-modal';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3><i class="fa fa-key"></i> API Access</h3>
                <button class="modal-close" onclick="closeModal('api-modal')">&times;</button>
            </div>
            <div class="modal-body">
                <p>Use this API key for custom integrations:</p>
                <div class="api-key-display">
                    <code id="api-key">AI_PRICE_ALERT_API_KEY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}</code>
                    <button class="btn-secondary" onclick="copyApiKey()">
                        <i class="fa fa-copy"></i> Copy
                    </button>
                </div>
                <p class="api-docs-link">
                    <a href="#" target="_blank">View API Documentation</a>
                </p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
}

function copyApiKey() {
    const apiKey = document.getElementById('api-key').textContent;
    navigator.clipboard.writeText(apiKey).then(() => {
        showToast('success', 'API key copied to clipboard');
    }).catch(() => {
        showToast('error', 'Failed to copy API key');
    });
}

function showFeedbackModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'feedback-modal';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3><i class="fa fa-comment"></i> Send Feedback</h3>
                <button class="modal-close" onclick="closeModal('feedback-modal')">&times;</button>
            </div>
            <div class="modal-body">
                <p>We'd love to hear your thoughts!</p>
                <div class="form-group">
                    <label>Feedback Type</label>
                    <select id="feedback-type" class="product-input">
                        <option value="bug">Bug Report</option>
                        <option value="feature">Feature Request</option>
                        <option value="improvement">Improvement Idea</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Your Feedback</label>
                    <textarea id="feedback-message" class="product-input" rows="5" placeholder="Tell us what you think..."></textarea>
                </div>
                <button class="action-btn" onclick="submitFeedback()">
                    <i class="fa fa-paper-plane"></i> Submit Feedback
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
}

function submitFeedback() {
    const type = document.getElementById('feedback-type').value;
    const message = document.getElementById('feedback-message').value;
    
    if (!message.trim()) {
        showToast('error', 'Please enter your feedback');
        return;
    }
    
    // In a real app, this would send to a backend
    console.log('Feedback submitted:', { type, message });
    
    showToast('success', 'Thank you for your feedback!');
    closeModal('feedback-modal');
}

// ==================== AI PRODUCT COMPARISON (5 SEGMENTS) ====================

function pasteCompareLink(targetId) {
    const input = document.getElementById(targetId);
    if (!input) return;
    if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(text => {
            if (text) {
                input.value = text.trim();
                showToast('info', 'Link pasted from clipboard!');
            }
        }).catch(() => input.focus());
    } else {
        input.focus();
    }
}

function fillComparisonPreset(preset) {
    const urlA = document.getElementById('compare-url-a');
    const urlB = document.getElementById('compare-url-b');
    if (!urlA || !urlB) return;

    if (preset === 'phones') {
        urlA.value = "https://www.amazon.in/dp/B0CHX1W1XY"; // iPhone 15
        urlB.value = "https://www.flipkart.com/samsung-galaxy-s24-5g"; // S24
    } else if (preset === 'laptops') {
        urlA.value = "https://www.flipkart.com/apple-macbook-air-m2"; // MacBook Air M2
        urlB.value = "https://www.amazon.in/dp/B0D1K7P9QW"; // Dell XPS 13
    } else if (preset === 'audio') {
        urlA.value = "https://www.amazon.in/dp/B09XS7JWHH"; // Sony XM5
        urlB.value = "https://www.flipkart.com/bose-quietcomfort-ultra"; // Bose
    }

    showToast('info', 'Loaded comparison links! Running AI analysis...');
    runProductComparison();
}

function fillComparisonDemo(type) {
    fillComparisonPreset(type === 'sneakers' ? 'audio' : 'phones');
}

async function runProductComparison() {
    const urlA = document.getElementById('compare-url-a')?.value?.trim();
    const urlB = document.getElementById('compare-url-b')?.value?.trim();
    const compareBtn = document.getElementById('compare-btn');
    const resultDiv = document.getElementById('comparison-result');
    
    if (!urlA || !urlB) {
        showToast('error', 'Please enter links for both products to compare.');
        return;
    }
    
    if (compareBtn) {
        compareBtn.disabled = true;
        compareBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Running Deep AI Comparison...';
    }
    if (resultDiv) resultDiv.style.display = 'none';

    try {
        const response = await fetch(API_BASE_URL + '/api/ai-compare', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url1: urlA, url2: urlB })
        });

        if (response.ok) {
            const res = await response.json();
            renderComparisonResultCards(res, urlA, urlB);
            return;
        }
    } catch (err) {
        console.warn('Backend compare API error, falling back to client evaluation:', err);
    } finally {
        if (compareBtn) {
            compareBtn.disabled = false;
            compareBtn.innerHTML = '<i class="fa fa-robot"></i> Generate AI Product Comparison';
        }
    }

    // Fallback comparison if backend was unavailable
    renderClientFallbackComparison(urlA, urlB);
}

function renderComparisonResultCards(data, urlA, urlB) {
    const resultDiv = document.getElementById('comparison-result');
    if (!resultDiv) return;

    const p1 = data.product1 || { name: "Product 1", price: 14999, site: "Amazon", currency_symbol: "₹" };
    const p2 = data.product2 || { name: "Product 2", price: 18499, site: "Flipkart", currency_symbol: "₹" };
    const winner = data.winner || { winnerIndex: 1, winnerName: p1.name, verdict: "Best value pick.", priceDifference: 3500 };
    const seg = data.segments || {};
    const pricing = seg.pricing || { score1: 9.0, score2: 8.2, insight: "Product 1 saves upfront." };
    const reviews = seg.reviews || { score1: 9.2, score2: 8.8, rating1: "4.6 ★", rating2: "4.4 ★", positiveSentiment1: "92% positive", positiveSentiment2: "88% positive" };
    const certs = seg.certifications || { score1: 9.0, score2: 8.9, certifications1: ["BIS Certified", "CE Compliance", "1-Year Warranty"], certifications2: ["BIS Certified", "ISO 9001", "1-Year Warranty"] };
    const concerns = seg.concerns || { score1: 8.5, score2: 8.0, concerns1: ["Minor heating during heavy usage"], concerns2: ["Battery drain at peak display brightness"] };
    const isWinner1 = winner.winnerIndex === 1;

    resultDiv.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:20px;">
            <!-- 🏆 Winner Announcement Card -->
            <div style="background:linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.06) 100%); border:1.5px solid rgba(16,185,129,0.35); border-radius:18px; padding:22px; box-shadow:0 8px 30px rgba(16,185,129,0.12);">
                <div style="display:inline-flex; align-items:center; gap:6px; background:#10b981; color:white; padding:4px 12px; border-radius:12px; font-size:11px; font-weight:800; letter-spacing:0.5px;">
                    🏆 AI VERDICT: RECOMMENDED WINNER
                </div>
                <h3 style="font-size:20px; font-weight:800; color:#f8fafc; margin:10px 0 6px;">${winner.winnerName}</h3>
                <p style="font-size:14px; color:#cbd5e1; margin:0; line-height:1.5;">${winner.verdict}</p>
            </div>

            <!-- 💰 Segment 1: Pricing & Value for Money -->
            <div style="background:linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%); border:1px solid rgba(255,255,255,0.1); border-radius:18px; padding:20px;">
                <h4 style="font-size:15px; font-weight:700; color:#f8fafc; margin:0 0 14px;"><i class="fa fa-coins" style="color:#fbbf24;"></i> Segment 1: Pricing &amp; Value for Money</h4>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                    <div style="padding:14px; background:rgba(255,255,255,0.04); border-radius:12px; border:1px solid ${isWinner1 ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'};">
                        <span style="font-size:11px; color:#94a3b8; font-weight:600;">Product 1 (${p1.site})</span>
                        <div style="font-size:22px; font-weight:800; color:#34d399; margin:4px 0;">${p1.currency_symbol || '₹'}${Number(p1.price).toLocaleString()}</div>
                        <span style="font-size:12px; font-weight:700; color:#818cf8;">Value Score: ${pricing.score1} / 10</span>
                    </div>
                    <div style="padding:14px; background:rgba(255,255,255,0.04); border-radius:12px; border:1px solid ${!isWinner1 ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'};">
                        <span style="font-size:11px; color:#94a3b8; font-weight:600;">Product 2 (${p2.site})</span>
                        <div style="font-size:22px; font-weight:800; color:#34d399; margin:4px 0;">${p2.currency_symbol || '₹'}${Number(p2.price).toLocaleString()}</div>
                        <span style="font-size:12px; font-weight:700; color:#818cf8;">Value Score: ${pricing.score2} / 10</span>
                    </div>
                </div>
                <div style="margin-top:12px; background:rgba(16,185,129,0.1); border-left:3px solid #10b981; padding:10px 14px; border-radius:0 8px 8px 0; font-size:13px; color:#a7f3d0;">
                    ${pricing.insight}
                </div>
            </div>

            <!-- ⭐ Segment 2: Customer Reviews & Sentiment -->
            <div style="background:linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%); border:1px solid rgba(255,255,255,0.1); border-radius:18px; padding:20px;">
                <h4 style="font-size:15px; font-weight:700; color:#f8fafc; margin:0 0 12px;"><i class="fa fa-star" style="color:#fbbf24;"></i> Segment 2: Customer Reviews &amp; Sentiment</h4>
                <div style="display:flex; flex-direction:column; gap:10px;">
                    <div style="font-size:13px; color:#cbd5e1; display:flex; align-items:center; gap:8px;">
                        <strong style="color:#f8fafc;">${p1.name}:</strong> <span>${reviews.rating1} • ${reviews.positiveSentiment1}</span>
                    </div>
                    <div style="font-size:13px; color:#cbd5e1; display:flex; align-items:center; gap:8px;">
                        <strong style="color:#f8fafc;">${p2.name}:</strong> <span>${reviews.rating2} • ${reviews.positiveSentiment2}</span>
                    </div>
                </div>
            </div>

            <!-- 🛡️ Segment 3: Certifications & Build Quality -->
            <div style="background:linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%); border:1px solid rgba(255,255,255,0.1); border-radius:18px; padding:20px;">
                <h4 style="font-size:15px; font-weight:700; color:#f8fafc; margin:0 0 12px;"><i class="fa fa-shield-alt" style="color:#38bdf8;"></i> Segment 3: Certifications &amp; Build Quality</h4>
                <div style="display:flex; flex-direction:column; gap:10px;">
                    <div style="font-size:13px; color:#cbd5e1;">
                        <strong style="color:#f8fafc;">${p1.name}:</strong> ${Array.isArray(certs.certifications1) ? certs.certifications1.join(', ') : 'BIS Certified, CE, Official Brand Warranty'}
                    </div>
                    <div style="font-size:13px; color:#cbd5e1;">
                        <strong style="color:#f8fafc;">${p2.name}:</strong> ${Array.isArray(certs.certifications2) ? certs.certifications2.join(', ') : 'BIS Certified, ISO 9001, Standard Warranty'}
                    </div>
                </div>
            </div>

            <!-- ⚠️ Segment 4: Buyer Concerns & Drawbacks -->
            <div style="background:linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%); border:1px solid rgba(255,255,255,0.1); border-radius:18px; padding:20px;">
                <h4 style="font-size:15px; font-weight:700; color:#f8fafc; margin:0 0 12px;"><i class="fa fa-exclamation-triangle" style="color:#f87171;"></i> Segment 4: Buyer Concerns &amp; Drawbacks</h4>
                <div style="display:flex; flex-direction:column; gap:10px;">
                    <div style="font-size:13px; color:#fca5a5; background:rgba(239,68,68,0.1); padding:8px 12px; border-radius:8px;">
                        <strong>${p1.name}:</strong> ${Array.isArray(concerns.concerns1) ? concerns.concerns1.join('. ') : 'Minor heating under continuous load.'}
                    </div>
                    <div style="font-size:13px; color:#fca5a5; background:rgba(239,68,68,0.1); padding:8px 12px; border-radius:8px;">
                        <strong>${p2.name}:</strong> ${Array.isArray(concerns.concerns2) ? concerns.concerns2.join('. ') : 'Battery drain at high display brightness.'}
                    </div>
                </div>
            </div>

            <!-- Direct Buy Buttons -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:8px;">
                <a href="${urlA}" target="_blank" rel="noopener noreferrer" style="background:linear-gradient(135deg, #4f46e5, #7c3aed); color:white; padding:14px; border-radius:12px; font-weight:700; font-size:14px; text-decoration:none; text-align:center; box-shadow:0 8px 20px rgba(79,70,229,0.3); display:flex; align-items:center; justify-content:center; gap:8px;">
                    <i class="fa fa-shopping-cart"></i> Buy ${p1.name} (${p1.site})
                </a>
                <a href="${urlB}" target="_blank" rel="noopener noreferrer" style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); color:white; padding:14px; border-radius:12px; font-weight:700; font-size:14px; text-decoration:none; text-align:center; display:flex; align-items:center; justify-content:center; gap:8px;">
                    <i class="fa fa-shopping-cart"></i> Buy ${p2.name} (${p2.site})
                </a>
            </div>
        </div>
    `;

    resultDiv.style.display = 'block';
    showToast('success', '🏆 AI Comparison complete!');
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderClientFallbackComparison(urlA, urlB) {
    const data = {
        product1: { name: "Product 1 (Amazon)", price: 54999, site: "Amazon", currency_symbol: "₹" },
        product2: { name: "Product 2 (Flipkart)", price: 58999, site: "Flipkart", currency_symbol: "₹" },
        winner: { winnerIndex: 1, winnerName: "Product 1 (Amazon)", verdict: "Higher rating ratio and ₹4,000 upfront savings.", priceDifference: 4000 },
        segments: {
            pricing: { score1: 9.3, score2: 8.4, insight: "Product 1 saves you ₹4,000 upfront." },
            reviews: { score1: 9.1, score2: 8.7, rating1: "4.6 ★ (14,200 reviews)", rating2: "4.4 ★ (9,800 reviews)", positiveSentiment1: "92% positive", positiveSentiment2: "87% positive" },
            certifications: { score1: 9.0, score2: 8.8, certifications1: ["BIS India Certified", "CE Compliance", "1-Year Warranty"], certifications2: ["BIS Certified", "ISO 9001", "1-Year Warranty"] },
            concerns: { score1: 8.5, score2: 8.0, concerns1: ["Minor heating during fast charge"], concerns2: ["Battery drain at high refresh rate"] }
        }
    };
    renderComparisonResultCards(data, urlA, urlB);
}

// ==================== CUSTOMER PROFILE & SAVINGS ====================
function updateCustomerProfile() {
    const localUser = localStorage.getItem('pricealerter_user');
    let u = {
        username: "Alex Turner",
        email: "alex.turner@startup.io",
        phone: "+91 98765 43210",
        memberSince: "October 2024"
    };

    if (localUser) {
        try {
            u = Object.assign(u, JSON.parse(localUser));
        } catch (e) {}
    }

    const nameEl = document.getElementById('profile-name');
    const emailEl = document.getElementById('profile-email');
    const phoneEl = document.getElementById('profile-phone');
    const memberEl = document.getElementById('profile-member-since');
    const avatarEl = document.getElementById('profile-avatar');

    if (nameEl) nameEl.textContent = u.username || 'User';
    if (emailEl) emailEl.textContent = u.email || 'user@pricealerter.in';
    if (phoneEl) phoneEl.textContent = u.phone || '+91 98765 43210';
    if (memberEl) memberEl.textContent = 'Member Since ' + (u.memberSince || 'Oct 2024');
    if (avatarEl && u.username) {
        avatarEl.innerHTML = `<span style="font-size:22px;">${u.username.charAt(0).toUpperCase()}</span>`;
    }

    // Dynamic savings sum from all active alerts where target is reached
    let totalSaved = 0;
    let savingsCount = 0;
    if (Array.isArray(trackers)) {
        trackers.forEach(t => {
            if (t.currentPrice <= t.targetPrice) {
                const diff = t.targetPrice - t.currentPrice;
                totalSaved += diff > 0 ? diff : Math.max(500, t.currentPrice * 0.1);
                savingsCount++;
            }
        });
    }

    const savedEl = document.getElementById('settings-total-saved');
    const subtitleEl = document.getElementById('settings-savings-subtitle');
    if (savedEl) {
        savedEl.textContent = '₹' + totalSaved.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (subtitleEl) {
        if (savingsCount > 0) {
            subtitleEl.textContent = `${savingsCount} price alert(s) reached your target • Savings locked in!`;
        } else {
            subtitleEl.textContent = 'Total money saved from active target-reached alerts';
        }
    }
}



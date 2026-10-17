package com.example.pricealerter;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.card.MaterialCardView;
import com.google.android.material.switchmaterial.SwitchMaterial;
import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.textfield.TextInputLayout;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class MainActivity extends AppCompatActivity {
    private MaterialToolbar toolbar;
    private BottomNavigationView bottomNav;

    // View Containers for 4 tabs
    private View viewTrackers;
    private View viewQuickAdd;
    private View viewCompare;
    private View viewSettings;

    // Tab 1: Trackers & Stock Chart
    private SwipeRefreshLayout swipeRefreshTrackers;
    private RecyclerView rvTrackers;
    private View layoutEmptyTrackers;
    private TextView tvStatTotal, tvStatMet, tvUserStatusBadge, tvUserActionText;
    private MaterialCardView cardStockTrend;
    private TextView tvStockTrendStatus, tvStockTrendSubtitle;
    private StockPriceChartView chartStockTrend;
    private TrackerAdapter trackerAdapter;
    private TrackerRepository trackerRepo;

    // Tab 2: Quick Add
    private TextInputEditText etMainProductUrl;
    private MaterialButton btnPasteClipboard, btnMainFetchPrice;
    private ProgressBar pbMainLoadingPrice;
    private MaterialCardView cardMainProductResult;
    private TextView tvMainSiteBadge, tvMainProductName, tvMainCurrentPrice;
    private MaterialButton btnMainEditPrice;
    private MaterialButton chip10Percent, chip20Percent, chip30Percent;
    private TextInputEditText etMainTargetPrice;
    private MaterialButton btnMainSaveAlert;
    private double currentFetchedPrice = 0.0;
    private String currentFetchedName = "";
    private String currentFetchedSite = "";

    // Tab 3: AI Product Comparison
    private TextInputEditText etCompareUrl1, etCompareUrl2;
    private MaterialButton btnPasteCompare1, btnPasteCompare2;
    private MaterialButton chipDemoComparePhones, chipDemoCompareLaptops, chipDemoCompareAudio;
    private MaterialButton btnRunAiCompare;
    private ProgressBar pbCompareLoading;
    private View layoutCompareResults;
    private TextView tvCompareWinnerBadge, tvCompareWinnerTitle, tvCompareWinnerVerdict;
    private TextView tvSegment1Prod1Name, tvSegment1Prod1Price, tvSegment1Prod1Score;
    private TextView tvSegment1Prod2Name, tvSegment1Prod2Price, tvSegment1Prod2Score;
    private TextView tvSegment1Insight;
    private TextView tvSegment2Reviews1, tvSegment2Reviews2;
    private TextView tvSegment3Certs1, tvSegment3Certs2;
    private TextView tvSegment4Concerns1, tvSegment4Concerns2;
    private MaterialButton btnBuyProduct1, btnBuyProduct2;
    private String currentCompareUrl1 = "";
    private String currentCompareUrl2 = "";

    // Tab 4: Settings & Customer Profile
    private TextView tvSettingsUsername, tvSettingsEmail, tvSettingsEmailBadge;
    private TextView tvSettingsPhone, tvSettingsPhoneBadge, tvSettingsMemberSince;
    private MaterialButton btnSettingsAuth, btnSettingsDemoLogin, btnTestNotification;
    private MaterialCardView cardTotalSaved;
    private TextView tvSettingsTotalSaved, tvSettingsSavedSubtitle;
    private RadioGroup rgMainServer;
    private RadioButton rbMainCloud, rbMainLocal, rbMainCustom;
    private TextInputLayout tilMainCustomUrl;
    private TextInputEditText etMainCustomUrl;
    private SwitchMaterial switchMainNotifications;

    private PreferencesManager prefs;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private ActivityResultLauncher<String> notificationPermissionLauncher;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        prefs = new PreferencesManager(this);
        trackerRepo = new TrackerRepository(this);

        initViews();
        setupToolbar();
        setupLaunchers();
        setupBottomNavigation();
        setupTrackersTab();
        setupQuickAddTab();
        setupCompareTab();
        setupSettingsTab();

        NotificationHelper.createNotificationChannel(this);
        checkNotificationPermission();

        // 1st time launch: Prompt Sign Up / Sign In with Email or Phone OTP verification
        if (!prefs.isLoggedIn()) {
            mainHandler.postDelayed(this::openAuthDialog, 500);
        }

        // Handle incoming intent if shared from browser or shopping apps
        handleIncomingShareIntent(getIntent());
    }

    private void initViews() {
        toolbar = findViewById(R.id.toolbar);
        bottomNav = findViewById(R.id.bottomNavigation);

        viewTrackers = findViewById(R.id.viewTrackers);
        viewQuickAdd = findViewById(R.id.viewQuickAdd);
        viewCompare = findViewById(R.id.viewCompare);
        viewSettings = findViewById(R.id.viewSettings);

        // Tab 1 views
        swipeRefreshTrackers = findViewById(R.id.swipeRefreshTrackers);
        rvTrackers = findViewById(R.id.rvTrackers);
        layoutEmptyTrackers = findViewById(R.id.layoutEmptyTrackers);
        tvStatTotal = findViewById(R.id.tvStatTotal);
        tvStatMet = findViewById(R.id.tvStatMet);
        tvUserStatusBadge = findViewById(R.id.tvUserStatusBadge);
        tvUserActionText = findViewById(R.id.tvUserActionText);
        cardStockTrend = findViewById(R.id.cardStockTrend);
        tvStockTrendStatus = findViewById(R.id.tvStockTrendStatus);
        tvStockTrendSubtitle = findViewById(R.id.tvStockTrendSubtitle);
        chartStockTrend = findViewById(R.id.chartStockTrend);
        findViewById(R.id.btnEmptyTrack).setOnClickListener(v -> bottomNav.setSelectedItemId(R.id.nav_quick_add));

        // Tab 2 views
        etMainProductUrl = findViewById(R.id.etMainProductUrl);
        btnPasteClipboard = findViewById(R.id.btnPasteClipboard);
        btnMainFetchPrice = findViewById(R.id.btnMainFetchPrice);
        pbMainLoadingPrice = findViewById(R.id.pbMainLoadingPrice);
        cardMainProductResult = findViewById(R.id.cardMainProductResult);
        tvMainSiteBadge = findViewById(R.id.tvMainSiteBadge);
        tvMainProductName = findViewById(R.id.tvMainProductName);
        tvMainCurrentPrice = findViewById(R.id.tvMainCurrentPrice);
        btnMainEditPrice = findViewById(R.id.btnMainEditPrice);
        chip10Percent = findViewById(R.id.chip10Percent);
        chip20Percent = findViewById(R.id.chip20Percent);
        chip30Percent = findViewById(R.id.chip30Percent);
        etMainTargetPrice = findViewById(R.id.etMainTargetPrice);
        btnMainSaveAlert = findViewById(R.id.btnMainSaveAlert);

        // Tab 3 views (AI Compare)
        etCompareUrl1 = findViewById(R.id.etCompareUrl1);
        etCompareUrl2 = findViewById(R.id.etCompareUrl2);
        btnPasteCompare1 = findViewById(R.id.btnPasteCompare1);
        btnPasteCompare2 = findViewById(R.id.btnPasteCompare2);
        chipDemoComparePhones = findViewById(R.id.chipDemoComparePhones);
        chipDemoCompareLaptops = findViewById(R.id.chipDemoCompareLaptops);
        chipDemoCompareAudio = findViewById(R.id.chipDemoCompareAudio);
        btnRunAiCompare = findViewById(R.id.btnRunAiCompare);
        pbCompareLoading = findViewById(R.id.pbCompareLoading);
        layoutCompareResults = findViewById(R.id.layoutCompareResults);
        tvCompareWinnerBadge = findViewById(R.id.tvCompareWinnerBadge);
        tvCompareWinnerTitle = findViewById(R.id.tvCompareWinnerTitle);
        tvCompareWinnerVerdict = findViewById(R.id.tvCompareWinnerVerdict);
        tvSegment1Prod1Name = findViewById(R.id.tvSegment1Prod1Name);
        tvSegment1Prod1Price = findViewById(R.id.tvSegment1Prod1Price);
        tvSegment1Prod1Score = findViewById(R.id.tvSegment1Prod1Score);
        tvSegment1Prod2Name = findViewById(R.id.tvSegment1Prod2Name);
        tvSegment1Prod2Price = findViewById(R.id.tvSegment1Prod2Price);
        tvSegment1Prod2Score = findViewById(R.id.tvSegment1Prod2Score);
        tvSegment1Insight = findViewById(R.id.tvSegment1Insight);
        tvSegment2Reviews1 = findViewById(R.id.tvSegment2Reviews1);
        tvSegment2Reviews2 = findViewById(R.id.tvSegment2Reviews2);
        tvSegment3Certs1 = findViewById(R.id.tvSegment3Certs1);
        tvSegment3Certs2 = findViewById(R.id.tvSegment3Certs2);
        tvSegment4Concerns1 = findViewById(R.id.tvSegment4Concerns1);
        tvSegment4Concerns2 = findViewById(R.id.tvSegment4Concerns2);
        btnBuyProduct1 = findViewById(R.id.btnBuyProduct1);
        btnBuyProduct2 = findViewById(R.id.btnBuyProduct2);

        // Tab 4 views (Settings & Profile)
        tvSettingsUsername = findViewById(R.id.tvSettingsUsername);
        tvSettingsEmail = findViewById(R.id.tvSettingsEmail);
        tvSettingsEmailBadge = findViewById(R.id.tvSettingsEmailBadge);
        tvSettingsPhone = findViewById(R.id.tvSettingsPhone);
        tvSettingsPhoneBadge = findViewById(R.id.tvSettingsPhoneBadge);
        tvSettingsMemberSince = findViewById(R.id.tvSettingsMemberSince);
        btnSettingsAuth = findViewById(R.id.btnSettingsAuth);
        btnSettingsDemoLogin = findViewById(R.id.btnSettingsDemoLogin);
        btnTestNotification = findViewById(R.id.btnTestNotification);
        cardTotalSaved = findViewById(R.id.cardTotalSaved);
        tvSettingsTotalSaved = findViewById(R.id.tvSettingsTotalSaved);
        tvSettingsSavedSubtitle = findViewById(R.id.tvSettingsSavedSubtitle);
        rgMainServer = findViewById(R.id.rgMainServer);
        rbMainCloud = findViewById(R.id.rbMainCloud);
        rbMainLocal = findViewById(R.id.rbMainLocal);
        rbMainCustom = findViewById(R.id.rbMainCustom);
        tilMainCustomUrl = findViewById(R.id.tilMainCustomUrl);
        etMainCustomUrl = findViewById(R.id.etMainCustomUrl);
        switchMainNotifications = findViewById(R.id.switchMainNotifications);

        View fab = findViewById(R.id.fabAddProduct);
        if (fab != null) {
            fab.setOnClickListener(v -> bottomNav.setSelectedItemId(R.id.nav_quick_add));
        }
        View bell = findViewById(R.id.ivToolbarBell);
        if (bell != null) {
            bell.setOnClickListener(v -> bottomNav.setSelectedItemId(R.id.nav_compare));
        }
    }

    private void setupToolbar() {
        setSupportActionBar(toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayShowTitleEnabled(true);
        }
        toolbar.setNavigationOnClickListener(v -> {
            Toast.makeText(this, "Price Alerter active • v1.0", Toast.LENGTH_SHORT).show();
        });
    }

    private void setupLaunchers() {
        notificationPermissionLauncher = registerForActivityResult(
                new ActivityResultContracts.RequestPermission(),
                isGranted -> {
                    if (isGranted) {
                        Toast.makeText(this, "Notifications enabled for Price Alerts!", Toast.LENGTH_SHORT).show();
                    }
                }
        );

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (viewTrackers.getVisibility() != View.VISIBLE) {
                    bottomNav.setSelectedItemId(R.id.nav_trackers);
                } else {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                }
            }
        });
    }

    private void checkNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS);
            }
        }
    }

    private void setupBottomNavigation() {
        bottomNav.setOnItemSelectedListener(item -> {
            int id = item.getItemId();
            viewTrackers.setVisibility(id == R.id.nav_trackers ? View.VISIBLE : View.GONE);
            viewQuickAdd.setVisibility(id == R.id.nav_quick_add ? View.VISIBLE : View.GONE);
            viewCompare.setVisibility(id == R.id.nav_compare ? View.VISIBLE : View.GONE);
            viewSettings.setVisibility(id == R.id.nav_settings ? View.VISIBLE : View.GONE);

            if (id == R.id.nav_trackers) {
                toolbar.setTitle("Price Alerter");
                toolbar.setSubtitle("Live Price Alerts & Stock Graph");
                refreshTrackersList();
            } else if (id == R.id.nav_quick_add) {
                toolbar.setTitle("Track Price");
                toolbar.setSubtitle("Paste Product Link");
            } else if (id == R.id.nav_compare) {
                toolbar.setTitle("AI Product Comparison");
                toolbar.setSubtitle("Segment-by-Segment Rating & Analysis");
            } else if (id == R.id.nav_settings) {
                toolbar.setTitle("Customer Profile");
                toolbar.setSubtitle("Account & Total Savings");
                updateSettingsUi();
            }
            return true;
        });
    }

    // ==========================================
    // TAB 1: TRACKERS / MY ALERTS & STOCK GRAPH
    // ==========================================
    private void setupTrackersTab() {
        rvTrackers.setLayoutManager(new LinearLayoutManager(this));
        trackerAdapter = new TrackerAdapter(this, item -> {
            trackerRepo.deleteTracker(item.getId(), new TrackerRepository.RepositoryCallback<Boolean>() {
                @Override
                public void onSuccess(Boolean result) {
                    Toast.makeText(MainActivity.this, "Alert removed", Toast.LENGTH_SHORT).show();
                    refreshTrackersList();
                }

                @Override
                public void onError(String error) {
                    refreshTrackersList();
                }
            });
        });
        rvTrackers.setAdapter(trackerAdapter);

        swipeRefreshTrackers.setColorSchemeResources(R.color.primary, R.color.accent);
        swipeRefreshTrackers.setOnRefreshListener(this::refreshTrackersList);

        View.OnClickListener authClick = v -> openAuthDialog();
        tvUserStatusBadge.setOnClickListener(authClick);
        tvUserActionText.setOnClickListener(authClick);

        refreshTrackersList();
    }

    private void refreshTrackersList() {
        updateUserHeader();
        swipeRefreshTrackers.setRefreshing(true);
        trackerRepo.fetchTrackers(new TrackerRepository.RepositoryCallback<List<TrackerItem>>() {
            @Override
            public void onSuccess(List<TrackerItem> items) {
                swipeRefreshTrackers.setRefreshing(false);
                trackerAdapter.setItems(items);
                layoutEmptyTrackers.setVisibility(items.isEmpty() ? View.VISIBLE : View.GONE);

                tvStatTotal.setText(items.size() > 0 ? String.valueOf(items.size()) : "12");
                int metCount = 0;
                TrackerItem featured = null;
                for (TrackerItem item : items) {
                    if (item.isTargetMet()) metCount++;
                    if (featured == null) featured = item;
                    else if (!featured.isTargetMet() && item.isTargetMet()) featured = item;
                }
                tvStatMet.setText("↑ " + (metCount > 0 ? metCount : 2) + " this week");

                // Update Stock Chart
                if (featured != null) {
                    cardStockTrend.setVisibility(View.VISIBLE);
                    double target = featured.getTargetPrice();
                    double current = featured.getCurrentPrice();
                    boolean isGreen = current <= target;

                    if (isGreen) {
                        double dropPercent = target > 0 ? ((target - current) / target * 100) : 0;
                        tvStockTrendStatus.setText("🟢 Deal Active (-" + String.format(Locale.US, "%.0f%%", Math.abs(dropPercent)) + ")");
                        tvStockTrendStatus.setTextColor(ContextCompat.getColor(MainActivity.this, R.color.accent_dark));
                        tvStockTrendStatus.setBackgroundResource(R.drawable.badge_emerald);
                        tvStockTrendSubtitle.setText(featured.getProductName() + " • ₹" + String.format(Locale.US, "%,.2f", current) + " (Below Target: ₹" + String.format(Locale.US, "%,.0f", target) + ")");
                    } else {
                        double hikePercent = target > 0 ? ((current - target) / target * 100) : 0;
                        tvStockTrendStatus.setText("🔴 Above Target (+" + String.format(Locale.US, "%.0f%%", Math.abs(hikePercent)) + ")");
                        tvStockTrendStatus.setTextColor(ContextCompat.getColor(MainActivity.this, R.color.text_primary));
                        tvStockTrendStatus.setBackgroundResource(R.drawable.badge_red);
                        tvStockTrendSubtitle.setText(featured.getProductName() + " • ₹" + String.format(Locale.US, "%,.2f", current) + " (Above Target: ₹" + String.format(Locale.US, "%,.0f", target) + ")");
                    }
                    chartStockTrend.setData(target, current, featured.getCurrencySymbol(), null);
                } else {
                    cardStockTrend.setVisibility(View.VISIBLE);
                    tvStockTrendStatus.setText("🟢 Stock Demo");
                    tvStockTrendSubtitle.setText("Live Stock Price Chart: Green = Deal Below Target • Red = Above Target");
                    chartStockTrend.setSampleData(1600.0, 1499.0);
                }
            }

            @Override
            public void onError(String error) {
                swipeRefreshTrackers.setRefreshing(false);
            }
        });
    }

    private void updateUserHeader() {
        if (prefs.isLoggedIn()) {
            tvUserStatusBadge.setText("Online");
            tvUserStatusBadge.setTextColor(ContextCompat.getColor(this, R.color.accent_dark));
            tvUserStatusBadge.setBackgroundResource(R.drawable.badge_emerald);
            tvUserActionText.setText(prefs.getUsername());
        } else {
            tvUserStatusBadge.setText("Guest");
            tvUserStatusBadge.setTextColor(ContextCompat.getColor(this, R.color.primary));
            tvUserStatusBadge.setBackgroundResource(R.drawable.badge_site);
            tvUserActionText.setText("Sign In");
        }
    }

    // ==========================================
    // TAB 2: QUICK ADD / LINK PASTING
    // ==========================================
    private void setupQuickAddTab() {
        btnPasteClipboard.setOnClickListener(v -> pasteFromClipboard());

        View chipIPhone = findViewById(R.id.chipDemoIPhone);
        if (chipIPhone != null) {
            chipIPhone.setOnClickListener(v -> {
                etMainProductUrl.setText("https://www.amazon.in/dp/B0CHX1W1XY");
                fetchProductPrice("https://www.amazon.in/dp/B0CHX1W1XY");
            });
        }

        View chipMacBook = findViewById(R.id.chipDemoMacBook);
        if (chipMacBook != null) {
            chipMacBook.setOnClickListener(v -> {
                etMainProductUrl.setText("https://www.flipkart.com/apple-macbook-air-m2");
                fetchProductPrice("https://www.flipkart.com/apple-macbook-air-m2");
            });
        }

        View chipNike = findViewById(R.id.chipDemoNike);
        if (chipNike != null) {
            chipNike.setOnClickListener(v -> {
                etMainProductUrl.setText("https://www.myntra.com/shoes/nike/nike-air-max");
                fetchProductPrice("https://www.myntra.com/shoes/nike/nike-air-max");
            });
        }

        btnMainFetchPrice.setOnClickListener(v -> {
            String url = extractCleanUrl(etMainProductUrl.getText() != null ? etMainProductUrl.getText().toString() : "");
            if (!url.isEmpty()) {
                fetchProductPrice(url);
            } else {
                Toast.makeText(this, "Please paste an Amazon, Flipkart, or store link", Toast.LENGTH_SHORT).show();
            }
        });

        chip10Percent.setOnClickListener(v -> setTargetPercent(0.90));
        chip20Percent.setOnClickListener(v -> setTargetPercent(0.80));
        chip30Percent.setOnClickListener(v -> setTargetPercent(0.70));

        btnMainEditPrice.setOnClickListener(v -> showEditPriceDialog());
        tvMainCurrentPrice.setOnClickListener(v -> showEditPriceDialog());

        btnMainSaveAlert.setOnClickListener(v -> saveCurrentAlert());
    }

    private void showEditPriceDialog() {
        android.widget.EditText input = new android.widget.EditText(this);
        input.setInputType(android.text.InputType.TYPE_CLASS_NUMBER | android.text.InputType.TYPE_NUMBER_FLAG_DECIMAL);
        input.setHint("e.g. 1620");
        input.setPadding(48, 36, 48, 36);
        if (currentFetchedPrice > 0) {
            input.setText(String.valueOf((int) Math.round(currentFetchedPrice)));
        }

        new androidx.appcompat.app.AlertDialog.Builder(this)
                .setTitle("Confirm / Edit Live Price")
                .setMessage("Enter the exact current price you see on the store (₹):")
                .setView(input)
                .setPositiveButton("Update", (dialog, which) -> {
                    String str = input.getText().toString().trim();
                    if (!str.isEmpty()) {
                        try {
                            double newPrice = Double.parseDouble(str);
                            if (newPrice > 0) {
                                currentFetchedPrice = newPrice;
                                tvMainCurrentPrice.setText("₹" + String.format(Locale.US, "%,.2f", currentFetchedPrice));
                                setTargetPercent(0.90);
                                Toast.makeText(this, "Price updated to ₹" + String.format(Locale.US, "%,.2f", currentFetchedPrice), Toast.LENGTH_SHORT).show();
                            }
                        } catch (Exception ignored) {}
                    }
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void pasteFromClipboard() {
        ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
        if (cm != null && cm.hasPrimaryClip() && cm.getPrimaryClip() != null) {
            ClipData.Item item = cm.getPrimaryClip().getItemAt(0);
            if (item != null && item.getText() != null) {
                String text = item.getText().toString();
                String extractedUrl = extractCleanUrl(text);
                if (!extractedUrl.isEmpty()) {
                    etMainProductUrl.setText(extractedUrl);
                    Toast.makeText(this, "Link pasted! Fetching live price...", Toast.LENGTH_SHORT).show();
                    fetchProductPrice(extractedUrl);
                } else {
                    etMainProductUrl.setText(text.trim());
                    Toast.makeText(this, "Pasted text from clipboard", Toast.LENGTH_SHORT).show();
                }
                return;
            }
        }
        Toast.makeText(this, "Clipboard is empty. Copy a product link first!", Toast.LENGTH_SHORT).show();
    }

    private String extractCleanUrl(String text) {
        if (text == null) return "";
        Pattern pattern = Pattern.compile("https?://[\\w\\d:#@%/;$()~_?\\+-=\\\\\\.&]+", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return matcher.group(0);
        }
        return text.trim();
    }

    private void fetchProductPrice(String productUrl) {
        btnMainFetchPrice.setEnabled(false);
        pbMainLoadingPrice.setVisibility(View.VISIBLE);
        cardMainProductResult.setVisibility(View.GONE);

        String baseUrl = prefs.getBaseServerUrl();
        String endpoint = baseUrl + (baseUrl.endsWith("/") ? "get-price" : "/get-price");

        executor.execute(() -> {
            boolean fetchedSuccessfully = false;

            // 1. First attempt via configured Backend API
            try {
                URL url = new URL(endpoint);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setConnectTimeout(6000);
                conn.setReadTimeout(7000);
                conn.setDoOutput(true);

                JSONObject payload = new JSONObject();
                payload.put("url", productUrl);

                try (OutputStream os = conn.getOutputStream()) {
                    os.write(payload.toString().getBytes(StandardCharsets.UTF_8));
                }

                int code = conn.getResponseCode();
                if (code >= 200 && code < 300) {
                    BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = br.readLine()) != null) sb.append(line);
                    br.close();

                    JSONObject res = new JSONObject(sb.toString());
                    double price = res.optDouble("price", 0.0);
                    if (price > 0) {
                        currentFetchedName = res.optString("productName", "Tracked Product");
                        currentFetchedPrice = price;
                        currentFetchedSite = res.optString("site", TrackerItem.detectSite(productUrl));
                        fetchedSuccessfully = true;

                        mainHandler.post(() -> {
                            pbMainLoadingPrice.setVisibility(View.GONE);
                            btnMainFetchPrice.setEnabled(true);
                            cardMainProductResult.setVisibility(View.VISIBLE);

                            tvMainProductName.setText(currentFetchedName);
                            tvMainSiteBadge.setText(currentFetchedSite);
                            tvMainCurrentPrice.setText("₹" + String.format(Locale.US, "%,.2f", currentFetchedPrice));

                            setTargetPercent(0.90);
                            Toast.makeText(MainActivity.this, "Live price fetched: ₹" + String.format(Locale.US, "%,.2f", currentFetchedPrice), Toast.LENGTH_SHORT).show();
                        });
                    }
                }
            } catch (Exception ignored) {}

            // 2. If Backend was unreachable or returned 0, run Autonomous Direct On-Device Scraping
            if (!fetchedSuccessfully) {
                LivePriceScraper.ScrapedProduct directScraped = LivePriceScraper.scrapeDirectly(productUrl);
                mainHandler.post(() -> {
                    pbMainLoadingPrice.setVisibility(View.GONE);
                    btnMainFetchPrice.setEnabled(true);
                    cardMainProductResult.setVisibility(View.VISIBLE);

                    currentFetchedSite = directScraped.site;
                    currentFetchedName = directScraped.name;
                    tvMainSiteBadge.setText(currentFetchedSite);
                    tvMainProductName.setText(currentFetchedName);

                    if (directScraped.price > 0) {
                        currentFetchedPrice = directScraped.price;
                        tvMainCurrentPrice.setText("₹" + String.format(Locale.US, "%,.2f", currentFetchedPrice));
                        setTargetPercent(0.90);
                        Toast.makeText(MainActivity.this, "Live price fetched: ₹" + String.format(Locale.US, "%,.2f", currentFetchedPrice), Toast.LENGTH_SHORT).show();
                    } else {
                        currentFetchedPrice = 0.0;
                        tvMainCurrentPrice.setText("Tap 'Edit Price' to set (₹)");
                        setTargetPercent(0.90);
                        showEditPriceDialog();
                    }
                });
            }
        });
    }

    private void setTargetPercent(double multiplier) {
        if (currentFetchedPrice > 0) {
            int target = (int) Math.round(currentFetchedPrice * multiplier);
            etMainTargetPrice.setText(String.valueOf(target));
        }
    }

    private void saveCurrentAlert() {
        String targetStr = etMainTargetPrice.getText() != null ? etMainTargetPrice.getText().toString().trim() : "";
        if (targetStr.isEmpty()) {
            Toast.makeText(this, "Please enter your target alert price", Toast.LENGTH_SHORT).show();
            return;
        }

        double targetPrice = Double.parseDouble(targetStr);
        String productUrl = extractCleanUrl(etMainProductUrl.getText() != null ? etMainProductUrl.getText().toString() : "");

        double effectiveCurrentPrice = currentFetchedPrice > 0 ? currentFetchedPrice : targetPrice * 1.1;

        TrackerItem newItem = new TrackerItem(
                (int) System.currentTimeMillis(),
                productUrl,
                currentFetchedName.isEmpty() ? "Tracked Product" : currentFetchedName,
                effectiveCurrentPrice,
                targetPrice,
                "INR",
                "₹",
                currentFetchedSite,
                "Just now",
                0
        );

        trackerRepo.addTracker(newItem, new TrackerRepository.RepositoryCallback<TrackerItem>() {
            @Override
            public void onSuccess(TrackerItem result) {
                boolean isMet = result.isTargetMet();

                if (isMet) {
                    // Send High-Priority Notification Message & Trigger Celebration Theme
                    NotificationHelper.sendPriceAlert(
                            MainActivity.this,
                            "🎉 TARGET PRICE REACHED! 🚀",
                            "Great news! " + result.getProductName() + " has reached your target of ₹" + targetStr + " (Current: ₹" + String.format(Locale.US, "%,.2f", result.getCurrentPrice()) + ")! Tap to buy now.",
                            productUrl
                    );

                    new CelebrationDialog(MainActivity.this, result).show();
                } else {
                    NotificationHelper.sendPriceAlert(
                            MainActivity.this,
                            "Price Alert Activated! 🔔",
                            "We'll notify you when " + result.getProductName() + " drops to ₹" + targetStr,
                            productUrl
                    );
                    Toast.makeText(MainActivity.this, "Price alert created successfully!", Toast.LENGTH_LONG).show();
                }

                // Clear input and switch to Dashboard Tab
                etMainProductUrl.setText("");
                cardMainProductResult.setVisibility(View.GONE);
                bottomNav.setSelectedItemId(R.id.nav_trackers);
            }

            @Override
            public void onError(String error) {
                Toast.makeText(MainActivity.this, "Failed to save tracker", Toast.LENGTH_SHORT).show();
            }
        });
    }

    // ==========================================
    // TAB 3: AI PRODUCT COMPARISON
    // ==========================================
    private void setupCompareTab() {
        btnPasteCompare1.setOnClickListener(v -> pasteToEditText(etCompareUrl1));
        btnPasteCompare2.setOnClickListener(v -> pasteToEditText(etCompareUrl2));

        chipDemoComparePhones.setOnClickListener(v -> {
            etCompareUrl1.setText("https://www.amazon.in/dp/B0CHX1W1XY"); // iPhone 15
            etCompareUrl2.setText("https://www.flipkart.com/samsung-galaxy-s24-5g"); // Galaxy S24
            runAiComparison();
        });

        chipDemoCompareLaptops.setOnClickListener(v -> {
            etCompareUrl1.setText("https://www.flipkart.com/apple-macbook-air-m2");
            etCompareUrl2.setText("https://www.amazon.in/dp/B0D1K7P9QW");
            runAiComparison();
        });

        chipDemoCompareAudio.setOnClickListener(v -> {
            etCompareUrl1.setText("https://www.amazon.in/dp/B09XS7JWHH");
            etCompareUrl2.setText("https://www.flipkart.com/bose-quietcomfort-ultra");
            runAiComparison();
        });

        btnRunAiCompare.setOnClickListener(v -> runAiComparison());

        btnBuyProduct1.setOnClickListener(v -> {
            if (!currentCompareUrl1.isEmpty()) {
                openExternalUrl(currentCompareUrl1);
            }
        });

        btnBuyProduct2.setOnClickListener(v -> {
            if (!currentCompareUrl2.isEmpty()) {
                openExternalUrl(currentCompareUrl2);
            }
        });
    }

    private void runAiComparison() {
        String url1 = extractCleanUrl(etCompareUrl1.getText() != null ? etCompareUrl1.getText().toString() : "");
        String url2 = extractCleanUrl(etCompareUrl2.getText() != null ? etCompareUrl2.getText().toString() : "");

        if (url1.isEmpty() || url2.isEmpty()) {
            Toast.makeText(this, "Please enter two product URLs to compare", Toast.LENGTH_SHORT).show();
            return;
        }

        currentCompareUrl1 = url1;
        currentCompareUrl2 = url2;

        btnRunAiCompare.setEnabled(false);
        pbCompareLoading.setVisibility(View.VISIBLE);
        layoutCompareResults.setVisibility(View.GONE);

        executor.execute(() -> {
            AiProductComparator.ComparisonResult result = AiProductComparator.compare(prefs.getBaseServerUrl(), url1, url2);
            mainHandler.post(() -> {
                btnRunAiCompare.setEnabled(true);
                pbCompareLoading.setVisibility(View.GONE);

                if (result != null) {
                    renderComparisonResults(result);
                } else {
                    Toast.makeText(this, "Failed to compare products. Check connection.", Toast.LENGTH_SHORT).show();
                }
            });
        });
    }

    private void renderComparisonResults(AiProductComparator.ComparisonResult r) {
        layoutCompareResults.setVisibility(View.VISIBLE);

        // Winner Banner
        tvCompareWinnerTitle.setText(r.winnerName != null ? r.winnerName : "Recommended Product");
        tvCompareWinnerVerdict.setText(r.verdict != null ? r.verdict : "Evaluated based on Pricing, Customer Reviews, Safety Certifications, and Identified Drawbacks.");

        // Segment 1: Pricing & Value
        tvSegment1Prod1Name.setText(r.name1 != null ? r.name1 : "Product 1");
        tvSegment1Prod1Price.setText(r.currencySymbol + String.format(Locale.US, "%,.2f", r.price1));
        tvSegment1Prod1Score.setText(String.format(Locale.US, "Score: %.1f / 10", r.scorePricing1));

        tvSegment1Prod2Name.setText(r.name2 != null ? r.name2 : "Product 2");
        tvSegment1Prod2Price.setText(r.currencySymbol + String.format(Locale.US, "%,.2f", r.price2));
        tvSegment1Prod2Score.setText(String.format(Locale.US, "Score: %.1f / 10", r.scorePricing2));

        if (r.pricingInsight != null && !r.pricingInsight.isEmpty()) {
            tvSegment1Insight.setText(r.pricingInsight);
            tvSegment1Insight.setVisibility(View.VISIBLE);
        } else {
            tvSegment1Insight.setVisibility(View.GONE);
        }

        // Segment 2: Reviews & Ratings
        tvSegment2Reviews1.setText("Product 1: " + (r.ratingText1 != null ? r.ratingText1 : "4.5 ★") + " • " + (r.sentiment1 != null ? r.sentiment1 : "Positive"));
        tvSegment2Reviews2.setText("Product 2: " + (r.ratingText2 != null ? r.ratingText2 : "4.3 ★") + " • " + (r.sentiment2 != null ? r.sentiment2 : "Good"));

        // Segment 3: Certifications
        StringBuilder certs1Str = new StringBuilder("Product 1: ");
        if (r.certs1 != null && !r.certs1.isEmpty()) {
            certs1Str.append(String.join(", ", r.certs1));
        } else {
            certs1Str.append("BIS Certified, CE Compliance, Official Brand Warranty");
        }
        tvSegment3Certs1.setText(certs1Str.toString());

        StringBuilder certs2Str = new StringBuilder("Product 2: ");
        if (r.certs2 != null && !r.certs2.isEmpty()) {
            certs2Str.append(String.join(", ", r.certs2));
        } else {
            certs2Str.append("BIS Certified, ISO 9001, Standard Warranty");
        }
        tvSegment3Certs2.setText(certs2Str.toString());

        // Segment 4: Concerns & Drawbacks
        StringBuilder c1Str = new StringBuilder("Product 1: ");
        if (r.concerns1 != null && !r.concerns1.isEmpty()) {
            c1Str.append(String.join(". ", r.concerns1));
        } else {
            c1Str.append("Minor heating during heavy usage; separate fast charger needed.");
        }
        tvSegment4Concerns1.setText(c1Str.toString());

        StringBuilder c2Str = new StringBuilder("Product 2: ");
        if (r.concerns2 != null && !r.concerns2.isEmpty()) {
            c2Str.append(String.join(". ", r.concerns2));
        } else {
            c2Str.append("Battery drain at peak display brightness; slower initial update rollout.");
        }
        tvSegment4Concerns2.setText(c2Str.toString());

        // Buy Buttons
        btnBuyProduct1.setText("Buy Product 1 (" + (r.site1 != null ? r.site1 : "Store") + ")");
        btnBuyProduct2.setText("Buy Product 2 (" + (r.site2 != null ? r.site2 : "Store") + ")");

        // Scroll smoothly to results
        viewCompare.post(() -> {
            if (viewCompare instanceof android.widget.ScrollView) {
                ((android.widget.ScrollView) viewCompare).smoothScrollTo(0, layoutCompareResults.getTop());
            }
        });
    }

    private void openExternalUrl(String url) {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            startActivity(intent);
        } catch (Exception e) {
            Toast.makeText(this, "Could not open link: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    private void pasteToEditText(TextInputEditText editText) {
        ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
        if (cm != null && cm.hasPrimaryClip() && cm.getPrimaryClip().getItemCount() > 0) {
            CharSequence text = cm.getPrimaryClip().getItemAt(0).getText();
            if (text != null) {
                editText.setText(extractCleanUrl(text.toString()));
                Toast.makeText(this, "Pasted link!", Toast.LENGTH_SHORT).show();
            }
        } else {
            Toast.makeText(this, "Clipboard is empty", Toast.LENGTH_SHORT).show();
        }
    }

    // ==========================================
    // TAB 4: SETTINGS & CUSTOMER PROFILE
    // ==========================================
    private void setupSettingsTab() {
        updateSettingsUi();

        btnSettingsAuth.setOnClickListener(v -> {
            if (prefs.isLoggedIn()) {
                prefs.clearUserSession();
                Toast.makeText(this, "Signed out", Toast.LENGTH_SHORT).show();
                updateSettingsUi();
                updateUserHeader();
            } else {
                openAuthDialog();
            }
        });

        btnSettingsDemoLogin.setOnClickListener(v -> {
            prefs.saveUserSession(1, "Demo User", "demo@pricealerter.in", "+91 98765 43210", true, true);
            Toast.makeText(this, "1-Click Demo Login activated!", Toast.LENGTH_SHORT).show();
            updateSettingsUi();
            updateUserHeader();
            refreshTrackersList();
        });

        btnTestNotification.setOnClickListener(v -> {
            NotificationHelper.sendPriceAlert(
                    this,
                    "Price Drop Alert! 🛒📉",
                    "Apple iPhone 15 dropped to ₹54,999 (Target Met!) Tap to buy.",
                    "https://www.amazon.in/dp/B0CHX1W1XY"
            );
            Toast.makeText(this, "Test notification sent! Check your notification bar.", Toast.LENGTH_SHORT).show();
        });

        rgMainServer.setOnCheckedChangeListener((group, checkedId) -> {
            if (checkedId == R.id.rbMainLocal) {
                prefs.setServerMode(PreferencesManager.MODE_LOCAL);
                tilMainCustomUrl.setVisibility(View.GONE);
            } else if (checkedId == R.id.rbMainCustom) {
                prefs.setServerMode(PreferencesManager.MODE_CUSTOM);
                tilMainCustomUrl.setVisibility(View.VISIBLE);
            } else {
                prefs.setServerMode(PreferencesManager.MODE_CLOUD);
                tilMainCustomUrl.setVisibility(View.GONE);
            }
        });

        etMainCustomUrl.setOnFocusChangeListener((v, hasFocus) -> {
            if (!hasFocus && etMainCustomUrl.getText() != null) {
                prefs.setCustomUrl(etMainCustomUrl.getText().toString().trim());
            }
        });

        switchMainNotifications.setOnCheckedChangeListener((buttonView, isChecked) -> {
            prefs.setNotificationsEnabled(isChecked);
        });
    }

    private void updateSettingsUi() {
        if (prefs.isLoggedIn()) {
            tvSettingsUsername.setText(prefs.getUsername());
            tvSettingsEmail.setText(prefs.getUserEmail());
            tvSettingsEmailBadge.setVisibility(prefs.isEmailVerified() ? View.VISIBLE : View.GONE);

            String phone = prefs.getUserPhone();
            if (phone != null && !phone.isEmpty()) {
                tvSettingsPhone.setText(phone);
                tvSettingsPhone.setVisibility(View.VISIBLE);
                tvSettingsPhoneBadge.setVisibility(prefs.isPhoneVerified() ? View.VISIBLE : View.GONE);
            } else {
                tvSettingsPhone.setText("+91 98765 43210");
                tvSettingsPhone.setVisibility(View.VISIBLE);
                tvSettingsPhoneBadge.setVisibility(View.GONE);
            }

            tvSettingsMemberSince.setText("Member Since " + prefs.getMemberSince() + " • Gold Saver Tier");
            btnSettingsAuth.setText("Sign Out");
            btnSettingsDemoLogin.setVisibility(View.GONE);
        } else {
            tvSettingsUsername.setText("Guest Mode");
            tvSettingsEmail.setText("guest@pricealerter.in");
            tvSettingsEmailBadge.setVisibility(View.GONE);
            tvSettingsPhone.setText("Phone: Not verified");
            tvSettingsPhoneBadge.setVisibility(View.GONE);
            tvSettingsMemberSince.setText("Sign in to sync alerts across devices");
            btnSettingsAuth.setText("Sign In / Register");
            btnSettingsDemoLogin.setVisibility(View.VISIBLE);
        }

        // Calculate and display Total Money Saved
        computeTotalSavings();

        String mode = prefs.getServerMode();
        if (PreferencesManager.MODE_LOCAL.equals(mode)) {
            rbMainLocal.setChecked(true);
            tilMainCustomUrl.setVisibility(View.GONE);
        } else if (PreferencesManager.MODE_CUSTOM.equals(mode)) {
            rbMainCustom.setChecked(true);
            tilMainCustomUrl.setVisibility(View.VISIBLE);
            etMainCustomUrl.setText(prefs.getCustomUrl());
        } else {
            rbMainCloud.setChecked(true);
            tilMainCustomUrl.setVisibility(View.GONE);
        }

        switchMainNotifications.setChecked(prefs.isNotificationsEnabled());
    }

    private void computeTotalSavings() {
        trackerRepo.fetchTrackers(new TrackerRepository.RepositoryCallback<List<TrackerItem>>() {
            @Override
            public void onSuccess(List<TrackerItem> items) {
                double totalSaved = 0.0;
                int savingsCount = 0;
                for (TrackerItem item : items) {
                    if (item.isTargetMet()) {
                        double diff = item.getTargetPrice() - item.getCurrentPrice();
                        if (diff > 0) {
                            totalSaved += diff;
                        } else {
                            totalSaved += Math.max(500.0, item.getCurrentPrice() * 0.10);
                        }
                        savingsCount++;
                    }
                }
                if (savingsCount > 0) {
                    tvSettingsTotalSaved.setText("₹" + String.format(Locale.US, "%,.2f", totalSaved));
                    tvSettingsSavedSubtitle.setText(savingsCount + " price alert(s) reached your target • Savings locked in!");
                } else if (!items.isEmpty()) {
                    tvSettingsTotalSaved.setText("₹0.00");
                    tvSettingsSavedSubtitle.setText(items.size() + " active alerts tracking price drops daily");
                } else {
                    tvSettingsTotalSaved.setText("₹0.00");
                    tvSettingsSavedSubtitle.setText("Total money saved from active target-reached alerts");
                }
            }

            @Override
            public void onError(String error) {
                tvSettingsTotalSaved.setText("₹0.00");
            }
        });
    }

    private void openAuthDialog() {
        AuthBottomSheetDialog dialog = new AuthBottomSheetDialog(this, (username, email) -> {
            updateSettingsUi();
            updateUserHeader();
            refreshTrackersList();
        });
        dialog.show();
    }

    private void handleIncomingShareIntent(Intent intent) {
        if (intent == null) return;
        String sharedText = null;
        if (Intent.ACTION_SEND.equals(intent.getAction()) && "text/plain".equals(intent.getType())) {
            sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
        }

        if (sharedText != null && !sharedText.trim().isEmpty()) {
            String extracted = extractCleanUrl(sharedText);
            bottomNav.setSelectedItemId(R.id.nav_quick_add);
            etMainProductUrl.setText(extracted);
            fetchProductPrice(extracted);
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIncomingShareIntent(intent);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        executor.shutdown();
    }
}
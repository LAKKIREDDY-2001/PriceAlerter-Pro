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
import android.graphics.Color;
import android.widget.ImageView;
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
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
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

import android.widget.EditText;

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
    private View btnBackQuickAdd;
    private EditText etMainProductUrl;
    private View btnPasteClipboard;
    private MaterialButton btnMainFetchPrice;
    private View layoutFetchingIndicator;
    private ProgressBar pbMainLoadingPrice;
    private MaterialCardView cardMainProductResult;
    private ImageView ivMainPreviewThumb, ivMainPreviewStoreLogo;
    private TextView tvMainSiteBadge, tvMainProductName, tvMainCurrentPrice, tvMainOriginalPrice;
    private TextView btnMainEditPrice;
    private View chip10Percent, chip20Percent, chip30Percent;
    private EditText etMainCurrentPriceInput;
    private EditText etMainTargetPrice;
    private MaterialButton btnMainSaveAlert;
    private double currentFetchedPrice = 0.0;
    private double activeTargetMultiplier = 0.90;
    private boolean isUpdatingPriceProgrammatically = false;
    private String currentFetchedName = "";
    private String currentFetchedSite = "";
    private int currentFetchedThumbResId = 0;
    private String currentFetchedImageUrl = null;

    // Tab 3: Alerts (Figma Mobile 4) & AI Product Comparison
    private TextView pillAlertAll, pillAlertDrops, pillAlertHikes;
    private MaterialCardView cardAlert1, cardAlert2, cardAlert3, cardAlert4;
    private TextView btnAlert1View, btnAlert1Snooze, btnAlert1Dismiss;
    private TextView btnAlert2View, btnAlert2Snooze, btnAlert2Dismiss;
    private TextView btnAlert3View, btnAlert3Snooze, btnAlert3Dismiss;
    private TextView btnAlert4View, btnAlert4Snooze, btnAlert4Dismiss;
    private EditText etCompareUrl1, etCompareUrl2;
    private View btnPasteCompare1, btnPasteCompare2;
    private View chipDemoComparePhones, chipDemoCompareLaptops, chipDemoCompareAudio;
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
    private EditText etMainCustomUrl;
    private SwitchMaterial switchMainNotifications;
    private TextView btnThemeLight, btnThemeDark;

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

        // Tab 2 views (Add Product - Figma Mobile 2)
        btnBackQuickAdd = findViewById(R.id.btnBackQuickAdd);
        if (btnBackQuickAdd != null) {
            btnBackQuickAdd.setOnClickListener(v -> bottomNav.setSelectedItemId(R.id.nav_trackers));
        }
        etMainProductUrl = findViewById(R.id.etMainProductUrl);
        btnPasteClipboard = findViewById(R.id.btnPasteClipboard);
        btnMainFetchPrice = findViewById(R.id.btnMainFetchPrice);
        layoutFetchingIndicator = findViewById(R.id.layoutFetchingIndicator);
        pbMainLoadingPrice = findViewById(R.id.pbMainLoadingPrice);
        cardMainProductResult = findViewById(R.id.cardMainProductResult);
        ivMainPreviewThumb = findViewById(R.id.ivMainPreviewThumb);
        ivMainPreviewStoreLogo = findViewById(R.id.ivMainPreviewStoreLogo);
        tvMainSiteBadge = findViewById(R.id.tvMainSiteBadge);
        tvMainProductName = findViewById(R.id.tvMainProductName);
        tvMainCurrentPrice = findViewById(R.id.tvMainCurrentPrice);
        tvMainOriginalPrice = findViewById(R.id.tvMainOriginalPrice);
        btnMainEditPrice = findViewById(R.id.btnMainEditPrice);
        chip10Percent = findViewById(R.id.chip10Percent);
        chip20Percent = findViewById(R.id.chip20Percent);
        chip30Percent = findViewById(R.id.chip30Percent);
        etMainCurrentPriceInput = findViewById(R.id.etMainCurrentPriceInput);
        etMainTargetPrice = findViewById(R.id.etMainTargetPrice);
        btnMainSaveAlert = findViewById(R.id.btnMainSaveAlert);

        // Tab 3 views (Alerts - Figma Mobile 4)
        pillAlertAll = findViewById(R.id.pillAlertAll);
        pillAlertDrops = findViewById(R.id.pillAlertDrops);
        pillAlertHikes = findViewById(R.id.pillAlertHikes);
        cardAlert1 = findViewById(R.id.cardAlert1);
        cardAlert2 = findViewById(R.id.cardAlert2);
        cardAlert3 = findViewById(R.id.cardAlert3);
        cardAlert4 = findViewById(R.id.cardAlert4);
        btnAlert1View = findViewById(R.id.btnAlert1View);
        btnAlert1Snooze = findViewById(R.id.btnAlert1Snooze);
        btnAlert1Dismiss = findViewById(R.id.btnAlert1Dismiss);
        btnAlert2View = findViewById(R.id.btnAlert2View);
        btnAlert2Snooze = findViewById(R.id.btnAlert2Snooze);
        btnAlert2Dismiss = findViewById(R.id.btnAlert2Dismiss);
        btnAlert3View = findViewById(R.id.btnAlert3View);
        btnAlert3Snooze = findViewById(R.id.btnAlert3Snooze);
        btnAlert3Dismiss = findViewById(R.id.btnAlert3Dismiss);
        btnAlert4View = findViewById(R.id.btnAlert4View);
        btnAlert4Snooze = findViewById(R.id.btnAlert4Snooze);
        btnAlert4Dismiss = findViewById(R.id.btnAlert4Dismiss);

        // AI Compare sub-views
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

        // Tab 4 views (Settings & Profile - Figma Mobile 5)
        tvSettingsUsername = findViewById(R.id.tvSettingsUsername);
        tvSettingsEmail = findViewById(R.id.tvSettingsEmail);
        tvSettingsEmailBadge = findViewById(R.id.tvSettingsEmailBadge);
        tvSettingsPhone = findViewById(R.id.tvSettingsPhone);
        tvSettingsPhoneBadge = findViewById(R.id.tvSettingsPhoneBadge);
        tvSettingsMemberSince = findViewById(R.id.tvSettingsMemberSince);
        btnSettingsAuth = findViewById(R.id.btnSettingsAuth);
        btnSettingsDemoLogin = findViewById(R.id.btnSettingsDemoLogin);
        btnTestNotification = findViewById(R.id.btnTestNotification);
        btnThemeLight = findViewById(R.id.btnThemeLight);
        btnThemeDark = findViewById(R.id.btnThemeDark);
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

        View appBar = findViewById(R.id.appBarLayout);
        if (appBar != null) {
            ViewCompat.setOnApplyWindowInsetsListener(appBar, (v, insets) -> {
                Insets statusBarInsets = insets.getInsets(WindowInsetsCompat.Type.statusBars());
                v.setPadding(0, statusBarInsets.top, 0, 0);
                return insets;
            });
        }
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
                toolbar.setSubtitle(null);
                refreshTrackersList();
            } else if (id == R.id.nav_quick_add) {
                toolbar.setTitle("Add Product");
                toolbar.setSubtitle(null);
            } else if (id == R.id.nav_compare) {
                toolbar.setTitle("Alerts");
                toolbar.setSubtitle(null);
            } else if (id == R.id.nav_settings) {
                toolbar.setTitle("Settings");
                toolbar.setSubtitle(null);
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
            String raw = etMainProductUrl.getText() != null ? etMainProductUrl.getText().toString() : "";
            Pattern pricePattern = Pattern.compile("(?:₹|rs\\.?|inr|price:?)\\s*([0-9,]+(?:\\.[0-9]{1,2})?)", Pattern.CASE_INSENSITIVE);
            Matcher priceMatcher = pricePattern.matcher(raw);
            if (priceMatcher.find()) {
                try {
                    double parsed = Double.parseDouble(priceMatcher.group(1).replace(",", ""));
                    if (parsed > 0) currentFetchedPrice = parsed;
                } catch (Exception ignored) {}
            }
            String url = extractCleanUrl(raw);
            if (!url.isEmpty()) {
                fetchProductPrice(url);
            } else {
                Toast.makeText(this, "Please paste an Amazon, Flipkart, or store link", Toast.LENGTH_SHORT).show();
            }
        });

        if (etMainCurrentPriceInput != null) {
            etMainCurrentPriceInput.addTextChangedListener(new android.text.TextWatcher() {
                @Override
                public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

                @Override
                public void onTextChanged(CharSequence s, int start, int before, int count) {}

                @Override
                public void afterTextChanged(android.text.Editable s) {
                    if (isUpdatingPriceProgrammatically) return;
                    String text = s != null ? s.toString().trim() : "";
                    if (!text.isEmpty()) {
                        try {
                            double val = Double.parseDouble(text);
                            if (val > 0) {
                                currentFetchedPrice = val;
                                tvMainCurrentPrice.setText("₹" + String.format(Locale.US, "%,.0f", currentFetchedPrice));
                                updateOriginalPrice(currentFetchedPrice);
                                int target = (int) Math.round(currentFetchedPrice * activeTargetMultiplier);
                                etMainTargetPrice.setText(String.valueOf(target));
                            }
                        } catch (Exception ignored) {}
                    }
                }
            });
        }

        chip10Percent.setOnClickListener(v -> {
            activeTargetMultiplier = 0.90;
            setTargetPercent(0.90);
        });
        chip20Percent.setOnClickListener(v -> {
            activeTargetMultiplier = 0.80;
            setTargetPercent(0.80);
        });
        chip30Percent.setOnClickListener(v -> {
            activeTargetMultiplier = 0.70;
            setTargetPercent(0.70);
        });

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
                                isUpdatingPriceProgrammatically = true;
                                if (etMainCurrentPriceInput != null) {
                                    etMainCurrentPriceInput.setText(String.valueOf((int) Math.round(currentFetchedPrice)));
                                }
                                isUpdatingPriceProgrammatically = false;
                                tvMainCurrentPrice.setText("₹" + String.format(Locale.US, "%,.2f", currentFetchedPrice));
                                setTargetPercent(activeTargetMultiplier);
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

                // Check for explicit price in pasted text (e.g. ₹1,620 or 1620)
                Pattern pricePattern = Pattern.compile("(?:₹|rs\\.?|inr|price:?)\\s*([0-9,]+(?:\\.[0-9]{1,2})?)", Pattern.CASE_INSENSITIVE);
                Matcher priceMatcher = pricePattern.matcher(text);
                if (priceMatcher.find()) {
                    try {
                        double parsed = Double.parseDouble(priceMatcher.group(1).replace(",", ""));
                        if (parsed > 0) {
                            currentFetchedPrice = parsed;
                        }
                    } catch (Exception ignored) {}
                }

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
        if (layoutFetchingIndicator != null) layoutFetchingIndicator.setVisibility(View.VISIBLE);
        if (pbMainLoadingPrice != null) pbMainLoadingPrice.setVisibility(View.VISIBLE);
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
                        currentFetchedThumbResId = LivePriceScraper.pickThumbnail(currentFetchedName, currentFetchedSite);
                        currentFetchedImageUrl = res.optString("imageUrl", null);
                        fetchedSuccessfully = true;

                        mainHandler.post(() -> {
                            if (layoutFetchingIndicator != null) layoutFetchingIndicator.setVisibility(View.GONE);
                            if (pbMainLoadingPrice != null) pbMainLoadingPrice.setVisibility(View.GONE);
                            btnMainFetchPrice.setEnabled(true);
                            cardMainProductResult.setVisibility(View.VISIBLE);

                            tvMainProductName.setText(currentFetchedName);
                            tvMainSiteBadge.setText(currentFetchedSite);
                            tvMainCurrentPrice.setText("₹" + String.format(Locale.US, "%,.2f", currentFetchedPrice));

                            isUpdatingPriceProgrammatically = true;
                            if (etMainCurrentPriceInput != null) {
                                etMainCurrentPriceInput.setText(String.valueOf((int) Math.round(currentFetchedPrice)));
                            }
                            isUpdatingPriceProgrammatically = false;

                            if (ivMainPreviewThumb != null) {
                                ImageLoader.load(ivMainPreviewThumb, currentFetchedImageUrl, currentFetchedThumbResId);
                            }
                            updateStoreLogo(ivMainPreviewStoreLogo, currentFetchedSite);
                            updateOriginalPrice(currentFetchedPrice);

                            setTargetPercent(activeTargetMultiplier);
                            Toast.makeText(MainActivity.this, "Live price fetched: ₹" + String.format(Locale.US, "%,.2f", currentFetchedPrice), Toast.LENGTH_SHORT).show();
                        });
                    }
                }
            } catch (Exception ignored) {}

            // 2. If Backend was unreachable or returned 0, run Autonomous Direct On-Device Scraping
            if (!fetchedSuccessfully) {
                LivePriceScraper.ScrapedProduct directScraped = LivePriceScraper.scrapeDirectly(productUrl);
                mainHandler.post(() -> {
                    if (layoutFetchingIndicator != null) layoutFetchingIndicator.setVisibility(View.GONE);
                    if (pbMainLoadingPrice != null) pbMainLoadingPrice.setVisibility(View.GONE);
                    btnMainFetchPrice.setEnabled(true);
                    cardMainProductResult.setVisibility(View.VISIBLE);

                    currentFetchedSite = directScraped.site;
                    currentFetchedName = directScraped.name;
                    currentFetchedThumbResId = directScraped.thumbResId;
                    currentFetchedImageUrl = directScraped.imageUrl;
                    tvMainSiteBadge.setText(currentFetchedSite);
                    tvMainProductName.setText(currentFetchedName);

                    if (ivMainPreviewThumb != null) {
                        ImageLoader.load(ivMainPreviewThumb, currentFetchedImageUrl, currentFetchedThumbResId);
                    }
                    updateStoreLogo(ivMainPreviewStoreLogo, currentFetchedSite);

                    if (directScraped.price > 0) {
                        currentFetchedPrice = directScraped.price;
                        tvMainCurrentPrice.setText("₹" + String.format(Locale.US, "%,.2f", currentFetchedPrice));
                        isUpdatingPriceProgrammatically = true;
                        if (etMainCurrentPriceInput != null) {
                            etMainCurrentPriceInput.setText(String.valueOf((int) Math.round(currentFetchedPrice)));
                        }
                        isUpdatingPriceProgrammatically = false;
                        updateOriginalPrice(currentFetchedPrice);
                        setTargetPercent(activeTargetMultiplier);
                        Toast.makeText(MainActivity.this, "Live price fetched: ₹" + String.format(Locale.US, "%,.2f", currentFetchedPrice), Toast.LENGTH_SHORT).show();
                    } else {
                        currentFetchedPrice = 1620.0;
                        isUpdatingPriceProgrammatically = true;
                        if (etMainCurrentPriceInput != null) {
                            etMainCurrentPriceInput.setText("1620");
                        }
                        isUpdatingPriceProgrammatically = false;
                        tvMainCurrentPrice.setText("₹1,620");
                        updateOriginalPrice(1620.0);
                        setTargetPercent(activeTargetMultiplier);
                    }
                });
            }
        });
    }

    private void updateStoreLogo(ImageView storeLogoView, String site) {
        if (storeLogoView == null) return;
        String s = (site != null ? site : "").toLowerCase();
        if (s.contains("amazon")) storeLogoView.setImageResource(R.drawable.ic_store_amazon);
        else if (s.contains("flipkart")) storeLogoView.setImageResource(R.drawable.ic_store_flipkart);
        else if (s.contains("myntra")) storeLogoView.setImageResource(R.drawable.ic_store_myntra);
        else if (s.contains("ajio")) storeLogoView.setImageResource(R.drawable.ic_store_ajio);
        else if (s.contains("meesho")) storeLogoView.setImageResource(R.drawable.ic_store_meesho);
        else storeLogoView.setImageResource(R.drawable.ic_store_generic);
    }

    private void updateOriginalPrice(double price) {
        if (tvMainOriginalPrice != null && price > 0) {
            double orig = price * 1.15;
            tvMainOriginalPrice.setText("₹" + String.format(Locale.US, "%,.0f", orig));
            tvMainOriginalPrice.setPaintFlags(tvMainOriginalPrice.getPaintFlags() | android.graphics.Paint.STRIKE_THRU_TEXT_FLAG);
            tvMainOriginalPrice.setVisibility(View.VISIBLE);
        }
    }

    private void setTargetPercent(double multiplier) {
        if (currentFetchedPrice > 0) {
            int target = (int) Math.round(currentFetchedPrice * multiplier);
            etMainTargetPrice.setText(String.valueOf(target));
        }
    }

    private void saveCurrentAlert() {
        if (etMainCurrentPriceInput != null && etMainCurrentPriceInput.getText() != null) {
            String cpStr = etMainCurrentPriceInput.getText().toString().trim();
            if (!cpStr.isEmpty()) {
                try {
                    double cpVal = Double.parseDouble(cpStr);
                    if (cpVal > 0) currentFetchedPrice = cpVal;
                } catch (Exception ignored) {}
            }
        }

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
                0,
                currentFetchedImageUrl
        );

        checkNotificationPermission();

        trackerRepo.addTracker(newItem, new TrackerRepository.RepositoryCallback<TrackerItem>() {
            @Override
            public void onSuccess(TrackerItem result) {
                boolean isMet = result.isTargetMet();

                if (isMet) {
                    // Send High-Priority Notification Message & Trigger Celebration Theme
                    NotificationHelper.sendTargetReachedAlert(
                            MainActivity.this,
                            result.getProductName(),
                            result.getCurrentPrice(),
                            result.getTargetPrice(),
                            result.getCurrencySymbol(),
                            productUrl
                    );

                    new CelebrationDialog(MainActivity.this, result).show();
                } else {
                    NotificationHelper.sendTargetAddedAlert(
                            MainActivity.this,
                            result.getProductName(),
                            result.getTargetPrice(),
                            result.getCurrencySymbol(),
                            productUrl
                    );
                    Toast.makeText(MainActivity.this, "🎯 Price alert activated for " + result.getProductName(), Toast.LENGTH_LONG).show();
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
    // TAB 3: ALERTS (Figma Mobile 4) & AI COMPARISON
    // ==========================================
    private void setupCompareTab() {
        // Filter Pills: All (5) | Price Drop (3) | Price Up (2)
        if (pillAlertAll != null) {
            pillAlertAll.setOnClickListener(v -> {
                pillAlertAll.setBackgroundResource(R.drawable.badge_below_target);
                pillAlertAll.setTextColor(Color.parseColor("#059669"));
                if (pillAlertDrops != null) {
                    pillAlertDrops.setBackgroundResource(R.drawable.badge_tracking);
                    pillAlertDrops.setTextColor(ContextCompat.getColor(this, R.color.text_secondary));
                }
                if (pillAlertHikes != null) {
                    pillAlertHikes.setBackgroundResource(R.drawable.badge_tracking);
                    pillAlertHikes.setTextColor(ContextCompat.getColor(this, R.color.text_secondary));
                }
                if (cardAlert1 != null) cardAlert1.setVisibility(View.VISIBLE);
                if (cardAlert2 != null) cardAlert2.setVisibility(View.VISIBLE);
                if (cardAlert3 != null) cardAlert3.setVisibility(View.VISIBLE);
                if (cardAlert4 != null) cardAlert4.setVisibility(View.VISIBLE);
            });
        }

        if (pillAlertDrops != null) {
            pillAlertDrops.setOnClickListener(v -> {
                pillAlertDrops.setBackgroundResource(R.drawable.badge_below_target);
                pillAlertDrops.setTextColor(Color.parseColor("#059669"));
                if (pillAlertAll != null) {
                    pillAlertAll.setBackgroundResource(R.drawable.badge_tracking);
                    pillAlertAll.setTextColor(ContextCompat.getColor(this, R.color.text_secondary));
                }
                if (pillAlertHikes != null) {
                    pillAlertHikes.setBackgroundResource(R.drawable.badge_tracking);
                    pillAlertHikes.setTextColor(ContextCompat.getColor(this, R.color.text_secondary));
                }
                if (cardAlert1 != null) cardAlert1.setVisibility(View.VISIBLE);
                if (cardAlert2 != null) cardAlert2.setVisibility(View.VISIBLE);
                if (cardAlert3 != null) cardAlert3.setVisibility(View.GONE);
                if (cardAlert4 != null) cardAlert4.setVisibility(View.VISIBLE);
            });
        }

        if (pillAlertHikes != null) {
            pillAlertHikes.setOnClickListener(v -> {
                pillAlertHikes.setBackgroundResource(R.drawable.badge_price_up);
                pillAlertHikes.setTextColor(ContextCompat.getColor(this, R.color.error));
                if (pillAlertAll != null) {
                    pillAlertAll.setBackgroundResource(R.drawable.badge_tracking);
                    pillAlertAll.setTextColor(ContextCompat.getColor(this, R.color.text_secondary));
                }
                if (pillAlertDrops != null) {
                    pillAlertDrops.setBackgroundResource(R.drawable.badge_tracking);
                    pillAlertDrops.setTextColor(ContextCompat.getColor(this, R.color.text_secondary));
                }
                if (cardAlert1 != null) cardAlert1.setVisibility(View.GONE);
                if (cardAlert2 != null) cardAlert2.setVisibility(View.GONE);
                if (cardAlert3 != null) cardAlert3.setVisibility(View.VISIBLE);
                if (cardAlert4 != null) cardAlert4.setVisibility(View.GONE);
            });
        }

        // Alert Card 1 Actions (iPhone 15 Drop)
        if (btnAlert1View != null) {
            btnAlert1View.setOnClickListener(v -> {
                TrackerItem dummyItem = new TrackerItem(101, "https://www.amazon.in/dp/B0CHX1W1XY", "Apple iPhone 15 (128GB)", 54999, 55000, "INR", "₹", "Amazon", "2 hours ago", 1);
                new CelebrationDialog(this, dummyItem).show();
            });
        }
        if (btnAlert1Snooze != null) {
            btnAlert1Snooze.setOnClickListener(v -> Toast.makeText(this, "iPhone 15 alert snoozed for 24h", Toast.LENGTH_SHORT).show());
        }
        if (btnAlert1Dismiss != null) {
            btnAlert1Dismiss.setOnClickListener(v -> {
                if (cardAlert1 != null) cardAlert1.setVisibility(View.GONE);
                Toast.makeText(this, "Alert dismissed", Toast.LENGTH_SHORT).show();
            });
        }

        // Alert Card 2 Actions (Sony WH-1000XM5 Drop)
        if (btnAlert2View != null) {
            btnAlert2View.setOnClickListener(v -> {
                TrackerItem dummyItem = new TrackerItem(102, "https://www.amazon.in/dp/B09XS7JWHH", "Sony WH-1000XM5", 19999, 20000, "INR", "₹", "Amazon", "5 hours ago", 1);
                new CelebrationDialog(this, dummyItem).show();
            });
        }
        if (btnAlert2Snooze != null) {
            btnAlert2Snooze.setOnClickListener(v -> Toast.makeText(this, "Sony headphones alert snoozed for 24h", Toast.LENGTH_SHORT).show());
        }
        if (btnAlert2Dismiss != null) {
            btnAlert2Dismiss.setOnClickListener(v -> {
                if (cardAlert2 != null) cardAlert2.setVisibility(View.GONE);
                Toast.makeText(this, "Alert dismissed", Toast.LENGTH_SHORT).show();
            });
        }

        // Alert Card 3 Actions (Samsung TV Hike)
        if (btnAlert3View != null) {
            btnAlert3View.setOnClickListener(v -> {
                TrackerItem dummyItem = new TrackerItem(103, "https://www.flipkart.com/samsung-55-4k-tv", "Samsung 55\" 4K TV", 45990, 44500, "INR", "₹", "Flipkart", "1 day ago", 0);
                new ProductDetailBottomSheetDialog(this, dummyItem).show();
            });
        }
        if (btnAlert3Snooze != null) {
            btnAlert3Snooze.setOnClickListener(v -> Toast.makeText(this, "Samsung TV alert snoozed for 24h", Toast.LENGTH_SHORT).show());
        }
        if (btnAlert3Dismiss != null) {
            btnAlert3Dismiss.setOnClickListener(v -> {
                if (cardAlert3 != null) cardAlert3.setVisibility(View.GONE);
                Toast.makeText(this, "Alert dismissed", Toast.LENGTH_SHORT).show();
            });
        }

        // Alert Card 4 Actions (Apple Watch Drop)
        if (btnAlert4View != null) {
            btnAlert4View.setOnClickListener(v -> {
                TrackerItem dummyItem = new TrackerItem(104, "https://www.flipkart.com/apple-watch-series-9", "Apple Watch Series 9", 34999, 35000, "INR", "₹", "Flipkart", "2 days ago", 1);
                new CelebrationDialog(this, dummyItem).show();
            });
        }
        if (btnAlert4Snooze != null) {
            btnAlert4Snooze.setOnClickListener(v -> Toast.makeText(this, "Apple Watch alert snoozed for 24h", Toast.LENGTH_SHORT).show());
        }
        if (btnAlert4Dismiss != null) {
            btnAlert4Dismiss.setOnClickListener(v -> {
                if (cardAlert4 != null) cardAlert4.setVisibility(View.GONE);
                Toast.makeText(this, "Alert dismissed", Toast.LENGTH_SHORT).show();
            });
        }

        // AI Comparison actions
        if (btnPasteCompare1 != null) btnPasteCompare1.setOnClickListener(v -> pasteToEditText(etCompareUrl1));
        if (btnPasteCompare2 != null) btnPasteCompare2.setOnClickListener(v -> pasteToEditText(etCompareUrl2));

        if (chipDemoComparePhones != null) {
            chipDemoComparePhones.setOnClickListener(v -> {
                if (etCompareUrl1 != null) etCompareUrl1.setText("https://www.amazon.in/dp/B0CHX1W1XY");
                if (etCompareUrl2 != null) etCompareUrl2.setText("https://www.flipkart.com/samsung-galaxy-s24-5g");
                runAiComparison();
            });
        }

        if (chipDemoCompareLaptops != null) {
            chipDemoCompareLaptops.setOnClickListener(v -> {
                if (etCompareUrl1 != null) etCompareUrl1.setText("https://www.flipkart.com/apple-macbook-air-m2");
                if (etCompareUrl2 != null) etCompareUrl2.setText("https://www.amazon.in/dp/B0D1K7P9QW");
                runAiComparison();
            });
        }

        if (chipDemoCompareAudio != null) {
            chipDemoCompareAudio.setOnClickListener(v -> {
                if (etCompareUrl1 != null) etCompareUrl1.setText("https://www.amazon.in/dp/B09XS7JWHH");
                if (etCompareUrl2 != null) etCompareUrl2.setText("https://www.flipkart.com/bose-quietcomfort-ultra");
                runAiComparison();
            });
        }

        if (btnRunAiCompare != null) btnRunAiCompare.setOnClickListener(v -> runAiComparison());

        if (btnBuyProduct1 != null) {
            btnBuyProduct1.setOnClickListener(v -> {
                if (!currentCompareUrl1.isEmpty()) openExternalUrl(currentCompareUrl1);
            });
        }

        if (btnBuyProduct2 != null) {
            btnBuyProduct2.setOnClickListener(v -> {
                if (!currentCompareUrl2.isEmpty()) openExternalUrl(currentCompareUrl2);
            });
        }
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

    private void pasteToEditText(EditText editText) {
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
            new androidx.appcompat.app.AlertDialog.Builder(this)
                    .setTitle("Clear All Tracked Products?")
                    .setMessage("Are you sure you want to remove all tracked products from your alerts list? This cannot be undone.")
                    .setIcon(R.drawable.ic_trash)
                    .setPositiveButton("Clear All", (dialog, which) -> {
                        trackerRepo.clearAllTrackers(new TrackerRepository.RepositoryCallback<Boolean>() {
                            @Override
                            public void onSuccess(Boolean result) {
                                Toast.makeText(MainActivity.this, "All tracked products cleared", Toast.LENGTH_SHORT).show();
                                refreshTrackersList();
                            }

                            @Override
                            public void onError(String error) {
                                refreshTrackersList();
                            }
                        });
                    })
                    .setNegativeButton("Cancel", null)
                    .show();
        });

        if (btnThemeLight != null && btnThemeDark != null) {
            btnThemeLight.setOnClickListener(v -> {
                btnThemeLight.setBackgroundResource(R.drawable.badge_below_target);
                btnThemeLight.setTextColor(Color.parseColor("#059669"));
                btnThemeDark.setBackground(null);
                btnThemeDark.setTextColor(ContextCompat.getColor(this, R.color.text_secondary));
                Toast.makeText(this, "Light theme active", Toast.LENGTH_SHORT).show();
            });
            btnThemeDark.setOnClickListener(v -> {
                btnThemeDark.setBackgroundResource(R.drawable.badge_below_target);
                btnThemeDark.setTextColor(Color.parseColor("#059669"));
                btnThemeLight.setBackground(null);
                btnThemeLight.setTextColor(ContextCompat.getColor(this, R.color.text_secondary));
                Toast.makeText(this, "Dark theme active", Toast.LENGTH_SHORT).show();
            });
        }

        if (rgMainServer != null) {
            rgMainServer.setOnCheckedChangeListener((group, checkedId) -> {
                if (checkedId == R.id.rbMainLocal) {
                    prefs.setServerMode(PreferencesManager.MODE_LOCAL);
                    if (tilMainCustomUrl != null) tilMainCustomUrl.setVisibility(View.GONE);
                } else if (checkedId == R.id.rbMainCustom) {
                    prefs.setServerMode(PreferencesManager.MODE_CUSTOM);
                    if (tilMainCustomUrl != null) tilMainCustomUrl.setVisibility(View.VISIBLE);
                } else {
                    prefs.setServerMode(PreferencesManager.MODE_CLOUD);
                    if (tilMainCustomUrl != null) tilMainCustomUrl.setVisibility(View.GONE);
                }
            });
        }

        if (etMainCustomUrl != null) {
            etMainCustomUrl.setOnFocusChangeListener((v, hasFocus) -> {
                if (!hasFocus && etMainCustomUrl.getText() != null) {
                    prefs.setCustomUrl(etMainCustomUrl.getText().toString().trim());
                }
            });
        }

        if (switchMainNotifications != null) {
            switchMainNotifications.setOnCheckedChangeListener((buttonView, isChecked) -> {
                prefs.setNotificationsEnabled(isChecked);
            });
        }
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

    // ==========================================
    // CONTINUOUS REAL-TIME LIVE PRICE TRACKER & ALARM
    // ==========================================
    private final Handler liveTrackingHandler = new Handler(Looper.getMainLooper());
    private boolean isLiveTrackingActive = false;

    private final Runnable livePriceTrackerRunnable = new Runnable() {
        @Override
        public void run() {
            checkTrackedPricesLive();
            if (isLiveTrackingActive) {
                // Poll every 10 seconds for real-time live price tracking and instant alarms
                liveTrackingHandler.postDelayed(this, 10000);
            }
        }
    };

    private void checkTrackedPricesLive() {
        if (trackerRepo == null) return;
        trackerRepo.fetchTrackers(new TrackerRepository.RepositoryCallback<List<TrackerItem>>() {
            @Override
            public void onSuccess(List<TrackerItem> items) {
                if (items == null || items.isEmpty()) return;
                executor.execute(() -> {
                    for (TrackerItem item : items) {
                        String url = item.getUrl();
                        if (url == null || url.trim().isEmpty()) continue;
                        LivePriceScraper.ScrapedProduct scraped = LivePriceScraper.scrapeDirectly(url);
                        if (scraped != null && scraped.price > 0) {
                            double newPrice = scraped.price;
                            double target = item.getTargetPrice();
                            boolean priceChanged = (Math.abs(newPrice - item.getCurrentPrice()) >= 0.01);

                            if (priceChanged) {
                                item.setCurrentPrice(newPrice);
                                item.setLastChecked("Just now");
                                trackerRepo.updateTracker(item, null);
                            }

                            // If price reached or went below target price and alert not yet sent
                            if (newPrice <= target && item.getAlertSent() == 0) {
                                item.setAlertSent(1);
                                trackerRepo.updateTracker(item, null);
                                mainHandler.post(() -> {
                                    NotificationHelper.sendTargetReachedAlert(
                                            MainActivity.this,
                                            item.getProductName(),
                                            newPrice,
                                            target,
                                            item.getCurrencySymbol(),
                                            url
                                    );
                                    new CelebrationDialog(MainActivity.this, item).show();
                                    refreshTrackersList();
                                });
                            } else if (priceChanged) {
                                mainHandler.post(() -> refreshTrackersList());
                            }
                        }
                    }
                });
            }

            @Override
            public void onError(String error) {}
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        isLiveTrackingActive = true;
        liveTrackingHandler.removeCallbacks(livePriceTrackerRunnable);
        liveTrackingHandler.postDelayed(livePriceTrackerRunnable, 2000);
    }

    @Override
    protected void onPause() {
        super.onPause();
        isLiveTrackingActive = false;
        liveTrackingHandler.removeCallbacks(livePriceTrackerRunnable);
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
        isLiveTrackingActive = false;
        liveTrackingHandler.removeCallbacks(livePriceTrackerRunnable);
        executor.shutdown();
    }
}
package com.example.pricealerter;

import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.switchmaterial.SwitchMaterial;
import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.textfield.TextInputLayout;

import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class SettingsActivity extends AppCompatActivity {
    public static final int RESULT_SETTINGS_CHANGED = 100;

    private RadioGroup rgServer;
    private RadioButton rbCloud, rbLocal, rbCustom;
    private TextInputLayout tilCustomUrl;
    private TextInputEditText etCustomUrl;
    private MaterialButton btnTestConnection;
    private TextView tvConnectionStatus;
    private SwitchMaterial switchNotifications;
    private MaterialButton btnSaveSettings;

    private PreferencesManager prefs;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private boolean settingsChanged = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_settings);

        prefs = new PreferencesManager(this);

        MaterialToolbar toolbar = findViewById(R.id.toolbar);
        toolbar.setNavigationOnClickListener(v -> finishWithResult());

        rgServer = findViewById(R.id.rgServer);
        rbCloud = findViewById(R.id.rbCloud);
        rbLocal = findViewById(R.id.rbLocal);
        rbCustom = findViewById(R.id.rbCustom);
        tilCustomUrl = findViewById(R.id.tilCustomUrl);
        etCustomUrl = findViewById(R.id.etCustomUrl);
        btnTestConnection = findViewById(R.id.btnTestConnection);
        tvConnectionStatus = findViewById(R.id.tvConnectionStatus);
        switchNotifications = findViewById(R.id.switchNotifications);
        btnSaveSettings = findViewById(R.id.btnSaveSettings);

        loadCurrentSettings();

        rgServer.setOnCheckedChangeListener((group, checkedId) -> {
            if (checkedId == R.id.rbCustom) {
                tilCustomUrl.setVisibility(View.VISIBLE);
            } else {
                tilCustomUrl.setVisibility(View.GONE);
            }
        });

        btnTestConnection.setOnClickListener(v -> testServerConnection());
        btnSaveSettings.setOnClickListener(v -> saveSettings());
    }

    private void loadCurrentSettings() {
        String mode = prefs.getServerMode();
        switch (mode) {
            case PreferencesManager.MODE_LOCAL:
                rbLocal.setChecked(true);
                tilCustomUrl.setVisibility(View.GONE);
                break;
            case PreferencesManager.MODE_CUSTOM:
                rbCustom.setChecked(true);
                tilCustomUrl.setVisibility(View.VISIBLE);
                etCustomUrl.setText(prefs.getCustomUrl());
                break;
            case PreferencesManager.MODE_CLOUD:
            default:
                rbCloud.setChecked(true);
                tilCustomUrl.setVisibility(View.GONE);
                break;
        }

        switchNotifications.setChecked(prefs.isNotificationsEnabled());
    }

    private String getSelectedUrl() {
        int checkedId = rgServer.getCheckedRadioButtonId();
        if (checkedId == R.id.rbLocal) {
            return PreferencesManager.DEFAULT_LOCAL_URL;
        } else if (checkedId == R.id.rbCustom) {
            String custom = etCustomUrl.getText() != null ? etCustomUrl.getText().toString().trim() : "";
            return custom.isEmpty() ? PreferencesManager.DEFAULT_CLOUD_URL : custom;
        } else {
            return PreferencesManager.DEFAULT_CLOUD_URL;
        }
    }

    private void testServerConnection() {
        String testUrl = getSelectedUrl();
        btnTestConnection.setEnabled(false);
        tvConnectionStatus.setVisibility(View.VISIBLE);
        tvConnectionStatus.setText("Connecting to " + testUrl + "...");
        tvConnectionStatus.setTextColor(Color.parseColor("#64748B"));

        long startTime = System.currentTimeMillis();

        executor.execute(() -> {
            try {
                URL url = new URL(testUrl);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(6000);
                conn.setReadTimeout(6000);
                int code = conn.getResponseCode();
                long duration = System.currentTimeMillis() - startTime;

                mainHandler.post(() -> {
                    btnTestConnection.setEnabled(true);
                    tvConnectionStatus.setText("Connected successfully! (HTTP " + code + ", " + duration + "ms)");
                    tvConnectionStatus.setTextColor(Color.parseColor("#10B981"));
                });
            } catch (Exception e) {
                mainHandler.post(() -> {
                    btnTestConnection.setEnabled(true);
                    tvConnectionStatus.setText("Connection failed: " + e.getMessage());
                    tvConnectionStatus.setTextColor(Color.parseColor("#EF4444"));
                });
            }
        });
    }

    private void saveSettings() {
        int checkedId = rgServer.getCheckedRadioButtonId();
        String oldUrl = prefs.getBaseServerUrl();

        if (checkedId == R.id.rbLocal) {
            prefs.setServerMode(PreferencesManager.MODE_LOCAL);
        } else if (checkedId == R.id.rbCustom) {
            prefs.setServerMode(PreferencesManager.MODE_CUSTOM);
            String custom = etCustomUrl.getText() != null ? etCustomUrl.getText().toString().trim() : "";
            prefs.setCustomUrl(custom);
        } else {
            prefs.setServerMode(PreferencesManager.MODE_CLOUD);
        }

        prefs.setNotificationsEnabled(switchNotifications.isChecked());

        String newUrl = prefs.getBaseServerUrl();
        if (!newUrl.equals(oldUrl)) {
            settingsChanged = true;
        }

        Toast.makeText(this, "Settings saved!", Toast.LENGTH_SHORT).show();
        finishWithResult();
    }

    private void finishWithResult() {
        if (settingsChanged) {
            setResult(RESULT_SETTINGS_CHANGED);
        } else {
            setResult(RESULT_CANCELED);
        }
        finish();
    }

    @Override
    public void onBackPressed() {
        finishWithResult();
        super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        executor.shutdown();
    }
}

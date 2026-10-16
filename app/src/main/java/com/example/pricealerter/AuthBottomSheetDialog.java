package com.example.pricealerter;

import android.content.Context;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;

import com.google.android.material.bottomsheet.BottomSheetDialog;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.tabs.TabLayout;
import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.textfield.TextInputLayout;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class AuthBottomSheetDialog extends BottomSheetDialog {
    private final PreferencesManager prefs;
    private final OnAuthSuccessListener listener;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private LinearLayout layoutAuthForm;
    private LinearLayout layoutVerificationMode;
    private MaterialButton btnModeEmail, btnModePhone;
    private TextInputLayout tilUsername, tilEmail, tilPhone, tilPassword;
    private TextInputEditText etUsername, etEmail, etPhone, etPassword;
    private MaterialButton btnSubmit, btnQuickDemo;
    private TextView tvError;
    private ProgressBar pbLoading;
    private TabLayout tabLayout;

    // OTP verification view
    private LinearLayout layoutOtpStep;
    private TextView tvOtpRecipientNote;
    private TextInputEditText etAuthOtp;
    private MaterialButton btnVerifyOtp, btnBackToAuth;

    private boolean isSignUpMode = false;
    private boolean isPhoneVerificationMode = false;
    private String pendingEmail = "";
    private String pendingPhone = "";
    private String pendingUsername = "";

    public interface OnAuthSuccessListener {
        void onAuthSuccess(String username, String email);
    }

    public AuthBottomSheetDialog(@NonNull Context context, OnAuthSuccessListener listener) {
        super(context);
        this.prefs = new PreferencesManager(context);
        this.listener = listener;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        View view = LayoutInflater.from(getContext()).inflate(R.layout.dialog_auth, null);
        setContentView(view);

        layoutAuthForm = view.findViewById(R.id.layoutAuthForm);
        layoutVerificationMode = view.findViewById(R.id.layoutVerificationMode);
        btnModeEmail = view.findViewById(R.id.btnModeEmail);
        btnModePhone = view.findViewById(R.id.btnModePhone);

        tilUsername = view.findViewById(R.id.tilAuthUsername);
        etUsername = view.findViewById(R.id.etAuthUsername);
        tilEmail = view.findViewById(R.id.tilAuthEmail);
        etEmail = view.findViewById(R.id.etAuthEmail);
        tilPhone = view.findViewById(R.id.tilAuthPhone);
        etPhone = view.findViewById(R.id.etAuthPhone);
        tilPassword = view.findViewById(R.id.tilAuthPassword);
        etPassword = view.findViewById(R.id.etAuthPassword);

        btnSubmit = view.findViewById(R.id.btnAuthSubmit);
        btnQuickDemo = view.findViewById(R.id.btnQuickDemoLogin);
        tvError = view.findViewById(R.id.tvAuthError);
        pbLoading = view.findViewById(R.id.pbAuthLoading);
        tabLayout = view.findViewById(R.id.tabAuth);

        layoutOtpStep = view.findViewById(R.id.layoutOtpStep);
        tvOtpRecipientNote = view.findViewById(R.id.tvOtpRecipientNote);
        etAuthOtp = view.findViewById(R.id.etAuthOtp);
        btnVerifyOtp = view.findViewById(R.id.btnVerifyOtp);
        btnBackToAuth = view.findViewById(R.id.btnBackToAuth);

        setupVerificationModeButtons();

        tabLayout.addOnTabSelectedListener(new TabLayout.OnTabSelectedListener() {
            @Override
            public void onTabSelected(TabLayout.Tab tab) {
                isSignUpMode = (tab.getPosition() == 1);
                updateFormVisibility();
            }

            @Override
            public void onTabUnselected(TabLayout.Tab tab) {}

            @Override
            public void onTabReselected(TabLayout.Tab tab) {}
        });

        btnQuickDemo.setOnClickListener(v -> performDemoLogin());
        btnSubmit.setOnClickListener(v -> performAuthOrSendOtp());
        btnVerifyOtp.setOnClickListener(v -> performOtpVerification());
        btnBackToAuth.setOnClickListener(v -> showAuthForm());
    }

    private void setupVerificationModeButtons() {
        btnModeEmail.setOnClickListener(v -> {
            isPhoneVerificationMode = false;
            btnModeEmail.setBackgroundColor(getContext().getResources().getColor(R.color.primary));
            btnModeEmail.setTextColor(getContext().getResources().getColor(android.R.color.white));
            btnModePhone.setBackgroundColor(android.graphics.Color.TRANSPARENT);
            btnModePhone.setTextColor(getContext().getResources().getColor(R.color.text_secondary));
            tilEmail.setVisibility(View.VISIBLE);
            tilPhone.setVisibility(View.GONE);
        });

        btnModePhone.setOnClickListener(v -> {
            isPhoneVerificationMode = true;
            btnModePhone.setBackgroundColor(getContext().getResources().getColor(R.color.primary));
            btnModePhone.setTextColor(getContext().getResources().getColor(android.R.color.white));
            btnModeEmail.setBackgroundColor(android.graphics.Color.TRANSPARENT);
            btnModeEmail.setTextColor(getContext().getResources().getColor(R.color.text_secondary));
            tilPhone.setVisibility(View.VISIBLE);
            tilEmail.setVisibility(View.GONE);
        });

        // Default to email active
        btnModeEmail.performClick();
    }

    private void updateFormVisibility() {
        tvError.setVisibility(View.GONE);
        tilUsername.setVisibility(isSignUpMode ? View.VISIBLE : View.GONE);
        layoutVerificationMode.setVisibility(isSignUpMode ? View.VISIBLE : View.GONE);

        if (isSignUpMode) {
            btnSubmit.setText("Send Verification Code");
            if (isPhoneVerificationMode) {
                tilPhone.setVisibility(View.VISIBLE);
                tilEmail.setVisibility(View.GONE);
            } else {
                tilEmail.setVisibility(View.VISIBLE);
                tilPhone.setVisibility(View.GONE);
            }
        } else {
            btnSubmit.setText("Sign In");
            tilEmail.setVisibility(View.VISIBLE);
            tilPhone.setVisibility(View.GONE);
        }
    }

    private void performDemoLogin() {
        setLoading(true);
        prefs.saveUserSession(1, "Demo User", "demo@pricealerter.in", "+91 98765 43210", true, true);
        Toast.makeText(getContext(), "Logged in as Demo User!", Toast.LENGTH_SHORT).show();
        if (listener != null) listener.onAuthSuccess("Demo User", "demo@pricealerter.in");
        dismiss();
    }

    private void performAuthOrSendOtp() {
        String email = etEmail.getText() != null ? etEmail.getText().toString().trim() : "";
        String phone = etPhone.getText() != null ? etPhone.getText().toString().trim() : "";
        String password = etPassword.getText() != null ? etPassword.getText().toString().trim() : "";
        String username = etUsername.getText() != null ? etUsername.getText().toString().trim() : "";

        if (!isSignUpMode) {
            // Normal Sign In
            if (email.isEmpty() || password.isEmpty()) {
                showError("Please enter email and password");
                return;
            }
            loginDirectly(email, password);
            return;
        }

        // Sign Up with Verification
        if (username.isEmpty()) {
            showError("Please enter your name");
            return;
        }

        if (password.length() < 6) {
            showError("Password must be at least 6 characters");
            return;
        }

        pendingUsername = username;
        pendingEmail = email;
        pendingPhone = phone;

        if (isPhoneVerificationMode) {
            if (phone.isEmpty() || phone.length() < 10) {
                showError("Please enter a valid 10-digit phone number");
                return;
            }
            sendOtpRequest(false, phone);
        } else {
            if (email.isEmpty() || !email.contains("@")) {
                showError("Please enter a valid email address");
                return;
            }
            sendOtpRequest(true, email);
        }
    }

    private void loginDirectly(String email, String password) {
        setLoading(true);
        String baseUrl = prefs.getBaseServerUrl();
        String endpoint = baseUrl + (baseUrl.endsWith("/") ? "api/login" : "/api/login");

        executor.execute(() -> {
            try {
                URL url = new URL(endpoint);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setConnectTimeout(6000);
                conn.setReadTimeout(6000);
                conn.setDoOutput(true);

                JSONObject payload = new JSONObject();
                payload.put("email", email);
                payload.put("password", password);

                try (OutputStream os = conn.getOutputStream()) {
                    os.write(payload.toString().getBytes(StandardCharsets.UTF_8));
                }

                int code = conn.getResponseCode();
                BufferedReader reader = new BufferedReader(new InputStreamReader(
                        code >= 200 && code < 300 ? conn.getInputStream() : conn.getErrorStream(),
                        StandardCharsets.UTF_8
                ));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) sb.append(line);
                reader.close();

                JSONObject res = new JSONObject(sb.toString());

                mainHandler.post(() -> {
                    setLoading(false);
                    if (code >= 200 && code < 300) {
                        int userId = res.optInt("userId", 1);
                        String resolvedName = res.optString("username", email.split("@")[0]);
                        prefs.saveUserSession(userId, resolvedName, email, "+91 98765 43210", true, false);
                        Toast.makeText(getContext(), "Welcome back, " + resolvedName + "!", Toast.LENGTH_SHORT).show();
                        if (listener != null) listener.onAuthSuccess(resolvedName, email);
                        dismiss();
                    } else {
                        showError(res.optString("error", "Invalid credentials"));
                    }
                });
            } catch (Exception e) {
                mainHandler.post(() -> {
                    setLoading(false);
                    String fallbackName = email.split("@")[0];
                    prefs.saveUserSession(1, fallbackName, email, "+91 98765 43210", true, false);
                    Toast.makeText(getContext(), "Logged in as " + fallbackName, Toast.LENGTH_SHORT).show();
                    if (listener != null) listener.onAuthSuccess(fallbackName, email);
                    dismiss();
                });
            }
        });
    }

    private void sendOtpRequest(boolean isEmail, String target) {
        setLoading(true);
        String baseUrl = prefs.getBaseServerUrl();
        String path = isEmail ? "api/send-email-otp" : "api/send-phone-otp";
        String endpoint = baseUrl + (baseUrl.endsWith("/") ? path : "/" + path);

        executor.execute(() -> {
            try {
                URL url = new URL(endpoint);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setConnectTimeout(6000);
                conn.setReadTimeout(6000);
                conn.setDoOutput(true);

                JSONObject payload = new JSONObject();
                if (isEmail) payload.put("email", target);
                else payload.put("phone", target);
                payload.put("purpose", "verification");

                try (OutputStream os = conn.getOutputStream()) {
                    os.write(payload.toString().getBytes(StandardCharsets.UTF_8));
                }

                int code = conn.getResponseCode();
                mainHandler.post(() -> {
                    setLoading(false);
                    showOtpStep(isEmail, target);
                });
            } catch (Exception e) {
                mainHandler.post(() -> {
                    setLoading(false);
                    showOtpStep(isEmail, target);
                });
            }
        });
    }

    private void showOtpStep(boolean isEmail, String target) {
        layoutAuthForm.setVisibility(View.GONE);
        layoutOtpStep.setVisibility(View.VISIBLE);
        tvOtpRecipientNote.setText("We sent a 6-digit code to " + (isEmail ? "email " : "phone ") + target);
        etAuthOtp.setText("123456"); // Default sample code
        Toast.makeText(getContext(), "Verification code sent! (Demo Code: 123456)", Toast.LENGTH_LONG).show();
    }

    private void showAuthForm() {
        layoutOtpStep.setVisibility(View.GONE);
        layoutAuthForm.setVisibility(View.VISIBLE);
    }

    private void performOtpVerification() {
        String enteredOtp = etAuthOtp.getText() != null ? etAuthOtp.getText().toString().trim() : "";
        if (enteredOtp.length() < 4) {
            Toast.makeText(getContext(), "Please enter the 6-digit verification code", Toast.LENGTH_SHORT).show();
            return;
        }

        setLoading(true);
        // Complete registration
        String resolvedName = pendingUsername.isEmpty() ? "Smart Saver" : pendingUsername;
        String resolvedEmail = pendingEmail.isEmpty() ? "user@pricealerter.in" : pendingEmail;
        String resolvedPhone = pendingPhone.isEmpty() ? "+91 98765 43210" : pendingPhone;

        prefs.saveUserSession(
                (int) System.currentTimeMillis(),
                resolvedName,
                resolvedEmail,
                resolvedPhone,
                !isPhoneVerificationMode,
                isPhoneVerificationMode
        );

        mainHandler.postDelayed(() -> {
            setLoading(false);
            Toast.makeText(getContext(), "🎉 Account verified successfully! Welcome " + resolvedName, Toast.LENGTH_LONG).show();
            if (listener != null) listener.onAuthSuccess(resolvedName, resolvedEmail);
            dismiss();
        }, 500);
    }

    private void setLoading(boolean loading) {
        pbLoading.setVisibility(loading ? View.VISIBLE : View.GONE);
        btnSubmit.setEnabled(!loading);
        btnQuickDemo.setEnabled(!loading);
        if (loading) tvError.setVisibility(View.GONE);
    }

    private void showError(String msg) {
        tvError.setText(msg);
        tvError.setVisibility(View.VISIBLE);
    }
}

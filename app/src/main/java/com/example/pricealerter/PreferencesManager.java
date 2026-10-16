package com.example.pricealerter;

import android.content.Context;
import android.content.SharedPreferences;

public class PreferencesManager {
    private static final String PREF_NAME = "pricealerter_prefs";
    private static final String KEY_SERVER_MODE = "server_mode";
    private static final String KEY_CUSTOM_URL = "custom_url";
    private static final String KEY_NOTIFICATIONS_ENABLED = "notifications_enabled";

    public static final String MODE_CLOUD = "cloud";
    public static final String MODE_LOCAL = "local";
    public static final String MODE_CUSTOM = "custom";

    public static final String DEFAULT_CLOUD_URL = "https://pricealerter.in";
    public static final String DEFAULT_LOCAL_URL = "http://10.0.2.2:8081";

    private final SharedPreferences prefs;

    public PreferencesManager(Context context) {
        this.prefs = context.getApplicationContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
    }

    public String getServerMode() {
        return prefs.getString(KEY_SERVER_MODE, MODE_LOCAL);
    }

    public void setServerMode(String mode) {
        prefs.edit().putString(KEY_SERVER_MODE, mode).apply();
    }

    public String getCustomUrl() {
        return prefs.getString(KEY_CUSTOM_URL, DEFAULT_LOCAL_URL);
    }

    public void setCustomUrl(String url) {
        prefs.edit().putString(KEY_CUSTOM_URL, url).apply();
    }

    public String getBaseServerUrl() {
        String mode = getServerMode();
        switch (mode) {
            case MODE_LOCAL:
                return DEFAULT_LOCAL_URL;
            case MODE_CUSTOM:
                String custom = getCustomUrl();
                return (custom != null && !custom.trim().isEmpty()) ? custom.trim() : DEFAULT_CLOUD_URL;
            case MODE_CLOUD:
            default:
                return DEFAULT_CLOUD_URL;
        }
    }

    public boolean isNotificationsEnabled() {
        return prefs.getBoolean(KEY_NOTIFICATIONS_ENABLED, true);
    }

    public void setNotificationsEnabled(boolean enabled) {
        prefs.edit().putBoolean(KEY_NOTIFICATIONS_ENABLED, enabled).apply();
    }

    // User Session Management
    public boolean isLoggedIn() {
        return prefs.getInt("user_id", -1) != -1;
    }

    public int getUserId() {
        return prefs.getInt("user_id", -1);
    }

    public String getUsername() {
        return prefs.getString("username", "Guest User");
    }

    public String getUserEmail() {
        return prefs.getString("user_email", "guest@pricealerter.in");
    }

    public String getUserPhone() {
        return prefs.getString("user_phone", "+91 98765 43210");
    }

    public boolean isEmailVerified() {
        return prefs.getBoolean("email_verified", true);
    }

    public boolean isPhoneVerified() {
        return prefs.getBoolean("phone_verified", false);
    }

    public String getMemberSince() {
        return prefs.getString("member_since", "October 2024");
    }

    public void saveUserSession(int userId, String username, String email) {
        saveUserSession(userId, username, email, "+91 98765 43210", true, false);
    }

    public void saveUserSession(int userId, String username, String email, String phone, boolean emailVerified, boolean phoneVerified) {
        prefs.edit()
                .putInt("user_id", userId)
                .putString("username", username)
                .putString("user_email", email)
                .putString("user_phone", phone != null ? phone : "")
                .putBoolean("email_verified", emailVerified)
                .putBoolean("phone_verified", phoneVerified)
                .putString("member_since", "October 2024")
                .apply();
    }

    public void clearUserSession() {
        prefs.edit()
                .remove("user_id")
                .remove("username")
                .remove("user_email")
                .remove("user_phone")
                .remove("email_verified")
                .remove("phone_verified")
                .apply();
    }
}

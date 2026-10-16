package com.example.pricealerter;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class TrackerRepository {
    private static final String PREF_TRACKERS = "pricealerter_trackers_cache";
    private static final String KEY_ITEMS_JSON = "items_json";

    private final Context context;
    private final PreferencesManager prefs;
    private final SharedPreferences localPrefs;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    public interface RepositoryCallback<T> {
        void onSuccess(T result);
        void onError(String error);
    }

    public TrackerRepository(Context context) {
        this.context = context.getApplicationContext();
        this.prefs = new PreferencesManager(context);
        this.localPrefs = context.getSharedPreferences(PREF_TRACKERS, Context.MODE_PRIVATE);

        // Seed with sample trackers if clean install
        if (!localPrefs.contains(KEY_ITEMS_JSON)) {
            seedInitialTrackers();
        }
    }

    private void seedInitialTrackers() {
        List<TrackerItem> seedList = new ArrayList<>();
        seedList.add(new TrackerItem(
                101,
                "https://www.amazon.in/dp/B0CHX1W1XY",
                "Apple iPhone 15 (128 GB) - Blue",
                65999.0,
                59999.0,
                "INR",
                "₹",
                "Amazon",
                "Just now",
                0
        ));
        seedList.add(new TrackerItem(
                102,
                "https://www.flipkart.com/apple-macbook-air-m2",
                "Apple MacBook Air M2 - 8GB/256GB SSD",
                89900.0,
                79999.0,
                "INR",
                "₹",
                "Flipkart",
                "1 hour ago",
                0
        ));
        seedList.add(new TrackerItem(
                103,
                "https://www.myntra.com/shoes/nike/nike-air-max",
                "Nike Air Max Impact 4 Basketball Shoes",
                3799.0,
                3999.0,
                "INR",
                "₹",
                "Myntra",
                "Today",
                1
        ));
        saveLocalTrackers(seedList);
    }

    public List<TrackerItem> getCachedTrackers() {
        String json = localPrefs.getString(KEY_ITEMS_JSON, "[]");
        List<TrackerItem> items = new ArrayList<>();
        try {
            JSONArray arr = new JSONArray(json);
            for (int i = 0; i < arr.length(); i++) {
                items.add(TrackerItem.fromJson(arr.getJSONObject(i)));
            }
        } catch (Exception ignored) {}
        return items;
    }

    public void saveLocalTrackers(List<TrackerItem> items) {
        JSONArray arr = new JSONArray();
        for (TrackerItem item : items) {
            arr.put(item.toJson());
        }
        localPrefs.edit().putString(KEY_ITEMS_JSON, arr.toString()).apply();
    }

    public void fetchTrackers(RepositoryCallback<List<TrackerItem>> callback) {
        String baseUrl = prefs.getBaseServerUrl();
        String endpoint = baseUrl + (baseUrl.endsWith("/") ? "api/trackers" : "/api/trackers");

        executor.execute(() -> {
            try {
                URL url = new URL(endpoint);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(8000);
                conn.setReadTimeout(8000);
                if (prefs.isLoggedIn()) {
                    conn.setRequestProperty("X-User-Id", String.valueOf(prefs.getUserId()));
                }

                int code = conn.getResponseCode();
                if (code >= 200 && code < 300) {
                    BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) sb.append(line);
                    reader.close();

                    JSONArray arr = new JSONArray(sb.toString());
                    List<TrackerItem> remoteItems = new ArrayList<>();
                    for (int i = 0; i < arr.length(); i++) {
                        remoteItems.add(TrackerItem.fromJson(arr.getJSONObject(i)));
                    }

                    if (!remoteItems.isEmpty()) {
                        saveLocalTrackers(remoteItems);
                    }

                    List<TrackerItem> finalItems = remoteItems.isEmpty() ? getCachedTrackers() : remoteItems;
                    mainHandler.post(() -> callback.onSuccess(finalItems));
                } else {
                    mainHandler.post(() -> callback.onSuccess(getCachedTrackers()));
                }
            } catch (Exception e) {
                // Return cached items on network failure
                mainHandler.post(() -> callback.onSuccess(getCachedTrackers()));
            }
        });
    }

    public void addTracker(TrackerItem item, RepositoryCallback<TrackerItem> callback) {
        List<TrackerItem> localList = getCachedTrackers();
        localList.add(0, item);
        saveLocalTrackers(localList);

        String baseUrl = prefs.getBaseServerUrl();
        String endpoint = baseUrl + (baseUrl.endsWith("/") ? "api/trackers" : "/api/trackers");

        executor.execute(() -> {
            try {
                URL url = new URL(endpoint);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setConnectTimeout(8000);
                conn.setDoOutput(true);

                if (prefs.isLoggedIn()) {
                    conn.setRequestProperty("X-User-Id", String.valueOf(prefs.getUserId()));
                }

                JSONObject obj = new JSONObject();
                obj.put("url", item.getUrl());
                obj.put("productName", item.getProductName());
                obj.put("currentPrice", item.getCurrentPrice());
                obj.put("targetPrice", item.getTargetPrice());
                obj.put("currency", item.getCurrency());
                obj.put("currencySymbol", item.getCurrencySymbol());

                try (OutputStream os = conn.getOutputStream()) {
                    os.write(obj.toString().getBytes(StandardCharsets.UTF_8));
                }

                int code = conn.getResponseCode();
                mainHandler.post(() -> callback.onSuccess(item));
            } catch (Exception e) {
                mainHandler.post(() -> callback.onSuccess(item));
            }
        });
    }

    public void deleteTracker(int id, RepositoryCallback<Boolean> callback) {
        List<TrackerItem> localList = getCachedTrackers();
        TrackerItem toRemove = null;
        for (TrackerItem item : localList) {
            if (item.getId() == id) {
                toRemove = item;
                break;
            }
        }
        if (toRemove != null) {
            localList.remove(toRemove);
            saveLocalTrackers(localList);
        }

        String baseUrl = prefs.getBaseServerUrl();
        String endpoint = baseUrl + (baseUrl.endsWith("/") ? "api/trackers" : "/api/trackers");

        executor.execute(() -> {
            try {
                URL url = new URL(endpoint);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("DELETE");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setConnectTimeout(6000);
                conn.setDoOutput(true);

                JSONObject obj = new JSONObject();
                obj.put("id", id);
                try (OutputStream os = conn.getOutputStream()) {
                    os.write(obj.toString().getBytes(StandardCharsets.UTF_8));
                }
                int code = conn.getResponseCode();
                mainHandler.post(() -> callback.onSuccess(true));
            } catch (Exception e) {
                mainHandler.post(() -> callback.onSuccess(true));
            }
        });
    }
}

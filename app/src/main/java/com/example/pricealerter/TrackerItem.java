package com.example.pricealerter;

import org.json.JSONObject;

public class TrackerItem {
    private int id;
    private String url;
    private String productName;
    private double currentPrice;
    private double targetPrice;
    private String currency;
    private String currencySymbol;
    private String site;
    private String createdAt;
    private int alertSent;

    public TrackerItem(int id, String url, String productName, double currentPrice, double targetPrice, String currency, String currencySymbol, String site, String createdAt, int alertSent) {
        this.id = id;
        this.url = url;
        this.productName = productName != null ? productName : "Tracked Product";
        this.currentPrice = currentPrice;
        this.targetPrice = targetPrice;
        this.currency = currency != null ? currency : "INR";
        this.currencySymbol = currencySymbol != null ? currencySymbol : "₹";
        this.site = site != null ? site : detectSite(url);
        this.createdAt = createdAt;
        this.alertSent = alertSent;
    }

    public static String detectSite(String url) {
        if (url == null) return "Store";
        String lower = url.toLowerCase();
        if (lower.contains("amazon")) return "Amazon";
        if (lower.contains("flipkart")) return "Flipkart";
        if (lower.contains("myntra")) return "Myntra";
        if (lower.contains("ajio")) return "Ajio";
        if (lower.contains("meesho")) return "Meesho";
        return "Online Store";
    }

    public static TrackerItem fromJson(JSONObject obj) {
        int id = obj.optInt("id", (int) System.currentTimeMillis());
        String url = obj.optString("url", "");
        String name = obj.optString("productName", "Product");
        double currentPrice = obj.optDouble("currentPrice", 0.0);
        double targetPrice = obj.optDouble("targetPrice", 0.0);
        String currency = obj.optString("currency", "INR");
        String currencySymbol = obj.optString("currencySymbol", "₹");
        String site = obj.optString("site", detectSite(url));
        String createdAt = obj.optString("createdAt", "");
        int alertSent = obj.optInt("alertSent", 0);

        return new TrackerItem(id, url, name, currentPrice, targetPrice, currency, currencySymbol, site, createdAt, alertSent);
    }

    public JSONObject toJson() {
        JSONObject obj = new JSONObject();
        try {
            obj.put("id", id);
            obj.put("url", url);
            obj.put("productName", productName);
            obj.put("currentPrice", currentPrice);
            obj.put("targetPrice", targetPrice);
            obj.put("currency", currency);
            obj.put("currencySymbol", currencySymbol);
            obj.put("site", site);
            obj.put("createdAt", createdAt);
            obj.put("alertSent", alertSent);
        } catch (Exception ignored) {}
        return obj;
    }

    public boolean isTargetMet() {
        return currentPrice > 0 && targetPrice > 0 && currentPrice <= targetPrice;
    }

    public int getDiscountPercent() {
        if (targetPrice > 0 && currentPrice > targetPrice) {
            return (int) Math.round(((currentPrice - targetPrice) / currentPrice) * 100);
        }
        return 0;
    }

    public String getChangeText() {
        if (targetPrice > 0 && currentPrice > 0) {
            double pct = ((targetPrice - currentPrice) / targetPrice) * 100.0;
            if (pct >= 0) {
                return String.format(java.util.Locale.US, "↓ %.1f%%", Math.abs(pct));
            } else {
                return String.format(java.util.Locale.US, "↑ %.1f%%", Math.abs(pct));
            }
        }
        return "↓ 1.2%";
    }

    public boolean isPriceDrop() {
        return getChangeText().startsWith("↓");
    }

    public String getStatusBadgeText() {
        if (isTargetMet()) {
            return "Below Target 🎯";
        }
        if (targetPrice > 0 && currentPrice > targetPrice) {
            double diff = (currentPrice - targetPrice) / targetPrice;
            if (diff > 0.05) return "Price Up";
        }
        return "Tracking";
    }

    public int getThumbResId() {
        String lower = (productName != null ? productName : "").toLowerCase();
        if (lower.contains("shoe") || lower.contains("skechers") || lower.contains("sneaker") || lower.contains("nike") || lower.contains("puma") || lower.contains("footwear") || lower.contains("summits")) {
            return R.drawable.ic_prod_shoe;
        }
        if (lower.contains("iphone") || lower.contains("phone") || lower.contains("mobile") || lower.contains("galaxy")) return R.drawable.ic_prod_iphone;
        if (lower.contains("sony") || lower.contains("headphone") || lower.contains("earbud") || lower.contains("audio") || lower.contains("boat")) return R.drawable.ic_prod_sony;
        if (lower.contains("tv") || lower.contains("samsung") || lower.contains("television")) return R.drawable.ic_prod_tv;
        if (lower.contains("watch") || lower.contains("band")) return R.drawable.ic_prod_watch;
        return R.drawable.ic_prod_iphone;
    }

    // Getters and Setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getUrl() { return url; }
    public String getProductName() { return productName; }
    public double getCurrentPrice() { return currentPrice; }
    public void setCurrentPrice(double currentPrice) { this.currentPrice = currentPrice; }
    public double getTargetPrice() { return targetPrice; }
    public void setTargetPrice(double targetPrice) { this.targetPrice = targetPrice; }
    public String getCurrency() { return currency; }
    public String getCurrencySymbol() { return currencySymbol; }
    public String getSite() { return site; }
    public String getCreatedAt() { return createdAt; }
    public int getAlertSent() { return alertSent; }
    public void setAlertSent(int alertSent) { this.alertSent = alertSent; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public void setLastChecked(String lastChecked) { this.createdAt = lastChecked; }
}

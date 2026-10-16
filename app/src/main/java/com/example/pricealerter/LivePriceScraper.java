package com.example.pricealerter;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.GZIPInputStream;

public class LivePriceScraper {

    public static class ScrapedProduct {
        public final String name;
        public final double price;
        public final String site;
        public final String currencySymbol;
        public final boolean isSuccess;

        public ScrapedProduct(String name, double price, String site, String currencySymbol, boolean isSuccess) {
            this.name = name;
            this.price = price;
            this.site = site;
            this.currencySymbol = currencySymbol != null ? currencySymbol : "₹";
            this.isSuccess = isSuccess;
        }
    }

    private static final String MOBILE_SAFARI_UA =
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1";

    public static ScrapedProduct scrapeDirectly(String productUrl) {
        String site = TrackerItem.detectSite(productUrl);
        String detectedName = site + " Product";
        double detectedPrice = 0.0;

        try {
            URL url = new URL(productUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("User-Agent", MOBILE_SAFARI_UA);
            conn.setRequestProperty("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
            conn.setRequestProperty("Accept-Language", "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7");
            conn.setRequestProperty("Accept-Encoding", "gzip, deflate");
            conn.setRequestProperty("Connection", "keep-alive");
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(12000);
            conn.setInstanceFollowRedirects(true);

            int responseCode = conn.getResponseCode();
            if (responseCode >= 200 && responseCode < 400) {
                InputStream is = conn.getInputStream();
                String encoding = conn.getHeaderField("Content-Encoding");
                if (encoding != null && encoding.equalsIgnoreCase("gzip")) {
                    is = new GZIPInputStream(is);
                }

                BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
                StringBuilder htmlBuilder = new StringBuilder();
                String line;
                int linesRead = 0;
                // Read up to 8000 lines to avoid excessive memory while capturing main DOM
                while ((line = reader.readLine()) != null && linesRead < 8000) {
                    htmlBuilder.append(line).append("\n");
                    linesRead++;
                }
                reader.close();

                String html = htmlBuilder.toString();

                // 1. Extract Product Title
                String title = extractTitle(html);
                if (title != null && !title.isEmpty()) {
                    detectedName = cleanTitle(title, site);
                }

                // 2. Extract Exact Price
                detectedPrice = extractPrice(html, site);
            }
        } catch (Exception ignored) {
        }

        boolean success = detectedPrice > 0;
        return new ScrapedProduct(detectedName, detectedPrice, site, "₹", success);
    }

    private static String extractTitle(String html) {
        // Try OpenGraph title
        Pattern ogPattern = Pattern.compile("<meta\\s+(?:property|name)=[\"'](?:og:title|twitter:title)[\"']\\s+content=[\"']([^\"']+)[\"']", Pattern.CASE_INSENSITIVE);
        Matcher ogMatcher = ogPattern.matcher(html);
        if (ogMatcher.find()) {
            return decodeHtmlEntities(ogMatcher.group(1).trim());
        }

        // Try HTML <title>
        Pattern titlePattern = Pattern.compile("<title[^>]*>([^<]+)</title>", Pattern.CASE_INSENSITIVE);
        Matcher titleMatcher = titlePattern.matcher(html);
        if (titleMatcher.find()) {
            return decodeHtmlEntities(titleMatcher.group(1).trim());
        }

        return null;
    }

    private static String cleanTitle(String rawTitle, String site) {
        if (rawTitle == null) return site + " Product";
        String clean = rawTitle;
        clean = clean.replaceAll("(?i)\\s*[-|:]\\s*(Amazon(?:\\.in)?|Flipkart|Myntra|Ajio|Meesho|Snapdeal|Online Shopping.*)$", "");
        clean = clean.replaceAll("(?i)^Buy\\s+", "");
        clean = clean.replaceAll("(?i)\\s+Online at (?:Best|Lowest) Prices?.*$", "");
        clean = clean.replaceAll("\\s+", " ").trim();
        return clean.isEmpty() ? site + " Product" : clean;
    }

    private static double extractPrice(String html, String site) {
        // Amazon specific selectors in mobile DOM
        if ("Amazon".equalsIgnoreCase(site)) {
            // Whole price
            Pattern p1 = Pattern.compile("class=[\"'][^\"']*a-price-whole[^\"']*[\"'][^>]*>\\s*([0-9,.]+)", Pattern.CASE_INSENSITIVE);
            Matcher m1 = p1.matcher(html);
            if (m1.find()) {
                double val = parseNumericPrice(m1.group(1));
                if (val > 0) return val;
            }

            // Offscreen price
            Pattern p2 = Pattern.compile("class=[\"'][^\"']*a-offscreen[^\"']*[\"'][^>]*>\\s*₹?\\s*([0-9,.]+)", Pattern.CASE_INSENSITIVE);
            Matcher m2 = p2.matcher(html);
            if (m2.find()) {
                double val = parseNumericPrice(m2.group(1));
                if (val > 0) return val;
            }

            // apexPriceToPay
            Pattern p3 = Pattern.compile("apexPriceToPay[^>]*>.*?₹?\\s*([0-9,.]+)", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
            Matcher m3 = p3.matcher(html);
            if (m3.find()) {
                double val = parseNumericPrice(m3.group(1));
                if (val > 0) return val;
            }
        }

        // Flipkart specific selectors
        if ("Flipkart".equalsIgnoreCase(site)) {
            Pattern fp = Pattern.compile("class=[\"'][^\"']*(?:Nx9bqj|_30jeq3)[^\"']*[\"'][^>]*>\\s*₹?\\s*([0-9,.]+)", Pattern.CASE_INSENSITIVE);
            Matcher fm = fp.matcher(html);
            if (fm.find()) {
                double val = parseNumericPrice(fm.group(1));
                if (val > 0) return val;
            }
        }

        // Myntra specific selectors
        if ("Myntra".equalsIgnoreCase(site)) {
            Pattern mp = Pattern.compile("class=[\"'][^\"']*pdp-price[^\"']*[\"'][^>]*>.*?₹?\\s*([0-9,.]+)", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
            Matcher mm = mp.matcher(html);
            if (mm.find()) {
                double val = parseNumericPrice(mm.group(1));
                if (val > 0) return val;
            }
        }

        // Ajio specific selectors
        if ("Ajio".equalsIgnoreCase(site)) {
            Pattern ap = Pattern.compile("class=[\"'][^\"']*prod-sp[^\"']*[\"'][^>]*>\\s*₹?\\s*([0-9,.]+)", Pattern.CASE_INSENSITIVE);
            Matcher am = ap.matcher(html);
            if (am.find()) {
                double val = parseNumericPrice(am.group(1));
                if (val > 0) return val;
            }
        }

        // JSON-LD schema / metadata (works on Amazon, Flipkart, Myntra, etc.)
        Pattern jsonLdPrice = Pattern.compile("[\"'](?:price|lowPrice)[\"']\\s*:\\s*[\"']?([0-9,.]+)[\"']?", Pattern.CASE_INSENSITIVE);
        Matcher jm = jsonLdPrice.matcher(html);
        while (jm.find()) {
            double val = parseNumericPrice(jm.group(1));
            if (val >= 10.0 && val <= 2000000.0) {
                return val;
            }
        }

        // OpenGraph product:price:amount
        Pattern ogPrice = Pattern.compile("<meta\\s+property=[\"']product:price:amount[\"']\\s+content=[\"']([0-9,.]+)[\"']", Pattern.CASE_INSENSITIVE);
        Matcher ogm = ogPrice.matcher(html);
        if (ogm.find()) {
            double val = parseNumericPrice(ogm.group(1));
            if (val > 0) return val;
        }

        // Generic Indian Rupee price pattern
        Pattern inrPattern = Pattern.compile("₹\\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\\.[0-9]{1,2})?)");
        Matcher inrMatcher = inrPattern.matcher(html);
        if (inrMatcher.find()) {
            double val = parseNumericPrice(inrMatcher.group(1));
            if (val >= 10.0 && val <= 2000000.0) {
                return val;
            }
        }

        return 0.0;
    }

    public static double parseNumericPrice(String rawPrice) {
        if (rawPrice == null) return 0.0;
        String cleaned = rawPrice.replaceAll("[^0-9.]", "").trim();
        // Remove trailing dot if any
        if (cleaned.endsWith(".")) {
            cleaned = cleaned.substring(0, cleaned.length() - 1);
        }
        try {
            return Double.parseDouble(cleaned);
        } catch (Exception e) {
            return 0.0;
        }
    }

    private static String decodeHtmlEntities(String input) {
        if (input == null) return "";
        return input.replace("&amp;", "&")
                .replace("&quot;", "\"")
                .replace("&#39;", "'")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&#x27;", "'")
                .replace("&nbsp;", " ");
    }
}

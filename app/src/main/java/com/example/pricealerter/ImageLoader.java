package com.example.pricealerter;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Handler;
import android.os.Looper;
import android.util.LruCache;
import android.widget.ImageView;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ImageLoader {
    private static final int CACHE_SIZE = (int) (Runtime.getRuntime().maxMemory() / 1024 / 8);
    private static final LruCache<String, Bitmap> memoryCache = new LruCache<String, Bitmap>(CACHE_SIZE) {
        @Override
        protected int sizeOf(String key, Bitmap bitmap) {
            return bitmap.getByteCount() / 1024;
        }
    };

    private static final ExecutorService executor = Executors.newFixedThreadPool(4);
    private static final Handler mainHandler = new Handler(Looper.getMainLooper());

    public static void load(final ImageView imageView, final String imageUrl, final int placeholderResId) {
        if (imageView == null) return;

        if (imageUrl == null || imageUrl.trim().isEmpty() || (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://"))) {
            if (placeholderResId != 0) {
                imageView.setImageResource(placeholderResId);
            }
            return;
        }

        final String cleanUrl = imageUrl.trim();

        // Check memory cache first
        Bitmap cached = memoryCache.get(cleanUrl);
        if (cached != null && !cached.isRecycled()) {
            imageView.setImageBitmap(cached);
            return;
        }

        // Set placeholder while loading
        if (placeholderResId != 0) {
            imageView.setImageResource(placeholderResId);
        }

        imageView.setTag(cleanUrl);

        executor.execute(() -> {
            Bitmap downloaded = downloadBitmap(cleanUrl);
            if (downloaded != null) {
                memoryCache.put(cleanUrl, downloaded);
                mainHandler.post(() -> {
                    Object tag = imageView.getTag();
                    if (cleanUrl.equals(tag)) {
                        imageView.setImageBitmap(downloaded);
                    }
                });
            }
        });
    }

    private static Bitmap downloadBitmap(String srcUrl) {
        HttpURLConnection conn = null;
        InputStream is = null;
        try {
            URL url = new URL(srcUrl);
            conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(6000);
            conn.setReadTimeout(6000);
            conn.setInstanceFollowRedirects(true);
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14; Mobile) PriceAlerter/2.0");
            conn.connect();

            int code = conn.getResponseCode();
            if (code == HttpURLConnection.HTTP_OK) {
                is = conn.getInputStream();
                BitmapFactory.Options opts = new BitmapFactory.Options();
                opts.inPreferredConfig = Bitmap.Config.RGB_565;
                return BitmapFactory.decodeStream(is, null, opts);
            }
        } catch (Exception ignored) {
        } finally {
            try {
                if (is != null) is.close();
            } catch (Exception ignored) {}
            if (conn != null) conn.disconnect();
        }
        return null;
    }
}

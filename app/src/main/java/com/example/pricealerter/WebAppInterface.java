package com.example.pricealerter;

import android.content.Context;
import android.content.Intent;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

public class WebAppInterface {
    private final Context context;

    public WebAppInterface(Context context) {
        this.context = context;
    }

    @JavascriptInterface
    public void showToast(String message) {
        if (message != null && !message.isEmpty()) {
            Toast.makeText(context, message, Toast.LENGTH_SHORT).show();
        }
    }

    @JavascriptInterface
    public void triggerPriceDropAlert(String title, String message, String url) {
        NotificationHelper.sendPriceAlert(context, title, message, url);
    }

    @JavascriptInterface
    public void shareUrl(String title, String url) {
        Intent sendIntent = new Intent();
        sendIntent.setAction(Intent.ACTION_SEND);
        sendIntent.putExtra(Intent.EXTRA_TEXT, (title != null ? title + " : " : "") + url);
        sendIntent.setType("text/plain");
        Intent shareIntent = Intent.createChooser(sendIntent, "Share Product");
        shareIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(shareIntent);
    }

    @JavascriptInterface
    public void openQuickAdd(String url) {
        Intent intent = new Intent(context, QuickAddActivity.class);
        if (url != null && !url.isEmpty()) {
            intent.putExtra(QuickAddActivity.EXTRA_PRODUCT_URL, url);
        }
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);
    }
}

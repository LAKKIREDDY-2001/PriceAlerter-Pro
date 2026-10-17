package com.example.pricealerter;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import java.util.Locale;

public class NotificationHelper {
    public static final String CHANNEL_ID = "price_alerts_channel";
    private static final String CHANNEL_NAME = "Price Drop Alerts";
    private static final String CHANNEL_DESC = "Instant notifications and alarms when tracked items drop in price";

    public static void createNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    CHANNEL_NAME,
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription(CHANNEL_DESC);
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 600, 250, 600, 250, 1000});
            channel.enableLights(true);
            channel.setLightColor(Color.GREEN);

            Uri soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            if (soundUri == null) {
                soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            }
            if (soundUri != null) {
                AudioAttributes audioAttributes = new AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION_EVENT)
                        .build();
                channel.setSound(soundUri, audioAttributes);
            }

            NotificationManager manager = context.getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    public static void playAlarmSound(Context context) {
        try {
            Uri alertUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            if (alertUri == null) {
                alertUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            }
            if (alertUri != null) {
                Ringtone r = RingtoneManager.getRingtone(context.getApplicationContext(), alertUri);
                if (r != null) {
                    r.play();
                }
            }

            android.os.Vibrator v = (android.os.Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
            if (v != null && v.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    v.vibrate(android.os.VibrationEffect.createWaveform(new long[]{0, 500, 200, 500, 200, 800}, -1));
                } else {
                    v.vibrate(new long[]{0, 500, 200, 500, 200, 800}, -1);
                }
            }
        } catch (Exception ignored) {}
    }

    public static void sendTargetAddedAlert(Context context, String productName, double targetPrice, String currencySymbol, String productUrl) {
        String sym = currencySymbol != null ? currencySymbol : "₹";
        String title = "🔔 Price Tracker Activated: " + productName;
        String message = "Target set to " + sym + String.format(Locale.US, "%,.0f", targetPrice) + ". We're actively tracking live prices and will sound an alarm when it drops!";
        sendPriceAlert(context, title, message, productUrl);
    }

    public static void sendTargetReachedAlert(Context context, String productName, double currentPrice, double targetPrice, String currencySymbol, String productUrl) {
        String sym = currencySymbol != null ? currencySymbol : "₹";
        String title = "🎉 TARGET PRICE REACHED! 🚀";
        String message = productName + " reached your target of " + sym + String.format(Locale.US, "%,.0f", targetPrice) + "! Live price: " + sym + String.format(Locale.US, "%,.0f", currentPrice) + ". Tap to buy now!";
        sendPriceAlert(context, title, message, productUrl);
    }

    public static void sendPriceAlert(Context context, String title, String message, String productUrl) {
        PreferencesManager prefs = new PreferencesManager(context);
        if (!prefs.isNotificationsEnabled()) {
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(context, android.Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                return;
            }
        }

        createNotificationChannel(context);
        playAlarmSound(context);

        Intent intent;
        if (productUrl != null && !productUrl.trim().isEmpty()) {
            intent = new Intent(Intent.ACTION_VIEW, Uri.parse(productUrl));
        } else {
            intent = new Intent(context, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        }

        int reqCode = (int) (System.currentTimeMillis() & 0x7FFFFFFF);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                reqCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        Uri soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        if (soundUri == null) {
            soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_bell)
                .setContentTitle(title)
                .setContentText(message)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(message))
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setVibrate(new long[]{0, 600, 250, 600, 250, 1000})
                .setLights(Color.GREEN, 500, 500)
                .setSound(soundUri)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent);

        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify(reqCode, builder.build());
        }
    }
}

package com.example.pricealerter;

import android.animation.ObjectAnimator;
import android.animation.PropertyValuesHolder;
import android.content.Context;
import android.content.Intent;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.View;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;

import com.google.android.material.bottomsheet.BottomSheetDialog;
import com.google.android.material.button.MaterialButton;

import java.util.Locale;

public class CelebrationDialog extends BottomSheetDialog {

    private final TrackerItem item;

    public CelebrationDialog(@NonNull Context context, TrackerItem item) {
        super(context);
        this.item = item;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.dialog_celebration);

        ConfettiView confettiView = findViewById(R.id.confettiView);
        View trophyContainer = findViewById(R.id.trophyContainer);
        TextView tvSite = findViewById(R.id.tvCelebSiteBadge);
        TextView tvName = findViewById(R.id.tvCelebProductName);
        TextView tvCurrent = findViewById(R.id.tvCelebCurrentPrice);
        TextView tvTarget = findViewById(R.id.tvCelebTargetPrice);
        TextView tvSavings = findViewById(R.id.tvCelebSavings);
        MaterialButton btnBuyNow = findViewById(R.id.btnCelebBuyNow);
        MaterialButton btnShare = findViewById(R.id.btnCelebShare);
        MaterialButton btnDismiss = findViewById(R.id.btnCelebDismiss);

        if (item != null) {
            String symbol = item.getCurrencySymbol() != null ? item.getCurrencySymbol() : "₹";
            if (tvSite != null) tvSite.setText(item.getSite());
            if (tvName != null) tvName.setText(item.getProductName());
            if (tvCurrent != null) tvCurrent.setText(symbol + String.format(Locale.US, "%,.2f", item.getCurrentPrice()));
            if (tvTarget != null) tvTarget.setText(symbol + String.format(Locale.US, "%,.2f", item.getTargetPrice()));

            double savings = Math.max(0, item.getTargetPrice() - item.getCurrentPrice());
            if (savings <= 0 && item.getCurrentPrice() > 0) {
                // If it reached target, show savings from target or standard 10%
                savings = item.getCurrentPrice() * 0.10;
            }
            int percent = item.getDiscountPercent();
            if (percent <= 0) percent = 10;

            if (tvSavings != null) {
                tvSavings.setText("💰 You Save " + symbol + String.format(Locale.US, "%,.2f", savings) + " (" + percent + "% Target Reached)");
            }

            if (btnBuyNow != null) {
                btnBuyNow.setText("🛒 Buy Now on " + item.getSite());
                btnBuyNow.setOnClickListener(v -> {
                    String url = item.getUrl();
                    if (url != null && (url.startsWith("http://") || url.startsWith("https://"))) {
                        try {
                            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                            getContext().startActivity(intent);
                        } catch (Exception e) {
                            Toast.makeText(getContext(), "Could not open URL", Toast.LENGTH_SHORT).show();
                        }
                    }
                    dismiss();
                });
            }

            if (btnShare != null) {
                btnShare.setOnClickListener(v -> {
                    String shareText = "🎉 Price Alert Reached!\n\n" +
                            item.getProductName() + "\n" +
                            "Current Price: " + symbol + String.format(Locale.US, "%,.2f", item.getCurrentPrice()) + "\n" +
                            "Check it out here: " + item.getUrl() + "\n\n" +
                            "Tracked with Price Alerter";
                    Intent shareIntent = new Intent(Intent.ACTION_SEND);
                    shareIntent.setType("text/plain");
                    shareIntent.putExtra(Intent.EXTRA_SUBJECT, "Price Alert Reached!");
                    shareIntent.putExtra(Intent.EXTRA_TEXT, shareText);
                    getContext().startActivity(Intent.createChooser(shareIntent, "Share Deal"));
                });
            }
        }

        if (btnDismiss != null) {
            btnDismiss.setOnClickListener(v -> dismiss());
        }

        // 1. Start Confetti Animation
        if (confettiView != null) {
            confettiView.post(() -> confettiView.startConfetti());
        }

        // 2. Animate Trophy Pulse
        if (trophyContainer != null) {
            PropertyValuesHolder scaleX = PropertyValuesHolder.ofFloat(View.SCALE_X, 0.8f, 1.15f, 1.0f);
            PropertyValuesHolder scaleY = PropertyValuesHolder.ofFloat(View.SCALE_Y, 0.8f, 1.15f, 1.0f);
            ObjectAnimator animator = ObjectAnimator.ofPropertyValuesHolder(trophyContainer, scaleX, scaleY);
            animator.setDuration(800);
            animator.setRepeatCount(1);
            animator.setRepeatMode(ObjectAnimator.REVERSE);
            animator.start();
        }

        // 3. Play Sound & Vibration
        triggerCelebrationFeedback();

        setOnDismissListener(dialog -> {
            if (confettiView != null) {
                confettiView.stopConfetti();
            }
        });
    }

    private void triggerCelebrationFeedback() {
        try {
            // Sound feedback
            Uri notificationSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            Ringtone r = RingtoneManager.getRingtone(getContext(), notificationSound);
            if (r != null) {
                r.play();
            }
        } catch (Exception ignored) {
        }

        try {
            // Haptic celebration vibration pattern
            Vibrator vibrator = (Vibrator) getContext().getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createWaveform(new long[]{0, 80, 50, 120, 60, 200}, -1));
                } else {
                    vibrator.vibrate(new long[]{0, 80, 50, 120, 60, 200}, -1);
                }
            }
        } catch (Exception ignored) {
        }
    }
}

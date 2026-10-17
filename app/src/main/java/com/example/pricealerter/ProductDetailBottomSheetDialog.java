package com.example.pricealerter;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;

import com.google.android.material.bottomsheet.BottomSheetDialog;
import com.google.android.material.button.MaterialButton;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class ProductDetailBottomSheetDialog extends BottomSheetDialog {

    private final TrackerItem item;

    public ProductDetailBottomSheetDialog(@NonNull Context context, TrackerItem item) {
        super(context);
        this.item = item;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.dialog_product_detail);

        if (item == null) return;

        ImageView ivThumb = findViewById(R.id.ivDetailThumb);
        TextView tvTitle = findViewById(R.id.tvDetailTitle);
        ImageView ivStoreLogo = findViewById(R.id.ivDetailStoreLogo);
        TextView tvStoreName = findViewById(R.id.tvDetailStoreName);
        TextView tvCurrentPrice = findViewById(R.id.tvDetailCurrentPrice);
        TextView tvTargetPrice = findViewById(R.id.tvDetailTargetPrice);
        TextView tvPercentBadge = findViewById(R.id.tvDetailPercentBadge);
        ProgressBar pbProgress = findViewById(R.id.pbDetailTargetProgress);
        TextView tvProgressSub = findViewById(R.id.tvDetailProgressSub);
        StockPriceChartView chart = findViewById(R.id.chartDetailStock);

        TextView tvLowest = findViewById(R.id.tvDetailLowest);
        TextView tvAverage = findViewById(R.id.tvDetailAverage);
        TextView tvHighest = findViewById(R.id.tvDetailHighest);
        TextView tvLastChecked = findViewById(R.id.tvDetailLastChecked);

        MaterialButton btnStoreLink = findViewById(R.id.btnDetailStoreLink);
        MaterialButton btnDismiss = findViewById(R.id.btnDetailDismiss);

        String symbol = item.getCurrencySymbol() != null ? item.getCurrencySymbol() : "₹";
        double cur = item.getCurrentPrice();
        double tgt = item.getTargetPrice();

        if (ivThumb != null) ivThumb.setImageResource(item.getThumbResId());
        if (tvTitle != null) tvTitle.setText(item.getProductName());

        String site = item.getSite() != null ? item.getSite().toLowerCase() : "";
        if (tvStoreName != null) tvStoreName.setText(item.getSite());
        if (ivStoreLogo != null) {
            if (site.contains("amazon")) ivStoreLogo.setImageResource(R.drawable.ic_store_amazon);
            else if (site.contains("flipkart")) ivStoreLogo.setImageResource(R.drawable.ic_store_flipkart);
            else if (site.contains("myntra")) ivStoreLogo.setImageResource(R.drawable.ic_store_myntra);
            else if (site.contains("ajio")) ivStoreLogo.setImageResource(R.drawable.ic_store_ajio);
            else if (site.contains("meesho")) ivStoreLogo.setImageResource(R.drawable.ic_store_meesho);
            else ivStoreLogo.setImageResource(R.drawable.ic_store_generic);
        }

        if (tvCurrentPrice != null) {
            tvCurrentPrice.setText(symbol + String.format(Locale.US, "%,.0f", cur));
        }
        if (tvTargetPrice != null) {
            tvTargetPrice.setText("Your target: " + symbol + String.format(Locale.US, "%,.0f", tgt));
        }

        // Target progress calculation
        int percent = 100;
        if (cur > 0 && tgt > 0) {
            if (cur <= tgt) {
                percent = 100;
                if (tvPercentBadge != null) {
                    tvPercentBadge.setText("Target Reached! 🎯");
                    tvPercentBadge.setBackgroundResource(R.drawable.badge_below_target);
                }
                if (tvProgressSub != null) {
                    double diff = tgt - cur;
                    tvProgressSub.setText(symbol + String.format(Locale.US, "%,.0f", diff) + " below target price!");
                }
            } else {
                percent = (int) Math.round((tgt / cur) * 100.0);
                percent = Math.max(10, Math.min(99, percent));
                if (tvPercentBadge != null) {
                    tvPercentBadge.setText(percent + "% reached");
                    tvPercentBadge.setBackgroundResource(R.drawable.badge_tracking);
                }
                if (tvProgressSub != null) {
                    double diff = cur - tgt;
                    double pctDrop = (diff / cur) * 100.0;
                    tvProgressSub.setText(symbol + String.format(Locale.US, "%,.0f", diff) + " to go (" + String.format(Locale.US, "%.1f", pctDrop) + "% lower)");
                }
            }
        }
        if (pbProgress != null) pbProgress.setProgress(percent);

        // Stats grid
        double lowest = tgt > 0 ? Math.min(cur * 0.92, tgt * 0.98) : cur * 0.92;
        double highest = cur * 1.08;
        double avg = (lowest + highest + cur) / 3.0;

        if (tvLowest != null) tvLowest.setText(symbol + String.format(Locale.US, "%,.0f", lowest));
        if (tvAverage != null) tvAverage.setText(symbol + String.format(Locale.US, "%,.0f", avg));
        if (tvHighest != null) tvHighest.setText(symbol + String.format(Locale.US, "%,.0f", highest));
        if (tvLastChecked != null) tvLastChecked.setText("Just now");

        // Chart
        if (chart != null) {
            List<Double> points = new ArrayList<>();
            points.add(highest);
            points.add(cur * 1.05);
            points.add(avg);
            points.add(cur * 1.02);
            points.add(cur);
            chart.setData(tgt, cur, symbol, points);
        }

        if (btnStoreLink != null) {
            btnStoreLink.setOnClickListener(v -> {
                String url = item.getUrl();
                if (url != null && (url.startsWith("http://") || url.startsWith("https://"))) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        getContext().startActivity(intent);
                    } catch (Exception ignored) {
                        Toast.makeText(getContext(), "Could not open URL", Toast.LENGTH_SHORT).show();
                    }
                } else {
                    Toast.makeText(getContext(), "Official product store link", Toast.LENGTH_SHORT).show();
                }
            });
        }

        if (btnDismiss != null) {
            btnDismiss.setOnClickListener(v -> dismiss());
        }
    }
}

package com.example.pricealerter;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.card.MaterialCardView;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class TrackerAdapter extends RecyclerView.Adapter<TrackerAdapter.ViewHolder> {
    private final Context context;
    private final List<TrackerItem> items = new ArrayList<>();
    private final OnItemDeleteListener deleteListener;

    public interface OnItemDeleteListener {
        void onDelete(TrackerItem item);
    }

    public TrackerAdapter(Context context, OnItemDeleteListener deleteListener) {
        this.context = context;
        this.deleteListener = deleteListener;
    }

    public void setItems(List<TrackerItem> newItems) {
        this.items.clear();
        if (newItems != null) {
            this.items.addAll(newItems);
        }
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(context).inflate(R.layout.item_tracker, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        TrackerItem item = items.get(position);

        holder.tvTitle.setText(item.getProductName());

        // Store Logo
        String site = item.getSite() != null ? item.getSite().toLowerCase() : "";
        if (site.contains("amazon")) {
            holder.ivSiteLogo.setImageResource(R.drawable.ic_store_amazon);
        } else if (site.contains("flipkart")) {
            holder.ivSiteLogo.setImageResource(R.drawable.ic_store_flipkart);
        } else if (site.contains("myntra")) {
            holder.ivSiteLogo.setImageResource(R.drawable.ic_store_myntra);
        } else if (site.contains("ajio")) {
            holder.ivSiteLogo.setImageResource(R.drawable.ic_store_ajio);
        } else if (site.contains("meesho")) {
            holder.ivSiteLogo.setImageResource(R.drawable.ic_store_meesho);
        } else {
            holder.ivSiteLogo.setImageResource(R.drawable.ic_store_generic);
        }

        // Product Thumbnail
        holder.ivThumb.setImageResource(item.getThumbResId());

        // Current & Target Prices
        String symbol = item.getCurrencySymbol() != null ? item.getCurrencySymbol() : "₹";
        holder.tvCurrentPrice.setText(symbol + String.format(Locale.US, "%,.0f", item.getCurrentPrice()));
        holder.tvTargetPrice.setText("Target: " + symbol + String.format(Locale.US, "%,.0f", item.getTargetPrice()));

        // Status Badge & Change Percentage (Matching Figma Mobile 1)
        String status = item.getStatusBadgeText();
        holder.tvStatusBadge.setText(status);

        if (status.contains("Below")) {
            holder.tvStatusBadge.setBackgroundResource(R.drawable.badge_below_target);
            holder.tvStatusBadge.setTextColor(context.getResources().getColor(R.color.accent_dark));
        } else if (status.contains("Price Up")) {
            holder.tvStatusBadge.setBackgroundResource(R.drawable.badge_price_up);
            holder.tvStatusBadge.setTextColor(context.getResources().getColor(R.color.error));
        } else {
            holder.tvStatusBadge.setBackgroundResource(R.drawable.badge_tracking);
            holder.tvStatusBadge.setTextColor(context.getResources().getColor(R.color.text_secondary));
        }

        String changeText = item.getChangeText();
        holder.tvChange.setText(changeText);
        if (item.isPriceDrop()) {
            holder.tvChange.setTextColor(context.getResources().getColor(R.color.accent));
        } else {
            holder.tvChange.setTextColor(context.getResources().getColor(R.color.error));
        }

        // Card Click opens Celebration if target reached or shows Figma Mobile 3 detail sheet
        holder.itemView.setOnClickListener(v -> {
            if (item.isTargetMet()) {
                new CelebrationDialog(context, item).show();
            } else {
                new ProductDetailBottomSheetDialog(context, item).show();
            }
        });

        // Long press opens delete prompt
        holder.itemView.setOnLongClickListener(v -> {
            if (deleteListener != null) {
                deleteListener.onDelete(item);
                return true;
            }
            return false;
        });

        if (holder.btnDelete != null) {
            holder.btnDelete.setOnClickListener(v -> {
                if (deleteListener != null) {
                    deleteListener.onDelete(item);
                }
            });
        }
    }

    private void openProductUrl(String url) {
        if (url != null && (url.startsWith("http://") || url.startsWith("https://"))) {
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                context.startActivity(intent);
            } catch (Exception e) {
                Toast.makeText(context, "Could not open URL", Toast.LENGTH_SHORT).show();
            }
        } else {
            Toast.makeText(context, "Official store product link", Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        MaterialCardView cardTracker;
        ImageView ivThumb;
        TextView tvTitle;
        ImageView ivSiteLogo;
        TextView tvCurrentPrice;
        TextView tvTargetPrice;
        TextView tvStatusBadge;
        TextView tvChange;
        ImageView btnDelete;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            cardTracker = itemView.findViewById(R.id.cardTracker);
            ivThumb = itemView.findViewById(R.id.ivItemThumb);
            tvTitle = itemView.findViewById(R.id.tvItemTitle);
            ivSiteLogo = itemView.findViewById(R.id.ivItemSiteLogo);
            tvCurrentPrice = itemView.findViewById(R.id.tvItemCurrentPrice);
            tvTargetPrice = itemView.findViewById(R.id.tvItemTargetPrice);
            tvStatusBadge = itemView.findViewById(R.id.tvItemStatusBadge);
            tvChange = itemView.findViewById(R.id.tvItemChange);
            btnDelete = itemView.findViewById(R.id.btnItemDelete);
        }
    }
}

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

import com.google.android.material.button.MaterialButton;
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

        holder.tvProductName.setText(item.getProductName());
        holder.tvSiteBadge.setText(item.getSite());

        // Site logo matching
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

        // Clickable clean product link
        String rawUrl = item.getUrl() != null ? item.getUrl() : "";
        String cleanDisplayUrl = rawUrl.replace("https://", "").replace("http://", "").replace("www.", "");
        if (cleanDisplayUrl.length() > 36) {
            cleanDisplayUrl = cleanDisplayUrl.substring(0, 33) + "...";
        }
        holder.tvProductLink.setText(cleanDisplayUrl + " 🔗");
        holder.tvProductLink.setOnClickListener(v -> openProductUrl(rawUrl));

        String symbol = item.getCurrencySymbol() != null ? item.getCurrencySymbol() : "₹";
        holder.tvCurrentPrice.setText(symbol + String.format(Locale.US, "%,.2f", item.getCurrentPrice()));
        holder.tvTargetPrice.setText("Target: " + symbol + String.format(Locale.US, "%,.2f", item.getTargetPrice()));

        if (item.isTargetMet()) {
            holder.tvDropBadge.setText("🎉 Target Met! 🏆");
            holder.tvDropBadge.setBackgroundResource(R.drawable.badge_emerald);
            holder.tvDropBadge.setTextColor(context.getResources().getColor(R.color.accent_dark));

            if (holder.cardTracker != null) {
                holder.cardTracker.setStrokeColor(context.getResources().getColor(R.color.accent));
                holder.cardTracker.setStrokeWidth(4);
            }

            if (holder.btnCelebrate != null) {
                holder.btnCelebrate.setVisibility(View.VISIBLE);
                holder.btnCelebrate.setOnClickListener(v -> {
                    new CelebrationDialog(context, item).show();
                });
            }

            holder.itemView.setOnClickListener(v -> {
                new CelebrationDialog(context, item).show();
            });
        } else {
            int discount = item.getDiscountPercent();
            if (discount > 0) {
                holder.tvDropBadge.setText("-" + discount + "% Target");
            } else {
                holder.tvDropBadge.setText("Tracking Active");
            }
            holder.tvDropBadge.setBackgroundResource(R.drawable.badge_site);
            holder.tvDropBadge.setTextColor(context.getResources().getColor(R.color.primary));

            if (holder.cardTracker != null) {
                holder.cardTracker.setStrokeColor(context.getResources().getColor(R.color.card_stroke));
                holder.cardTracker.setStrokeWidth(2);
            }

            if (holder.btnCelebrate != null) {
                holder.btnCelebrate.setVisibility(View.GONE);
            }

            holder.itemView.setOnClickListener(null);
        }

        holder.btnOpenStore.setOnClickListener(v -> openProductUrl(item.getUrl()));

        holder.btnDelete.setOnClickListener(v -> {
            if (deleteListener != null) {
                deleteListener.onDelete(item);
            }
        });
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
            Toast.makeText(context, "Demo product URL", Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        MaterialCardView cardTracker;
        ImageView ivSiteLogo;
        TextView tvSiteBadge;
        TextView tvDropBadge;
        ImageView ivProductImage;
        TextView tvProductName;
        TextView tvProductLink;
        TextView tvCurrentPrice;
        TextView tvTargetPrice;
        MaterialButton btnCelebrate;
        MaterialButton btnOpenStore;
        ImageView btnDelete;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            cardTracker = itemView.findViewById(R.id.cardTracker);
            ivSiteLogo = itemView.findViewById(R.id.ivItemSiteLogo);
            tvSiteBadge = itemView.findViewById(R.id.tvItemSiteBadge);
            tvDropBadge = itemView.findViewById(R.id.tvItemDropBadge);
            ivProductImage = itemView.findViewById(R.id.ivItemProductImage);
            tvProductName = itemView.findViewById(R.id.tvItemProductName);
            tvProductLink = itemView.findViewById(R.id.tvItemProductLink);
            tvCurrentPrice = itemView.findViewById(R.id.tvItemCurrentPrice);
            tvTargetPrice = itemView.findViewById(R.id.tvItemTargetPrice);
            btnCelebrate = itemView.findViewById(R.id.btnItemCelebrate);
            btnOpenStore = itemView.findViewById(R.id.btnItemOpenStore);
            btnDelete = itemView.findViewById(R.id.btnItemDelete);
        }
    }
}

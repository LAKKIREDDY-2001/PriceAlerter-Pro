package com.example.pricealerter;

import android.os.Bundle;
import android.widget.ProgressBar;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.card.MaterialCardView;
import com.google.android.material.textfield.TextInputEditText;

public class QuickAddActivity extends AppCompatActivity {
    public static final String EXTRA_PRODUCT_URL = "extra_product_url";

    private TextInputEditText etProductUrl;
    private MaterialButton btnFetchPrice;
    private ProgressBar loadingPrice;
    private MaterialCardView cardProductResult;
    private TextInputEditText etTargetPrice;
    private MaterialButton btnSaveAlert;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_quick_add);

        MaterialToolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setDisplayShowHomeEnabled(true);
        }
        toolbar.setNavigationOnClickListener(v -> finish());

        etProductUrl = findViewById(R.id.etProductUrl);
        btnFetchPrice = findViewById(R.id.btnFetchPrice);
        loadingPrice = findViewById(R.id.loadingPrice);
        cardProductResult = findViewById(R.id.cardProductResult);
        etTargetPrice = findViewById(R.id.etTargetPrice);
        btnSaveAlert = findViewById(R.id.btnSaveAlert);

        String url = getIntent().getStringExtra(EXTRA_PRODUCT_URL);
        if (url != null && !url.isEmpty()) {
            etProductUrl.setText(url);
        }

        btnFetchPrice.setOnClickListener(v -> {
            loadingPrice.setVisibility(android.view.View.VISIBLE);
            // Simulate fetch
            loadingPrice.postDelayed(() -> {
                loadingPrice.setVisibility(android.view.View.GONE);
                cardProductResult.setVisibility(android.view.View.VISIBLE);
            }, 1000);
        });

        btnSaveAlert.setOnClickListener(v -> {
            finish();
        });
    }
}
package com.example.pricealerter;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.DashPathEffect;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Shader;
import android.util.AttributeSet;
import android.view.View;

import androidx.annotation.Nullable;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class StockPriceChartView extends View {

    private final Paint linePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint fillPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint baselinePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint textPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint dotPaint = new Paint(Paint.ANTI_ALIAS_FLAG);

    private final Path curvePath = new Path();
    private final Path fillPath = new Path();

    private final List<Double> priceHistory = new ArrayList<>();
    private final List<String> timeLabels = new ArrayList<>();
    private double targetBaseline = 1500.0;
    private double currentLivePrice = 1450.0;
    private String currencySymbol = "₹";

    private final int COLOR_GREEN = Color.parseColor("#10B981");
    private final int COLOR_RED = Color.parseColor("#EF4444");
    private final int COLOR_BASELINE = Color.parseColor("#6366F1");

    public StockPriceChartView(Context context) {
        super(context);
        init();
    }

    public StockPriceChartView(Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public StockPriceChartView(Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init();
    }

    private void init() {
        linePaint.setStyle(Paint.Style.STROKE);
        linePaint.setStrokeWidth(6f);
        linePaint.setStrokeCap(Paint.Cap.ROUND);
        linePaint.setStrokeJoin(Paint.Join.ROUND);

        fillPaint.setStyle(Paint.Style.FILL);

        baselinePaint.setStyle(Paint.Style.STROKE);
        baselinePaint.setStrokeWidth(3f);
        baselinePaint.setColor(COLOR_BASELINE);
        baselinePaint.setPathEffect(new DashPathEffect(new float[]{14f, 10f}, 0f));

        textPaint.setTextSize(26f);
        textPaint.setColor(Color.parseColor("#64748B"));

        dotPaint.setStyle(Paint.Style.FILL);

        // Default sample points if none supplied
        setSampleData(1800.0, 1620.0);
    }

    public void setSampleData(double target, double current) {
        this.targetBaseline = target > 0 ? target : 1600.0;
        this.currentLivePrice = current > 0 ? current : 1550.0;

        priceHistory.clear();
        timeLabels.clear();

        // Generate a smooth realistic price progression starting from alert creation
        double start = targetBaseline * 1.12;
        double p2 = targetBaseline * 1.05;
        double p3 = targetBaseline * 0.98;
        double p4 = targetBaseline * 1.02;

        priceHistory.add(start);
        priceHistory.add(p2);
        priceHistory.add(p3);
        priceHistory.add(p4);
        priceHistory.add(currentLivePrice);

        timeLabels.add("Alert Set");
        timeLabels.add("Day 2");
        timeLabels.add("Day 4");
        timeLabels.add("Yesterday");
        timeLabels.add("Live Now");

        invalidate();
    }

    public void setData(double target, double current, String symbol, List<Double> history) {
        this.targetBaseline = target;
        this.currentLivePrice = current;
        if (symbol != null) this.currencySymbol = symbol;

        priceHistory.clear();
        if (history != null && !history.isEmpty()) {
            priceHistory.addAll(history);
        } else {
            setSampleData(target, current);
            return;
        }
        invalidate();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        if (priceHistory.isEmpty()) return;

        int width = getWidth();
        int height = getHeight();

        int padLeft = 40;
        int padRight = 40;
        int padTop = 60;
        int padBottom = 80;

        float chartWidth = width - padLeft - padRight;
        float chartHeight = height - padTop - padBottom;
        if (chartWidth <= 0 || chartHeight <= 0) return;

        // Find min and max
        double minPrice = targetBaseline;
        double maxPrice = targetBaseline;
        for (double p : priceHistory) {
            if (p < minPrice) minPrice = p;
            if (p > maxPrice) maxPrice = p;
        }

        double margin = (maxPrice - minPrice) * 0.2;
        if (margin == 0) margin = targetBaseline * 0.1;
        double chartMin = minPrice - margin;
        double chartMax = maxPrice + margin;
        double range = chartMax - chartMin;
        if (range <= 0) range = 1.0;

        // Y coordinate helper
        float baselineY = (float) (padTop + (1.0 - (targetBaseline - chartMin) / range) * chartHeight);

        // Draw Baseline Threshold Line (Target line)
        canvas.drawLine(padLeft, baselineY, width - padRight, baselineY, baselinePaint);

        // Baseline Label
        textPaint.setColor(COLOR_BASELINE);
        textPaint.setTextSize(26f);
        textPaint.setFakeBoldText(true);
        String baselineLabel = "🎯 Target: " + currencySymbol + String.format(Locale.US, "%,.0f", targetBaseline);
        canvas.drawText(baselineLabel, padLeft + 10, baselineY - 12, textPaint);
        textPaint.setFakeBoldText(false);

        // Plot points
        int count = priceHistory.size();
        float stepX = chartWidth / (count - 1);

        curvePath.reset();
        fillPath.reset();

        float[] pointXs = new float[count];
        float[] pointYs = new float[count];

        for (int i = 0; i < count; i++) {
            double price = priceHistory.get(i);
            float x = padLeft + i * stepX;
            float y = (float) (padTop + (1.0 - (price - chartMin) / range) * chartHeight);
            pointXs[i] = x;
            pointYs[i] = y;

            if (i == 0) {
                curvePath.moveTo(x, y);
                fillPath.moveTo(x, y);
            } else {
                float prevX = pointXs[i - 1];
                float prevY = pointYs[i - 1];
                float cX = (prevX + x) / 2;
                curvePath.cubicTo(cX, prevY, cX, y, x, y);
                fillPath.cubicTo(cX, prevY, cX, y, x, y);
            }
        }

        // Complete fill path
        fillPath.lineTo(pointXs[count - 1], height - padBottom);
        fillPath.lineTo(pointXs[0], height - padBottom);
        fillPath.close();

        // Determine color: Green if live price <= targetBaseline, Red if live price > targetBaseline
        boolean isDealGreen = currentLivePrice <= targetBaseline;
        int activeColor = isDealGreen ? COLOR_GREEN : COLOR_RED;

        linePaint.setColor(activeColor);

        // Gradient Fill
        int gradientTop = Color.argb(60, Color.red(activeColor), Color.green(activeColor), Color.blue(activeColor));
        int gradientBottom = Color.argb(0, Color.red(activeColor), Color.green(activeColor), Color.blue(activeColor));
        fillPaint.setShader(new LinearGradient(0, padTop, 0, height - padBottom, gradientTop, gradientBottom, Shader.TileMode.CLAMP));

        canvas.drawPath(fillPath, fillPaint);
        canvas.drawPath(curvePath, linePaint);

        // Draw points and labels
        textPaint.setColor(Color.parseColor("#94A3B8"));
        textPaint.setTextSize(22f);

        for (int i = 0; i < count; i++) {
            float x = pointXs[i];
            float y = pointYs[i];

            // Point dot
            dotPaint.setColor(i == count - 1 ? activeColor : Color.parseColor("#CBD5E1"));
            canvas.drawCircle(x, y, i == count - 1 ? 9f : 5f, dotPaint);

            // Time label below chart
            if (i < timeLabels.size()) {
                String lbl = timeLabels.get(i);
                float lblWidth = textPaint.measureText(lbl);
                canvas.drawText(lbl, x - lblWidth / 2, height - 20, textPaint);
            }
        }

        // Draw Callout for Current Live Price on last dot
        float lastX = pointXs[count - 1];
        float lastY = pointYs[count - 1];

        String statusPill = isDealGreen
                ? "🟢 " + currencySymbol + String.format(Locale.US, "%,.0f", currentLivePrice) + " (BELOW TARGET)"
                : "🔴 " + currencySymbol + String.format(Locale.US, "%,.0f", currentLivePrice) + " (ABOVE TARGET)";

        textPaint.setColor(activeColor);
        textPaint.setFakeBoldText(true);
        textPaint.setTextSize(26f);
        float pillW = textPaint.measureText(statusPill);
        float pillX = Math.min(width - padRight - pillW, Math.max(padLeft, lastX - pillW / 2));
        canvas.drawText(statusPill, pillX, lastY - 20 > padTop ? lastY - 20 : lastY + 36, textPaint);
        textPaint.setFakeBoldText(false);
    }
}

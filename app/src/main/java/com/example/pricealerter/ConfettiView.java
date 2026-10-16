package com.example.pricealerter;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.util.AttributeSet;
import android.view.View;

import androidx.annotation.Nullable;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class ConfettiView extends View {

    private static class Particle {
        float x, y;
        float speedY;
        float speedX;
        float rotation;
        float rotationSpeed;
        float width, height;
        int color;
        int shape; // 0 = rectangle, 1 = circle
    }

    private final List<Particle> particles = new ArrayList<>();
    private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final RectF rectF = new RectF();
    private final Random random = new Random();
    private boolean isRunning = false;

    private static final int[] CONFETTI_COLORS = {
            Color.parseColor("#F59E0B"), // Amber / Gold
            Color.parseColor("#10B981"), // Emerald Green
            Color.parseColor("#6366F1"), // Indigo
            Color.parseColor("#EC4899"), // Pink
            Color.parseColor("#3B82F6"), // Blue
            Color.parseColor("#8B5CF6"), // Purple
            Color.parseColor("#EF4444"), // Red
            Color.parseColor("#14B8A6")  // Teal
    };

    public ConfettiView(Context context) {
        super(context);
        init();
    }

    public ConfettiView(Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public ConfettiView(Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init();
    }

    private void init() {
        paint.setStyle(Paint.Style.FILL);
    }

    public void startConfetti() {
        isRunning = true;
        createParticles();
        invalidate();
    }

    public void stopConfetti() {
        isRunning = false;
        particles.clear();
        invalidate();
    }

    private void createParticles() {
        particles.clear();
        int width = getWidth() > 0 ? getWidth() : 1080;
        int count = 90;

        for (int i = 0; i < count; i++) {
            Particle p = new Particle();
            p.x = random.nextFloat() * width;
            p.y = -random.nextFloat() * 800; // Start above screen
            p.speedY = 8f + random.nextFloat() * 14f;
            p.speedX = -3f + random.nextFloat() * 6f;
            p.rotation = random.nextFloat() * 360f;
            p.rotationSpeed = -8f + random.nextFloat() * 16f;
            p.width = 16f + random.nextFloat() * 20f;
            p.height = 10f + random.nextFloat() * 14f;
            p.color = CONFETTI_COLORS[random.nextInt(CONFETTI_COLORS.length)];
            p.shape = random.nextInt(2);
            particles.add(p);
        }
    }

    @Override
    protected void onSizeChanged(int w, int h, int oldw, int oldh) {
        super.onSizeChanged(w, h, oldw, oldh);
        if (isRunning && particles.isEmpty()) {
            createParticles();
        }
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        if (!isRunning || particles.isEmpty()) return;

        int viewHeight = getHeight();
        int viewWidth = getWidth();

        boolean anyAlive = false;

        for (Particle p : particles) {
            p.y += p.speedY;
            p.x += p.speedX;
            p.rotation += p.rotationSpeed;

            // Recycle particles if they fall past bottom
            if (p.y > viewHeight + 50) {
                p.y = -random.nextFloat() * 200;
                p.x = random.nextFloat() * (viewWidth > 0 ? viewWidth : 1080);
            }

            anyAlive = true;
            paint.setColor(p.color);

            canvas.save();
            canvas.translate(p.x, p.y);
            canvas.rotate(p.rotation);

            if (p.shape == 0) {
                rectF.set(-p.width / 2, -p.height / 2, p.width / 2, p.height / 2);
                canvas.drawRoundRect(rectF, 4f, 4f, paint);
            } else {
                canvas.drawCircle(0, 0, p.width / 2.5f, paint);
            }

            canvas.restore();
        }

        if (anyAlive) {
            postInvalidateOnAnimation();
        }
    }
}

// background/Background.js

export class Background {
  constructor(game) {
    this.game = game;

    // Camera offset for parallax scrolling
    this.offsetY = 0;

    // Layers for clouds (or future layers)
    this.layers = [];

    // Initialize cloud layer(s)
    this.createCloudLayer();
  }

  /* =========================
     CREATE CLOUD LAYER
  ========================== */
  createCloudLayer() {
    // Example: generate 20 clouds
    const clouds = [];
    for (let i = 0; i < 20; i++) {
      clouds.push({
        x: Math.random() * this.game.canvas.width,
        y: Math.random() * this.game.canvas.height,
        size: 20 + Math.random() * 40,
        speed: 0.2 + Math.random() * 0.3, // horizontal drift speed
      });
    }
    this.layers.push({ type: "clouds", items: clouds });
  }

  /* =========================
     SHIFT BACKGROUND (PARALLAX)
  ========================== */
  shift(amount) {
    // Slowly move background relative to camera
    this.offsetY = amount;
  }

  /* =========================
     DRAW BACKGROUND
  ========================== */
  draw() {

    const ctx = this.game.ctx;

    // Draw sky (static)
    this.drawSkyGradient();

    // Draw cloud layers with offset
    ctx.save();
    ctx.translate(0, this.offsetY);

    for (let layer of this.layers) {
      if (layer.type === "clouds") {
        this.drawCloudLayer(layer);
      }
    }

    ctx.restore();
  }

  /* =========================
     DRAW SKY GRADIENT
  ========================== */
  drawSkyGradient() {

    const canvas = this.game.canvas;
    const ctx = this.game.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);

    // Example gradient; could change based on elevation
    gradient.addColorStop(0, "#6ec3ff");
    gradient.addColorStop(1, "#cfe9ff");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

/* =========================
     DRAW CLOUD LAYER
  ========================== */
  drawCloudLayer(layer) {
    const canvas = this.game.canvas;
    const ctx = this.game.ctx;

    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";

    for (let cloud of layer.items) {
      ctx.beginPath();
      ctx.ellipse(cloud.x, cloud.y, cloud.size, cloud.size * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Optional: horizontal drift
      cloud.x += cloud.speed;
      if (cloud.x - cloud.size > canvas.width) cloud.x = -cloud.size;
    }
  }
}





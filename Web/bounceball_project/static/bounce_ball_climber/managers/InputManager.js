// managers/InputManager.js

export class InputManager {
  constructor(game) {
    this.game = game;

    this.dragging = false;
    this.lastPointerX = 0;

    this.initEvents();
  }

  /* =========================
     INITIALIZE INPUT EVENTS
  ========================== */

  initEvents() {
    const canvas = this.game.canvas;

    // POINTER DOWN
    canvas.addEventListener("pointerdown", e => {
      canvas.setPointerCapture(e.pointerId);

      // Top half of screen = boost
      if (e.clientY < canvas.height / 2) {
        this.game.ball.activateBoost();
      }
      // Bottom half = horizontal drag
      else {
        this.dragging = true;
        this.lastPointerX = e.clientX;
      }
    });

    // POINTER MOVE
    canvas.addEventListener("pointermove", e => {
      if (!this.dragging) return;

      const dx = e.clientX - this.lastPointerX;
      this.game.ball.x += dx;
      this.lastPointerX = e.clientX;
    });

    // POINTER UP / CANCEL
    const stopDragging = (e) => {
      this.dragging = false;
      if (e?.pointerId) canvas.releasePointerCapture(e.pointerId);
    };

    canvas.addEventListener("pointerup", stopDragging);
    canvas.addEventListener("pointercancel", stopDragging);

    // Prevent desktop zoom
    document.addEventListener("wheel", e => {
      if (e.ctrlKey) e.preventDefault();
    }, { passive: false });

    // Prevent mobile double-tap zoom
    let lastTouchEnd = 0;
    document.addEventListener("touchend", e => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) e.preventDefault();
      lastTouchEnd = now;
    }, { passive: false });

    // Prevent keyboard zoom
    document.addEventListener("keydown", e => {
      if ((e.ctrlKey || e.metaKey) && ["+", "-", "="].includes(e.key)) {
        e.preventDefault();
      }
    });
  }
}
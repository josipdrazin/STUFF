
export class Input {

  constructor() {

    this.keys = {};

    this.justPressed = {};

    this.keyboardInitialized = false;
    this.touchInitialized = false;

    this.setupKeyboard();
    this.setupTouch();

  }


  // ==========================================
  // Keyboard
  // ==========================================

  setupKeyboard() {

    if (this.keyboardInitialized) return;

    window.addEventListener("keydown", e => {

      if (!this.keys[e.code]) {
        this.justPressed[e.code] = true;
      }

      this.keys[e.code] = true;

    });

    window.addEventListener("keyup", e => {

      this.keys[e.code] = false;

    });

    this.keyboardInitialized = true;
  }


  // ==========================================
  // Touch Controls
  // ==========================================

  setupTouch() {

    if (this.touchInitialized) return;

    const touchMap = {
      up: "ArrowUp",
      down: "ArrowDown",
      left: "ArrowLeft",
      right: "ArrowRight"
    };

    const container = document.getElementById("touchControls");
    if (!container) return;

    const buttons = container.querySelectorAll("button");

    buttons.forEach(btn => {

      const dir = btn.dataset.dir;
      if (!dir) return;

      btn.addEventListener("touchstart", e => {

        e.preventDefault();

        if (dir === "shoot") {
          this.keys["Space"] = true;
          this.justPressed["Space"] = true;
          return;
        }

        const key = touchMap[dir];
        this.keys[key] = true;
        this.justPressed[key] = true;

      });

      btn.addEventListener("touchend", e => {

        e.preventDefault();

        if (dir === "shoot") {
          this.keys["Space"] = false;
          return;
        }

        const key = touchMap[dir];
        this.keys[key] = false;

      });

    });

    this.touchInitialized = true;
  }


  // ==========================================
  // Input Queries
  // ==========================================

  isPressed(code) {
    return !!this.keys[code];
  }

  wasJustPressed(code) {
    return !!this.justPressed[code];
  }


  // ==========================================
  // Reset per frame (call once per frame)
  // ==========================================

  reset() {
    this.justPressed = {};
  }

}
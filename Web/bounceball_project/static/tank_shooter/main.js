
import { Game } from "./game.js";

async function start() {

  // CLEANUP

  //document.querySelector(".start-screen")?.remove();
  

  // ==============================
  // UI SETUP
  // ==============================

  const title = document.createElement("h2");
  title.innerText = "Tank Pathfinding and Shooting Practice";

  const subtitle = document.createElement("p");
  subtitle.innerText = "Arrow keys move. Space shoots.";

  document.body.appendChild(title);
  document.body.appendChild(subtitle);

  // ==============================
  // CANVAS
  // ==============================

  const canvas = document.createElement("canvas");
  canvas.width = 416;
  canvas.height = 416;

  document.body.appendChild(canvas);

  // ==============================
  // TOUCH CONTROLS
  // ==============================

  const controls = document.createElement("div");
  controls.id = "touchControls";

  controls.style.display = "grid";
  controls.style.gridTemplateColumns = "repeat(3, 60px)";
  controls.style.gap = "10px";
  controls.style.marginTop = "15px";

  const buttons = [
    { dir: "up", label: "⬆️" },
    { dir: "shoot", label: "🔥" },
    { dir: "left", label: "⬅️" },
    { dir: null, label: "" }, // spacer
    { dir: "right", label: "➡️" },
    { dir: "down", label: "⬇️" }
  ];

  buttons.forEach(btnData => {

    const btn = document.createElement("button");

    btn.textContent = btnData.label;

    if (btnData.dir) {
      btn.dataset.dir = btnData.dir;
    } else {
      btn.style.visibility = "hidden";
    }

    btn.style.height = "50px";
    btn.style.fontSize = "18px";

    controls.appendChild(btn);

  });

  document.body.appendChild(controls);


  // ==============================
  // GAME INIT
  // ==============================

  const game = new Game(canvas);

  await game.init();

  game.loop();

}

start();


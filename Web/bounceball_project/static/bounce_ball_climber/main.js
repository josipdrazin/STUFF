
import { Game } from "./core/Game.js";

const logElement =Object.assign(document.createElement("div"),{id: "logElement"});
window.onerror = function(message, source, lineno, colno, error) {
  const errorText = `Error: ${message} at ${source}:${lineno}:${colno}`;
  logElement.textContent += errorText + '\n';
  alert(errorText);
  return true; // Prevent default error handling
};
/* =========================
   CREATE CANVAS
========================= */

const canvas = Object.assign(document.createElement("canvas"), {id: "game"});

document.getElementById("app").appendChild(canvas);

//const ctx = canvas.getContext("2d");


/* =========================
   RESIZE
========================= */

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();


/* =========================
   CREATE GAME
========================= */

const game = new Game();


/* =========================
   GAME LOOP
========================= */



const overlay = document.body.appendChild(Object.assign(document.createElement("div"), { class: "overlay"}));
const playbtn = overlay.qppend(Object.assign(document.createElement("button"), {class: "play-btn", onclick: "play()"}));
document.body.classList.add("start-screen")
const link_element = document.querySelector('link[rel="stylesheet"]');
link_element.href = "/static/{{ game.game_identifier }}/style.css";




export class BellyBar {

  constructor() {

    this.bellyBarElement = document.createElement("div");
    this.bellyBarElement.id = "belly-bar";

    this.bellyFillElement = document.createElement("div");
    this.bellyFillElement.id = "belly-fill";

    this.bellyBarElement.appendChild(this.bellyFillElement);
    document.getElementById( "app" ).appendChild(this.bellyBarElement);

    this.maxval=0;
  }

  update(percent) {
    const clamped = Math.max(0, Math.min(100, percent));
    this.bellyFillElement.style.width = clamped + "%";
  }

}

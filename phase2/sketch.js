function setup() {
  createCanvas(800, 400)
  colorMode(HSB, 360, 100, 100)  // active HSB — plages : H 0-360, S 0-100, B 0-100
}

function draw() {
  background(240, 30, 10)        // fond sombre en HSB — teinte bleue, peu saturé, sombre
  noStroke()

  const teinte  = map(mouseX, 0, width, 0, 360)   // teinte suit la position X
  const taille  = map(mouseY, 0, height, 5, 60)    // taille suit la position Y

  fill(teinte, 80, 90)           // couleur vive, luminosité haute
  ellipse(mouseX, mouseY, taille)
}

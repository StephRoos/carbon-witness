let px, py  // position actuelle — déclarées globalement pour persister entre les frames

function setup() {
  createCanvas(800, 400)
  colorMode(HSB, 360, 100, 100)
  px = width / 2   // position initiale au centre
  py = height / 2
}

function draw() {
  background(240, 30, 10)
  noStroke()

  const t = frameCount * 0.01
  const cibleX = map(noise(t),       0, 1, 100, width - 100)
  const cibleY = map(noise(t + 100), 0, 1, 50, height - 50)

  px = lerp(px, cibleX, 0.05)  // glisse 5% vers la cible à chaque frame
  py = lerp(py, cibleY, 0.05)

  fill(180, 80, 90)
  ellipse(px, py, 20)
}

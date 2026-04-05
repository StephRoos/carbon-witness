class Particle {
  constructor(ecart, annee) {
    this.offset = random(1000)      // décalage unique dans l'espace de bruit
    this.teinte = map(ecart, 0, 1, 120, 0)  // 120=vert (bon) → 0=rouge (mauvais)
    this.annee = annee
    this.px = random(50, width - 50)   // position initiale aléatoire — mouvement décoratif assumé
    this.py = random(50, height - 50)
  }

  update() {
    const t = frameCount * 0.003  // ralenti — mouvement lent et organique
    const cibleX = map(noise(t + this.offset),       0, 1, 50, width - 50)
    const cibleY = map(noise(t + this.offset + 100), 0, 1, 50, height - 50)
    this.px = lerp(this.px, cibleX, 0.03)
    this.py = lerp(this.py, cibleY, 0.03)
  }

  draw() {
    fill(this.teinte, 80, 90)
    ellipse(this.px, this.py, 18)       // taille fixe — une seule vérité encodée (couleur)
    if (this.teinte > 40) {
      fill(0, 0, 10)
    } else {
      fill(0, 0, 90)
    }
    textSize(7)
    textAlign(CENTER, CENTER)
    text(this.annee, this.px, this.py)
  }
}

let donnees
let particles = []

function preload() {
  donnees = loadJSON('../phase1/emissions.json')
}

function setup() {
  createCanvas(800, 400)
  colorMode(HSB, 360, 100, 100, 100)

  const pente = (17.5 - 35.4) / (2030 - 2015)
  const data = Object.values(donnees)

  for (let i = 0; i < data.length; i++) {
    const d = data[i]
    let ecart
    if (d.year >= 2015) {
      const paris = 35.4 + pente * (d.year - 2015)
      ecart = constrain((d.gt - paris) / paris, 0, 1)
    } else {
      const suivant = data[i + 1]
      const variation = suivant ? (suivant.gt - d.gt) / d.gt : 0
      ecart = constrain(map(variation, -0.05, 0.05, 0, 1), 0, 1)
    }
    particles.push(new Particle(ecart, d.year))
  }
}

function draw() {
  background(240, 30, 10, 25)
  noStroke()
  for (let i = 0; i < particles.length; i++) {
    particles[i].update()
    particles[i].draw()
  }

  // overlay — titre + légende
  fill(200, 0, 80, 90)
  noStroke()
  textFont('monospace')
  textSize(13)
  textAlign(LEFT, BASELINE)
  text('CARBON WITNESS — Émissions mondiales 1959–2023', 50, 30)

  textSize(10)
  fill(120, 80, 80, 90)
  ellipse(52, 55, 8)
  fill(200, 0, 70, 90)
  text('réduction / sous trajectoire Paris', 60, 58)

  fill(0, 80, 90, 90)
  ellipse(52, 72, 8)
  fill(200, 0, 70, 90)
  text('hausse / dépassement Paris', 60, 75)
}

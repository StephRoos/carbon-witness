class Particle {
  constructor(x, y, ecart, emissions) {
    this.x = x          // position courante
    this.y = y
    this.px = x         // position lissée (lerp)
    this.py = y
    this.offset = random(1000)  // décalage unique dans l'espace de bruit
    this.teinte = map(ecart, 0, 1, 120, 0)      // 120=vert (bon) → 0=rouge (mauvais)
    this.taille = map(emissions, 0, 1, 5, 40)  // 0=petit, 1=grand
  }

  update() {
    const t = frameCount * 0.01
    const cibleX = map(noise(t + this.offset),       0, 1, 50, width - 50)
    const cibleY = map(noise(t + this.offset + 100), 0, 1, 50, height - 50)
    this.px = lerp(this.px, cibleX, 0.03)
    this.py = lerp(this.py, cibleY, 0.03)
  }

  draw() {
    fill(this.teinte, 80, 90)
    ellipse(this.px, this.py, this.taille)
  }
}

let particles = []

function setup() {
  createCanvas(800, 400)
  colorMode(HSB, 360, 100, 100, 100)  // 4ème plage = alpha 0-100
  for (let i = 0; i < 50; i++) {
    particles.push(new Particle(random(width), random(height), random(1), random(1)))  // random() disponible ici
  }
}

function draw() {
  background(240, 30, 10, 25)  // efface partiellement — laisse une trace
  noStroke()
  for (let i = 0; i < particles.length; i++) {
    particles[i].update()
    particles[i].draw()
  }
}

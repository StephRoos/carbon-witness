let donnees
let data           // Object.values(donnees) — calculé une seule fois dans setup()
let ipcc
let progression    = 0
let pauseFrames    = 0       // 1 — pause narrative entre les deux actes
let anneeScenarios = 2025
let scenariosData  = null
let fadeScenarios  = 0      // 4 — fondue d'entrée des scénarios (0→1)

function preload() {
  donnees = loadJSON('../phase1/emissions.json')
  ipcc    = loadJSON('scenarios-ipcc.json')
}

function setup() {
  createCanvas(920, 400)
  colorMode(HSB, 360, 100, 100, 100)
  data = Object.values(donnees)
}

function yearToX(year) { return 50 + ((year - 1959) / (2050 - 1959)) * 800 }
function gtToY(gt)      { return 350 - (gt / 45) * 300 }


function draw() {
  background(240, 30, 10)

  // titre
  noStroke()
  fill(0, 0, 80)
  textFont('monospace')
  textSize(14)
  textAlign(LEFT, BASELINE)
  text('Émissions mondiales CO₂ — fossiles (GtCO₂/an)', 50, 30)
  fill(0, 0, 40)
  textSize(10)
  text('Source : OWID/GCP (hist. 1959–2023) · GCP prél. (2024–2025) · IPCC AR6 IIASA C1/C3/C6 hors AFOLU (scén.)', 50, 46)

  // grille horizontale — étendue jusqu'à 2050
  const yTicks = [0, 10, 20, 30, 40, 50]
  for (let i = 0; i < yTicks.length; i++) {
    stroke(0, 0, 15)
    strokeWeight(1)
    line(50, gtToY(yTicks[i]), yearToX(2050), gtToY(yTicks[i]))
    noStroke()
    fill(0, 0, 53)
    textSize(11)
    textAlign(LEFT, CENTER)
    text(yTicks[i], 10, gtToY(yTicks[i]))
  }

  // axe X
  const xTicks = [1960, 1970, 1980, 1990, 2000, 2010, 2020, 2030, 2040, 2050]
  for (let i = 0; i < xTicks.length; i++) {
    stroke(0, 0, 27)
    strokeWeight(1)
    line(yearToX(xTicks[i]), 355, yearToX(xTicks[i]), 365)
    noStroke()
    fill(0, 0, 53)
    textSize(11)
    textAlign(LEFT, BASELINE)
    text(xTicks[i], yearToX(xTicks[i]) - 15, 380)
  }

  // événements historiques
  const evenements = [
    { year: 1973, label: 'Choc pétrolier',  labelY: 65 },
    { year: 1992, label: 'Sommet Rio',       labelY: 65 },
    { year: 2009, label: 'Crise financière', labelY: 80 },
    { year: 2015, label: 'Accord de Paris',  labelY: 65 },
    { year: 2020, label: 'COVID',            labelY: 80 },
  ]
  for (let i = 0; i < evenements.length; i++) {
    stroke(0, 0, 27)
    strokeWeight(1)
    line(yearToX(evenements[i].year), 50, yearToX(evenements[i].year), 350)
    noStroke()
    fill(0, 0, 40)
    textSize(10)
    textAlign(RIGHT, BASELINE)
    text(evenements[i].label, yearToX(evenements[i].year) - 4, evenements[i].labelY)
  }

  // courbe historique animée — gradient temporel
  progression = min(progression + 0.2, data.length - 1)

  noFill()
  for (let i = 1; i <= floor(progression); i++) {
    const age = i / data.length
    stroke(25, 90, map(age, 0, 1, 30, 100))
    strokeWeight(2)
    // 2024 et 2025 = estimations préliminaires GCP → pointillés
    if (data[i].year >= 2024) drawingContext.setLineDash([5, 4])
    line(yearToX(data[i-1].year), gtToY(data[i-1].gt),
         yearToX(data[i].year),   gtToY(data[i].gt))
    if (data[i].year >= 2024) drawingContext.setLineDash([])
  }

  // point lumineux à la tête
  const idx = floor(progression)
  const ptX = yearToX(data[idx].year)
  const ptY = gtToY(data[idx].gt)
  noStroke()
  fill(25, 90, 100, 90)
  ellipse(ptX, ptY, 8)

  // 2 & 3 — année + GtCO₂ sur fond sombre constant
  noStroke()
  fill(240, 30, 8, 85)
  rect(ptX + 8, ptY - 8, 58, 26, 3)
  fill(0, 0, 95)
  textSize(11)
  textFont('monospace')
  textAlign(LEFT, CENTER)
  text(data[idx].year, ptX + 12, ptY)
  fill(0, 0, 65)
  textSize(10)
  text(data[idx].gt.toFixed(1) + ' Gt', ptX + 12, ptY + 13)

  // scénarios futurs — pause de 60 frames après la fin de la courbe historique (2025)
  if (progression >= data.length - 1) {
    pauseFrames = min(pauseFrames + 1, 60)
  }
  if (progression >= data.length - 1 && pauseFrames >= 60) {
    if (!scenariosData) {
      // Ancrage : décaler chaque scénario pour partir de la valeur observée 2025
      const ancre = data[data.length - 1].gt

      // Interpole les données 5 ans → résolution annuelle, puis ancre sur la valeur observée
      function ancrer(points) {
        const future = points.filter(p => p.year >= 2025)
        const delta  = ancre - future[0].median
        const annuel = []
        for (let j = 0; j < future.length - 1; j++) {
          const a = future[j], b = future[j + 1]
          const span = b.year - a.year
          for (let k = 0; k < span; k++) {
            const t = k / span  // interpolation linéaire entre deux points 5 ans
            annuel.push({
              year:   a.year + k,
              p05:    a.p05    + (b.p05    - a.p05)    * t + delta,
              p25:    a.p25    + (b.p25    - a.p25)    * t + delta,
              median: a.median + (b.median - a.median) * t + delta,
              p75:    a.p75    + (b.p75    - a.p75)    * t + delta,
              p95:    a.p95    + (b.p95    - a.p95)    * t + delta,
            })
          }
        }
        // dernier point (2050)
        const last = future[future.length - 1]
        annuel.push({
          year: last.year,
          p05: last.p05 + delta, p25: last.p25 + delta,
          median: last.median + delta,
          p75: last.p75 + delta, p95: last.p95 + delta,
        })
        // forcer le premier point à la valeur observée (incertitude nulle en 2025)
        annuel[0] = { year: 2025, p05: ancre, p25: ancre, median: ancre, p75: ancre, p95: ancre }
        return annuel
      }

      scenariosData = [
        { points: ancrer(ipcc['+1.5°C']), couleur: [210, 80, 80], dash: []       },  // bleu — solide
        { points: ancrer(ipcc['+2°C']),   couleur: [30,  90, 90], dash: [8, 4]   },  // orange — tirets
        { points: ancrer(ipcc['+3°C']),   couleur: [0,   85, 85], dash: [3, 3]   },  // rouge — pointillés
      ]
    }
    fadeScenarios  = min(fadeScenarios + 1 / 30, 1)  // 30 frames pour atteindre opacité pleine
    anneeScenarios = min(anneeScenarios + 0.2, 2050)
    const nPoints  = min(floor(anneeScenarios - 2025), scenariosData[0].points.length - 1)

    const labels = ['+1.5°C', '+2°C', '+3°C']
    for (let s = 0; s < scenariosData.length; s++) {
      const sc = scenariosData[s]
      const c = sc.couleur

      // bande externe p05–p95
      drawingContext.globalAlpha = 0.12 * fadeScenarios
      fill(c[0], c[1], c[2])
      noStroke()
      beginShape()
      for (let i = 0; i <= nPoints; i++) vertex(yearToX(sc.points[i].year), gtToY(sc.points[i].p95))
      for (let i = nPoints; i >= 0; i--) vertex(yearToX(sc.points[i].year), gtToY(sc.points[i].p05))
      endShape(CLOSE)

      // bande intérieure p25–p75
      drawingContext.globalAlpha = 0.25 * fadeScenarios
      beginShape()
      for (let i = 0; i <= nPoints; i++) vertex(yearToX(sc.points[i].year), gtToY(sc.points[i].p75))
      for (let i = nPoints; i >= 0; i--) vertex(yearToX(sc.points[i].year), gtToY(sc.points[i].p25))
      endShape(CLOSE)
      drawingContext.globalAlpha = 1

      // médiane — style de ligne propre à chaque scénario (accessibilité daltonisme)
      noFill()
      stroke(c[0], c[1], c[2], 90 * fadeScenarios)
      strokeWeight(1.5)
      if (sc.dash.length) drawingContext.setLineDash(sc.dash)
      beginShape()
      for (let i = 0; i <= nPoints; i++) vertex(yearToX(sc.points[i].year), gtToY(sc.points[i].median))
      endShape()
      drawingContext.setLineDash([])

      // label intermédiaire (~2037) — lisible pendant l'animation, pas besoin d'attendre 2050
      const idx37 = sc.points.findIndex(p => p.year === 2037)
      if (idx37 >= 0 && nPoints >= idx37) {
        noStroke()
        fill(c[0], c[1], c[2], 70 * fadeScenarios)
        textSize(9)
        textAlign(LEFT, CENTER)
        text(labels[s], yearToX(2037) + 4, gtToY(sc.points[idx37].median) - 10)
      }

      // label final à 2050
      if (anneeScenarios >= 2050) {
        noStroke()
        fill(c[0], c[1], c[2])
        textSize(10)
        textAlign(LEFT, CENTER)
        text(labels[s], yearToX(2051), gtToY(sc.points[sc.points.length - 1].median))
      }
    }

    // hint de replay une fois l'animation terminée
    if (anneeScenarios >= 2050 && fadeScenarios >= 1) {
      fill(0, 0, 40, 50 + 20 * sin(frameCount * 0.04))  // pulsation douce
      noStroke()
      textSize(10)
      textAlign(CENTER, BASELINE)
      text('cliquer pour relancer', width / 2, 395)
    }

  }
}

function mousePressed() {
  progression    = 0
  pauseFrames    = 0
  anneeScenarios = 2025
  scenariosData  = null
  fadeScenarios  = 0
}

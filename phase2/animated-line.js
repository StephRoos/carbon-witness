let donnees
let ipcc         // données IPCC AR6 — chargées une seule fois
let progression = 0
let anneeScenarios = 2025  // les données IPCC AR6 démarrent en 2025
let scenariosData = null

function preload() {
  donnees = loadJSON('../phase1/emissions.json')
  ipcc    = loadJSON('scenarios-ipcc.json')
}

function setup() {
  createCanvas(920, 400)
  colorMode(HSB, 360, 100, 100, 100)
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

  // grille horizontale
  const yTicks = [0, 10, 20, 30, 40]
  for (let i = 0; i < yTicks.length; i++) {
    stroke(0, 0, 15)
    strokeWeight(1)
    line(50, gtToY(yTicks[i]), 750, gtToY(yTicks[i]))
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
  const data = Object.values(donnees)
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
  noStroke()
  fill(25, 90, 100, 90)
  ellipse(yearToX(data[idx].year), gtToY(data[idx].gt), 8)

  // scénarios futurs — démarrent quand la courbe atteint 2023
  if (progression >= data.length - 1) {
    if (!scenariosData) {
      // Ancrage : décaler chaque scénario pour partir du point réel 2023
      // (correction du biais initial entre valeurs modèles et données observées)
      const ancre = data[data.length - 1].gt

      function ancrer(points) {
        const delta = ancre - points[0].median
        return points.map((p, i) => {
          const med = p.median + delta
          // 2025 : valeur observée, incertitude nulle.
          // 2026+ : spreads IPCC réels (artefact d'initialisation des modèles retiré).
          if (i === 0) return { year: p.year, p05: ancre, p25: ancre, median: ancre, p75: ancre, p95: ancre }
          return {
            year:   p.year,
            p05:    p.p05    + delta,
            p25:    p.p25    + delta,
            median: med,
            p75:    p.p75    + delta,
            p95:    p.p95    + delta,
          }
        })
      }

      scenariosData = [
        { points: ancrer(ipcc['+1.5°C']), couleur: [120, 70, 80] },
        { points: ancrer(ipcc['+2°C']),   couleur: [45,  80, 90] },
        { points: ancrer(ipcc['+3°C']),   couleur: [0,   80, 90] },
      ]
    }
    anneeScenarios = min(anneeScenarios + 0.2, 2050)
    // nPoints borné à la taille réelle du tableau (données démarrent en 2025)
    const nPoints = min(floor(anneeScenarios - 2025), scenariosData[0].points.length - 1)

    const labels = ['+1.5°C', '+2°C', '+3°C']
    for (let s = 0; s < scenariosData.length; s++) {
      const sc = scenariosData[s]
      const c = sc.couleur

      // bande externe p05–p95 (très légère)
      drawingContext.globalAlpha = 0.12
      fill(c[0], c[1], c[2])
      noStroke()
      beginShape()
      for (let i = 0; i <= nPoints; i++) vertex(yearToX(sc.points[i].year), gtToY(sc.points[i].p95))
      for (let i = nPoints; i >= 0; i--) vertex(yearToX(sc.points[i].year), gtToY(sc.points[i].p05))
      endShape(CLOSE)

      // bande intérieure p25–p75 (interquartile — "likely range" IPCC)
      drawingContext.globalAlpha = 0.25
      beginShape()
      for (let i = 0; i <= nPoints; i++) vertex(yearToX(sc.points[i].year), gtToY(sc.points[i].p75))
      for (let i = nPoints; i >= 0; i--) vertex(yearToX(sc.points[i].year), gtToY(sc.points[i].p25))
      endShape(CLOSE)
      drawingContext.globalAlpha = 1

      // médiane
      noFill()
      stroke(c[0], c[1], c[2], 90)
      strokeWeight(1.5)
      beginShape()
      for (let i = 0; i <= nPoints; i++) vertex(yearToX(sc.points[i].year), gtToY(sc.points[i].median))
      endShape()

      if (anneeScenarios >= 2050) {
        noStroke()
        fill(c[0], c[1], c[2])
        textSize(10)
        textAlign(LEFT, CENTER)
        text(labels[s], yearToX(2051), gtToY(sc.points[sc.points.length - 1].median))
      }
    }

    // budget carbone 1.5°C épuisé ~2033
    if (anneeScenarios >= 2033) {
      stroke(0, 70, 80, 60)
      strokeWeight(1)
      drawingContext.setLineDash([3, 3])
      line(yearToX(2033), 60, yearToX(2033), 350)
      drawingContext.setLineDash([])
      noStroke()
      fill(0, 70, 80)
      textSize(9)
      textAlign(CENTER, BASELINE)
      text('budget 1.5°C', yearToX(2033), 57)
      text('~2033 (p=50%)', yearToX(2033), 47)
    }
  }
}

function mousePressed() {
  progression = 0
  anneeScenarios = 2025
  scenariosData = null
}

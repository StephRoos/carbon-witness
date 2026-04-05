let donnees
let progression = 0
let anneeScenarios = 2023  // démarre à 2023 quand la courbe est terminée
let scenariosData = null  // calculé une seule fois pour éviter le flickering

function preload() {
  donnees = loadJSON('../phase1/emissions.json')
}

function setup() {
  createCanvas(920, 400)
  colorMode(HSB, 360, 100, 100, 100)
}

function yearToX(year) { return 50 + ((year - 1959) / (2050 - 1959)) * 800 }
function gtToY(gt)      { return 350 - (gt / 45) * 300 }

function calculerBornes(depart, arrivee, nSimulations) {
  const bornes = []
  for (let year = 2023; year <= 2050; year++) {
    const progression = (year - 2023) / (2050 - 2023)
    const enveloppe = Math.sin(progression * Math.PI)
    const tendance = depart + (arrivee - depart) * progression
    const valeurs = []
    for (let i = 0; i < nSimulations; i++) {
      const deviation = (Math.random() - 0.5) * 8
      valeurs.push(tendance + deviation * enveloppe + (Math.random() - 0.5) * 3 * enveloppe)
    }
    valeurs.sort((a, b) => a - b)
    bornes.push({ year, min: valeurs[0], max: valeurs[valeurs.length - 1], median: valeurs[Math.floor(nSimulations / 2)] })
  }
  return bornes
}

function draw() {
  background(240, 30, 10)

  // titre
  noStroke()
  fill(0, 0, 80)
  textFont('monospace')
  textSize(14)
  textAlign(LEFT, BASELINE)
  text('Émissions mondiales CO₂ — fossiles (GtCO₂/an)', 50, 30)

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
    line(yearToX(data[i-1].year), gtToY(data[i-1].gt),
         yearToX(data[i].year),   gtToY(data[i].gt))
  }

  // point lumineux à la tête
  const idx = floor(progression)
  noStroke()
  fill(25, 90, 100, 90)
  ellipse(yearToX(data[idx].year), gtToY(data[idx].gt), 8)

  // trajectoire Paris — synchronisée avec l'année courante de la courbe
  const anneeActuelle = data[floor(progression)].year
  if (anneeActuelle >= 2015) {
    const pente = (17.5 - 35.4) / (2030 - 2015)
    const parisAnnee = min(anneeActuelle, 2030)
    const parisGt    = 35.4 + pente * (parisAnnee - 2015)
    stroke(0, 80, 90)
    strokeWeight(1)
    drawingContext.setLineDash([6, 3])
    line(yearToX(2015), gtToY(35.4), yearToX(parisAnnee), gtToY(parisGt))
    drawingContext.setLineDash([])
    if (anneeActuelle >= 2023) {
      noStroke()
      fill(0, 80, 90)
      textSize(11)
      textAlign(RIGHT, BASELINE)
      text('Trajectoire Paris +1.5°C', yearToX(2022), gtToY(25))
    }
  }

  // scénarios futurs — démarrent quand la courbe atteint 2023
  if (progression >= data.length - 1) {
    if (!scenariosData) {
      const depart = data[data.length - 1].gt
      scenariosData = [
        { bornes: calculerBornes(depart, 5,  100), couleur: [120, 70, 80] },
        { bornes: calculerBornes(depart, 15, 100), couleur: [45,  80, 90] },
        { bornes: calculerBornes(depart, 35, 100), couleur: [0,   80, 90] },
      ]
    }
    anneeScenarios = min(anneeScenarios + 0.2, 2050)  // même vitesse que la courbe
    const nPoints = floor(anneeScenarios - 2023)  // années dessinées depuis 2023

    const labels = ['+1.5°C', '+2°C', '+3°C']
    for (let s = 0; s < scenariosData.length; s++) {
      const sc = scenariosData[s]
      const c = sc.couleur

      // zone remplie
      drawingContext.globalAlpha = 0.2
      fill(c[0], c[1], c[2])
      noStroke()
      beginShape()
      for (let i = 0; i <= nPoints; i++) vertex(yearToX(sc.bornes[i].year), gtToY(sc.bornes[i].max))
      for (let i = nPoints; i >= 0; i--) vertex(yearToX(sc.bornes[i].year), gtToY(sc.bornes[i].min))
      endShape(CLOSE)
      drawingContext.globalAlpha = 1

      // médiane
      noFill()
      stroke(c[0], c[1], c[2], 90)
      strokeWeight(1.5)
      beginShape()
      for (let i = 0; i <= nPoints; i++) vertex(yearToX(sc.bornes[i].year), gtToY(sc.bornes[i].median))
      endShape()

      // label à la fin
      if (anneeScenarios >= 2050) {
        noStroke()
        fill(c[0], c[1], c[2])
        textSize(10)
        textAlign(LEFT, CENTER)
        text(labels[s], yearToX(2051), gtToY(sc.bornes[sc.bornes.length - 1].median))
      }

      // labels de probabilité sous le premier scénario
      if (s === 0 && anneeScenarios >= 2050) {
        fill(c[0], c[1], c[2], 60)
        textSize(9)
        textAlign(LEFT, CENTER)
        text('fourchette probable', yearToX(2051), gtToY(sc.bornes[sc.bornes.length - 1].median) + 14)
        text('── médiane',          yearToX(2051), gtToY(sc.bornes[sc.bornes.length - 1].median) + 26)
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
      text('épuisé ~2033', yearToX(2033), 47)
    }
  }
}

function mousePressed() {
  progression = 0
  anneeScenarios = 2023
  scenariosData = null
}

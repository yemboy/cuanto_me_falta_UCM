// Add episodes arrays to series entries in data.js
const fs = require('fs');

// Parse the series duration file
const seriesContent = fs.readFileSync('/Users/yemboy/Documents/GitHub/cuanto_me_falta_UCM/docs/duracion_series.md', 'utf-8');
const sLines = seriesContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);

const seriesMap = {};
let currentSeries = null;

for (let i = 0; i < sLines.length; i++) {
  const line = sLines[i];
  if (line.startsWith('⏱️ Duraciones') || line.startsWith('📺') || line.startsWith('📓') || 
      line === 'Título' || line === 'Año' || line === 'Duración' || line === 'Película' ||
      line.startsWith('Ubicación') || line.startsWith('(Series canon')) continue;
  
  const totalMatch = line.match(/^⏱️ Total.*?:\s*(.+?)(?:\s*\(|$)/);
  if (totalMatch && currentSeries) {
    currentSeries.duration = totalMatch[1].trim();
    continue;
  }
  
  const epMatch = line.match(/^Episodio (\d+):\s*(.+?)\s*-\s*(\d+)\s*min$/);
  if (epMatch && currentSeries) {
    currentSeries.episodes.push({
      name: `Ep. ${epMatch[1]}: ${epMatch[2]}`,
      duration: `${epMatch[3]}m`
    });
    continue;
  }
  
  const nextLine = sLines[i + 1] || '';
  if (nextLine.startsWith('⏱️ Total')) {
    currentSeries = { duration: '', episodes: [] };
    seriesMap[line] = currentSeries;
  }
}

const titleMapping = {
  "WandaVision (2021)": "WandaVision",
  "The Falcon and the Winter Soldier (2021)": "The Falcon and the Winter Soldier",
  "Loki - Temporada 1 (2021)": "Loki — Temporada 1",
  "What If...? - Temporada 1 (2021)": "What If...? — Temporada 1",
  "Hawkeye (2021)": "Hawkeye",
  "Moon Knight (2022)": "Moon Knight",
  "Ms. Marvel (2022)": "Ms. Marvel",
  "She-Hulk: Attorney at Law (2022)": "She-Hulk: Defensora de Héroes",
  "Secret Invasion (2023)": "Secret Invasion",
  "Loki - Temporada 2 (2023)": "Loki — Temporada 2",
  "What If...? - Temporada 2 (2023)": "What If...? — Temporada 2",
  "Echo (2024)": "Echo",
  "X-Men '97 - Temporada 1 (2024)": "X-Men '97 — T1",
  "Agatha All Along (2024)": "Agatha All Along",
  "Daredevil - Temporada 1 (2015)": "Daredevil — Temporada 1",
  "Daredevil - Temporada 2 (2016)": "Daredevil — Temporada 2",
  "Daredevil - Temporada 3 (2018)": "Daredevil — Temporada 3",
  "Jessica Jones - Temporada 1 (2015)": "Jessica Jones — Temporada 1",
  "Jessica Jones - Temporada 2 (2018)": "Jessica Jones — Temporada 2",
  "Jessica Jones - Temporada 3 (2019)": "Jessica Jones — Temporada 3",
  "Luke Cage - Temporada 1 (2016)": "Luke Cage — Temporada 1",
  "Luke Cage - Temporada 2 (2018)": "Luke Cage — Temporada 2",
  "Iron Fist - Temporada 1 (2017)": "Iron Fist — Temporada 1",
  "Iron Fist - Temporada 2 (2018)": "Iron Fist — Temporada 2",
  "The Defenders (2017)": "The Defenders",
  "The Punisher - Temporada 1 (2017)": "The Punisher — Temporada 1",
  "The Punisher - Temporada 2 (2019)": "The Punisher — Temporada 2",
};

const finalMap = {};
for (const [seriesKey, marathonTitle] of Object.entries(titleMapping)) {
  if (seriesMap[seriesKey]) {
    finalMap[marathonTitle] = seriesMap[seriesKey];
  }
}

// Read data.js and process line by line
let dataContent = fs.readFileSync('/Users/yemboy/Documents/GitHub/cuanto_me_falta_UCM/data.js', 'utf-8');

// Normalize line endings
dataContent = dataContent.replace(/\r\n/g, '\n');

let changeCount = 0;

for (const [title, seriesData] of Object.entries(finalMap)) {
  const titlePattern = `"title": "${title}"`;
  const titleIdx = dataContent.indexOf(titlePattern);
  
  if (titleIdx === -1) {
    console.log(`NOT FOUND: ${title}`);
    continue;
  }
  
  // Check if episodes already exist
  const blockEnd = dataContent.indexOf('\n  }', titleIdx);
  if (blockEnd === -1) {
    console.log(`NO CLOSING BRACE: ${title}`);
    continue;
  }
  
  const block = dataContent.substring(titleIdx, blockEnd);
  if (block.includes('"episodes"')) {
    console.log(`ALREADY HAS EPISODES: ${title}`);
    continue;
  }
  
  // Build episodes JSON string
  const episodesArr = seriesData.episodes.map(ep => {
    const escapedName = ep.name.replace(/"/g, '\\"');
    return `      { "name": "${escapedName}", "duration": "${ep.duration}" }`;
  });
  
  const insertion = `,\n    "episodes": [\n${episodesArr.join(',\n')}\n    ]`;
  
  // Insert before the closing \n  }
  dataContent = dataContent.substring(0, blockEnd) + insertion + dataContent.substring(blockEnd);
  changeCount++;
  console.log(`✅ ${title} (${seriesData.episodes.length} episodes)`);
}

// Write back with original line endings
fs.writeFileSync('/Users/yemboy/Documents/GitHub/cuanto_me_falta_UCM/data.js', dataContent, 'utf-8');
console.log(`\n✅ Added episodes to ${changeCount} series entries`);

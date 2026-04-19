// Parse duracion_series.md and add duration + episodes to data.js
const fs = require('fs');

// Parse the series duration file
const seriesContent = fs.readFileSync('/Users/yemboy/Documents/GitHub/cuanto_me_falta_UCM/docs/duracion_series.md', 'utf-8');
const lines = seriesContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);

// Build series data mapping: title -> { duration, episodes: [{name, duration}] }
const seriesMap = {};
let currentSeries = null;
let currentKey = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Skip headers
  if (line.startsWith('⏱️ Duraciones') || line.startsWith('📺') || line.startsWith('📓') || 
      line === 'Título' || line === 'Año' || line === 'Duración' || line === 'Película' ||
      line.startsWith('Ubicación') || line.startsWith('(Series canon')) continue;
  
  // Check for total duration line
  const totalMatch = line.match(/^⏱️ Total.*?:\s*(.+?)(?:\s*\(|$)/);
  if (totalMatch && currentSeries) {
    currentSeries.duration = totalMatch[1].trim();
    continue;
  }
  
  // Check for episode line
  const epMatch = line.match(/^Episodio (\d+):\s*(.+?)\s*-\s*(\d+)\s*min$/);
  if (epMatch && currentSeries) {
    currentSeries.episodes.push({
      name: `Ep. ${epMatch[1]}: ${epMatch[2]}`,
      duration: `${epMatch[3]}m`
    });
    continue;
  }
  
  // Otherwise it might be a series title
  // Check if next non-empty line is a total duration
  const nextLine = lines[i + 1] || '';
  if (nextLine.startsWith('⏱️ Total')) {
    currentSeries = { duration: '', episodes: [] };
    currentKey = line;
    seriesMap[currentKey] = currentSeries;
  }
}

// Now map series keys to marathonData titles
const titleMapping = {
  // Disney+ Phase 4
  "WandaVision (2021)": "WandaVision",
  "The Falcon and the Winter Soldier (2021)": "The Falcon and the Winter Soldier",
  "Loki - Temporada 1 (2021)": "Loki — Temporada 1",
  "What If...? - Temporada 1 (2021)": "What If...? — Temporada 1",
  "Hawkeye (2021)": "Hawkeye",
  "Moon Knight (2022)": "Moon Knight",
  "Ms. Marvel (2022)": "Ms. Marvel",
  "She-Hulk: Attorney at Law (2022)": "She-Hulk: Defensora de Héroes",
  // Disney+ Phase 5
  "Secret Invasion (2023)": "Secret Invasion",
  "Loki - Temporada 2 (2023)": "Loki — Temporada 2",
  "What If...? - Temporada 2 (2023)": "What If...? — Temporada 2",
  "Echo (2024)": "Echo",
  "X-Men '97 - Temporada 1 (2024)": "X-Men '97 — T1",
  "Agatha All Along (2024)": "Agatha All Along",
  // Netflix Defenders saga
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

// Build the final mapping: marathonData title -> { duration, episodes }
const finalMap = {};
for (const [seriesKey, marathonTitle] of Object.entries(titleMapping)) {
  if (seriesMap[seriesKey]) {
    finalMap[marathonTitle] = seriesMap[seriesKey];
  } else {
    console.log(`⚠️  No data found for: ${seriesKey}`);
  }
}

console.log(`\nFound ${Object.keys(finalMap).length} series with episode data:\n`);
for (const [title, data] of Object.entries(finalMap)) {
  console.log(`  ${title}: ${data.duration} (${data.episodes.length} episodes)`);
}

// Now modify data.js
let dataContent = fs.readFileSync('/Users/yemboy/Documents/GitHub/cuanto_me_falta_UCM/data.js', 'utf-8');
const dataLines = dataContent.split('\n');
const newDataLines = [];

for (let i = 0; i < dataLines.length; i++) {
  const line = dataLines[i];
  newDataLines.push(line);
  
  const titleMatch = line.match(/^\s*"title":\s*"(.+?)"\s*,?\s*$/);
  if (titleMatch) {
    const title = titleMatch[1];
    const seriesData = finalMap[title];
    
    if (seriesData) {
      const indent = line.match(/^(\s*)/)[1];
      const nextLine = dataLines[i + 1] || '';
      
      // Skip if duration already exists
      if (!nextLine.includes('"duration"')) {
        newDataLines.push(`${indent}"duration": "${seriesData.duration}",`);
      }
      
      // Check if episodes already exists (skip ahead to find it)
      let hasEpisodes = false;
      for (let j = i + 1; j < Math.min(i + 10, dataLines.length); j++) {
        if (dataLines[j].includes('"episodes"')) { hasEpisodes = true; break; }
        if (dataLines[j].includes('}')) break;
      }
      
      if (!hasEpisodes) {
        // Find the line before the closing brace of this object to insert episodes
        // We'll insert after the last property before }
        // For now, we need to find where to insert. Let's collect the episode data
        // and insert it at the right place later.
        // Actually, let's find the closing } of this object and insert before it
      }
    }
  }
}

// Strategy 2: Do a second pass to add episodes array before closing }
dataContent = newDataLines.join('\n');

// For each series, find the entry and add episodes before the closing }
for (const [title, seriesData] of Object.entries(finalMap)) {
  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Build episodes JSON
  const episodesJSON = seriesData.episodes.map(ep => {
    const escapedName = ep.name.replace(/"/g, '\\"');
    return `{ "name": "${escapedName}", "duration": "${ep.duration}" }`;
  });
  
  // Find the pattern: "title": "TITLE", ... then the next },  or }
  // We need to find the entry block and add episodes before the closing }
  const titlePattern = `"title": "${title}"`;
  const titleIdx = dataContent.indexOf(titlePattern);
  
  if (titleIdx === -1) {
    console.log(`Could not find title in data.js: ${title}`);
    continue;
  }
  
  // Find the closing } of this object (find next "  }" or "  },")
  let searchFrom = titleIdx;
  let closingIdx = -1;
  
  // Find each subsequent } and check if it's the object closer
  let pos = searchFrom;
  while (pos < dataContent.length) {
    const nextClose = dataContent.indexOf('\n  }', pos);
    if (nextClose === -1) break;
    // Check if this is followed by , or \n
    const afterClose = dataContent.substring(nextClose + 3, nextClose + 5);
    if (afterClose.startsWith(',') || afterClose.startsWith('\n')) {
      closingIdx = nextClose;
      break;
    }
    pos = nextClose + 1;
  }
  
  if (closingIdx === -1) {
    console.log(`Could not find closing brace for: ${title}`);
    continue;
  }
  
  // Check if episodes already added
  const blockContent = dataContent.substring(titleIdx, closingIdx);
  if (blockContent.includes('"episodes"')) continue;
  
  // Insert episodes array before the closing }
  const indent = '    ';
  const episodesStr = `,\n${indent}"episodes": [\n${indent}  ${episodesJSON.join(`,\n${indent}  `)}\n${indent}]`;
  
  // Insert before the \n  }
  dataContent = dataContent.substring(0, closingIdx) + episodesStr + dataContent.substring(closingIdx);
}

fs.writeFileSync('/Users/yemboy/Documents/GitHub/cuanto_me_falta_UCM/data.js', dataContent, 'utf-8');
console.log('\n✅ data.js updated with durations and episodes');

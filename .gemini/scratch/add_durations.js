// Script to add duration field to marathonData entries in data.js
const fs = require('fs');

// Duration mapping: title substring -> duration
const durationMap = {
  // PRE-UCM: Blade
  "Blade (1998)": "2h 00m",
  "Blade II (2002)": "2h 17m",
  "Blade: Trinity (2004)": "2h 24m",
  // PRE-UCM: X-Men
  "X-Men (2000)": "1h 44m",
  "X2: X-Men United (2003)": "2h 14m",
  "X-Men: La Batalla Final (2006)": "1h 44m",
  "X-Men Orígenes: Wolverine (2009)": "1h 47m",
  "X-Men: Primera Generación (2011)": "2h 11m",
  "Wolverine Inmortal (2013)": "2h 06m",
  "X-Men: Días del Futuro Pasado (2014)": "2h 12m",
  "Deadpool (2016)": "1h 48m",
  "X-Men: Apocalipsis (2016)": "2h 24m",
  "Logan (2017)": "2h 17m",
  "Deadpool 2 (2018)": "1h 59m",
  "X-Men: Dark Phoenix (2019)": "1h 54m",
  "Los Nuevos Mutantes (2020)": "1h 34m",
  // PRE-UCM: Spider-Man
  "Spider-Man (2002)": "2h 01m",
  "Spider-Man 2 (2004)": "2h 07m",
  "Spider-Man 3 (2007)": "2h 19m",
  // PRE-UCM: Daredevil/Elektra
  "Daredevil (2003)": "1h 43m",
  "Elektra (2005)": "1h 37m",
  // PRE-UCM: Fantastic Four
  "Los Cuatro Fantásticos (2005)": "1h 46m",
  "Los 4 Fantásticos y Silver Surfer (2007)": "1h 32m",
  // PRE-UCM: Amazing Spider-Man
  "The Amazing Spider-Man (2012)": "2h 16m",
  "The Amazing Spider-Man 2 (2014)": "2h 22m",
  // PRE-UCM: Sony SSU
  "Venom (2018)": "1h 52m",
  "Venom: Let There Be Carnage (2021)": "1h 37m",
  "Morbius (2022)": "1h 44m",
  "Venom: The Last Dance (2024)": "1h 49m",
  // Phase 1
  "Capitán América: El Primer Vengador": "2h 04m",
  "Capitana Marvel": "2h 03m",
  "Iron Man": "2h 06m",      // exact match needed
  "Iron Man 2": "2h 04m",    // exact match needed
  "El Increíble Hulk": "1h 52m",
  "Thor": "1h 55m",          // exact match needed
  "Los Vengadores": "2h 23m",
  // Phase 2
  "Iron Man 3": "2h 10m",
  "Thor: Un Mundo Oscuro": "1h 52m",
  "Capitán América: El Soldado del Invierno": "2h 16m",
  "Guardianes de la Galaxia Vol. 1": "2h 01m",
  "Guardianes de la Galaxia Vol. 2": "2h 16m",
  "Avengers: Era de Ultrón": "2h 21m",
  "Ant-Man": "1h 57m",       // exact match needed
  // Phase 3
  "Capitán América: Civil War": "2h 27m",
  "Black Widow": "2h 14m",
  "Black Panther": "2h 14m", // exact match needed
  "Spider-Man: Homecoming": "2h 13m",
  "Doctor Strange": "1h 55m", // exact match needed
  "Thor: Ragnarok": "2h 10m",
  "Ant-Man and the Wasp": "1h 58m", // exact match needed
  "Avengers: Infinity War": "2h 29m",
  "Avengers: Endgame": "3h 01m",
  // Phase 4
  "Shang-Chi y la Leyenda de los Diez Anillos": "2h 12m",
  "Spider-Man: Far From Home": "2h 09m",
  "Eternals": "2h 36m",
  "Spider-Man: No Way Home": "2h 28m",
  "Doctor Strange en el Multiverso de la Locura": "2h 06m",
  "Thor: Love and Thunder": "1h 59m",
  "Black Panther: Wakanda Forever": "2h 41m",
  "Werewolf by Night": "53m",
  "Guardianes de la Galaxia: Especial Navideño": "42m",
  // Phase 5
  "Ant-Man and the Wasp: Quantumania": "2h 05m",
  "Guardianes de la Galaxia Vol. 3": "2h 30m",
  "The Marvels": "1h 45m",
  "Deadpool & Wolverine": "2h 08m",
  // Phase 6
  "The Fantastic Four: First Steps": "1h 55m",
  "Captain America: Brave New World": "1h 59m",
  "Thunderbolts*": "2h 07m",
};

// Read the data.js file
let content = fs.readFileSync('/Users/yemboy/Documents/GitHub/cuanto_me_falta_UCM/data.js', 'utf-8');

// Parse marathonData entries and add duration
// Strategy: for each entry that has a matching title, add "duration" field after "title" line

let changeCount = 0;
let noMatchTitles = [];

// Find all marathon entries and try to match
const lines = content.split('\n');
const newLines = [];

for (let i = 0; i < lines.length; i++) {
  newLines.push(lines[i]);
  
  // Check if this line contains a "title" field in marathonData section
  const titleMatch = lines[i].match(/^\s*"title":\s*"(.+?)"/);
  if (titleMatch) {
    const title = titleMatch[1];
    // Check next line is NOT already a duration
    const nextLine = lines[i + 1] || '';
    if (nextLine.includes('"duration"')) continue;
    
    // Try exact match first
    let duration = durationMap[title];
    
    // If no exact match, try matching by checking if the title starts with a key
    if (!duration) {
      for (const [key, val] of Object.entries(durationMap)) {
        if (title === key || title.startsWith(key + ' ') || title.startsWith(key + ':') || title.startsWith(key + ' —')) {
          duration = val;
          break;
        }
      }
    }
    
    if (duration) {
      // Get the indentation from the title line
      const indent = lines[i].match(/^(\s*)/)[1];
      // Add duration line after title line
      newLines.push(`${indent}"duration": "${duration}",`);
      changeCount++;
    }
  }
}

content = newLines.join('\n');
fs.writeFileSync('/Users/yemboy/Documents/GitHub/cuanto_me_falta_UCM/data.js', content, 'utf-8');

console.log(`Added ${changeCount} duration fields.`);

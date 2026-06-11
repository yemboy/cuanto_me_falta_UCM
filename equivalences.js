// Equivalencias entre datasets — mismo título en Fast Track / 5 Rápidas / Maratón.
// Formato: alias (fast-* / quick5-*) -> id canónico del maratón (marathon-*).
// app.js construye con esto grupos bidireccionales: marcar cualquier id del grupo
// propaga el mismo estado a todos los demás.
//
// NOTA: "fast-xmen22003" (X-Men 2, 2003) NO tiene equivalente porque el maratón
// no incluye esa película (salta de X-Men 2000 a La Batalla Final 2006).
const itemEquivalences = {
  // Fast Track -> Maratón
  "fast-ironman2008": "marathon-ironman",
  "fast-losvengadores2012": "marathon-losvengadores",
  "fast-capitánaméricacivilwar2016": "marathon-capitánaméricacivilwar",
  "fast-blackpanther2018": "marathon-blackpanther",
  "fast-avengersinfinitywar2018": "marathon-avengersinfinitywar",
  "fast-avengersendgame2019": "marathon-avengersendgame",
  "fast-doctorstrangeenelmultiversodelalocura": "marathon-doctorstrangeenelmultiversodelalocura",
  "fast-captainamericabravenewworld2025": "marathon-captainamericabravenewworld",
  "fast-thunderbolts2025": "marathon-thunderbolts",
  "fast-thefantasticfourfirststeps2025": "marathon-thefantasticfourfirststeps",
  "fast-capitánaméricaelprimervengador2011": "marathon-capitánaméricaelprimervengador",
  "fast-capitánaméricaelsoldadodelinvierno": "marathon-capitánaméricaelsoldadodelinvierno",
  "fast-spidermannowayhome2021": "marathon-spidermannowayhome",
  "fast-blackpantherwakandaforever2022": "marathon-blackpantherwakandaforever",
  "fast-deadpoolwolverine2024": "marathon-deadpoolwolverine",
  "fast-shangchiylaleyendadelosdiezanillos": "marathon-shangchiylaleyendadelosdiezanillos",
  "fast-antmanandthewaspquantumania2023": "marathon-antmanandthewaspquantumania",
  "fast-thorragnarok2017": "marathon-thorragnarok",
  "fast-avengerseradeultrón2015": "marathon-avengerseradeultrón",
  "fast-guardianesdelagalaxiavol32023": "marathon-guardianesdelagalaxiavol3",
  "fast-thorloveandthunder2022": "marathon-thorloveandthunder",
  "fast-themarvels2023": "marathon-themarvels",
  "fast-blackwidow2021": "marathon-blackwidow",
  "fast-xmen2000": "marathon-xmen2000",

  // 5 Rápidas -> Maratón
  "quick5-avengersendgame2019": "marathon-avengersendgame",
  "quick5-civilwar2016": "marathon-capitánaméricacivilwar",
  "quick5-thunderbolts2025": "marathon-thunderbolts",
  "quick5-fantasticfour2025": "marathon-thefantasticfourfirststeps",
  "quick5-bravenewworld2025": "marathon-captainamericabravenewworld"
};

// Real-world release dates — mapped by marathon ID
// Source: Date_release_MUC.txt
const releaseDates = {
  // PRE-UCM: Blade
  "marathon-blade1998": "21 agosto 1998",
  "marathon-bladeii2002": "22 marzo 2002",
  "marathon-bladetrinity2004": "8 diciembre 2004",

  // PRE-UCM: X-Men (Fox)
  "marathon-xmen2000": "14 julio 2000",
  "marathon-x2xmenunited2003": "2 mayo 2003",
  "marathon-xmenlabatallafinal2006": "26 mayo 2006",
  "marathon-xmenorígeneswolverine2009": "1 mayo 2009",
  "marathon-xmenprimerageneración2011": "3 junio 2011",
  "marathon-wolverineinmortal2013": "26 julio 2013",
  "marathon-xmendíasdelfuturopasado2014": "23 mayo 2014",
  "marathon-deadpool2016": "12 febrero 2016",
  "marathon-xmenapocalipsis2016": "27 mayo 2016",
  "marathon-logan2017": "3 marzo 2017",
  "marathon-deadpool22018": "18 mayo 2018",
  "marathon-xmendarkphoenix2019": "7 junio 2019",
  "marathon-losnuevosmutantes2020": "28 agosto 2020",

  // PRE-UCM: Spider-Man (Tobey)
  "marathon-spiderman2002": "3 mayo 2002",
  "marathon-spiderman22004": "30 junio 2004",
  "marathon-spiderman32007": "4 mayo 2007",

  // PRE-UCM: Daredevil / Elektra
  "marathon-daredevil2003": "14 febrero 2003",
  "marathon-elektra2005": "14 enero 2005",

  // PRE-UCM: Fantastic Four (Fox)
  "marathon-loscuatrofantásticos2005": "8 julio 2005",
  "marathon-los4fantásticosysilversurfer2007": "15 junio 2007",

  // PRE-UCM: Amazing Spider-Man
  "marathon-theamazingspiderman2012": "3 julio 2012",
  "marathon-theamazingspiderman22014": "2 mayo 2014",

  // PRE-UCM: Sony SSU
  "marathon-venom2018": "5 octubre 2018",
  "marathon-venomlettherebecarnage2021": "1 octubre 2021",
  "marathon-morbius2022": "1 abril 2022",
  "marathon-venomthelastdance2024": "25 octubre 2024",

  // ERA ANTIGUA: Wakanda
  "marathon-eyesofwakandaep1": "1 agosto 2025",
  "marathon-eyesofwakandaep2": "1 agosto 2025",
  "marathon-eyesofwakandaep3": "1 agosto 2025",
  "marathon-eyesofwakandaep4": "1 agosto 2025",

  // FASE 1
  "marathon-capitánaméricaelprimervengador": "22 julio 2011",
  "marathon-agentcarteroneshot": "3 septiembre 2013",
  "marathon-agentcartertemporada1": "6 enero 2015",
  "marathon-agentcartertemporada2": "19 enero 2016",
  "marathon-capitanamarvel": "8 marzo 2019",
  "marathon-ironman": "2 mayo 2008",
  "marathon-ironman2": "7 mayo 2010",
  "marathon-afunnythinghappenedonthewaytothorshammer": "25 octubre 2011",
  "marathon-elincreíblehulk": "13 junio 2008",
  "marathon-thor": "6 mayo 2011",
  "marathon-theconsultantoneshot": "13 septiembre 2011",
  "marathon-losvengadores": "4 mayo 2012",
  "marathon-item47oneshot": "25 septiembre 2012",

  // FASE 2
  "marathon-ironman3": "3 mayo 2013",
  "marathon-agentsofshieldt1eps17": "24 septiembre 2013",
  "marathon-thorunmundooscuro": "8 noviembre 2013",
  "marathon-allhailthekingoneshot": "4 febrero 2014",
  "marathon-agentsofshieldt1eps816": "24 septiembre 2013",
  "marathon-capitánaméricaelsoldadodelinvierno": "4 abril 2014",
  "marathon-agentsofshieldt1eps1722": "24 septiembre 2013",
  "marathon-guardianesdelagalaxiavol1": "1 agosto 2014",
  "marathon-guardianesdelagalaxiavol2": "5 mayo 2017",
  "marathon-yosoygroottemporada1": "10 agosto 2022",
  "marathon-yosoygroottemporada2": "6 septiembre 2023",
  "marathon-agentsofshieldtemporada2": "23 septiembre 2014",
  "marathon-daredeviltemporada1": "10 abril 2015",
  "marathon-jessicajonestemporada1": "20 noviembre 2015",
  "marathon-avengerseradeultrón": "1 mayo 2015",
  "marathon-antman": "17 julio 2015",
  "marathon-daredeviltemporada2": "18 marzo 2016",
  "marathon-lukecagetemporada1": "30 septiembre 2016",

  // FASE 3
  "marathon-agentsofshieldtemporada3": "29 septiembre 2015",
  "marathon-ironfisttemporada1": "17 marzo 2017",
  "marathon-thedefenders": "18 agosto 2017",
  "marathon-capitánaméricacivilwar": "6 mayo 2016",
  "marathon-blackwidow": "9 julio 2021",
  "marathon-blackpanther": "16 febrero 2018",
  "marathon-spidermanhomecoming": "7 julio 2017",
  "marathon-thepunishertemporada1": "17 noviembre 2017",
  "marathon-doctorstrange": "4 noviembre 2016",
  "marathon-agentsofshieldtemporada4": "20 septiembre 2016",
  "marathon-jessicajonestemporada2": "8 marzo 2018",
  "marathon-lukecagetemporada2": "22 junio 2018",
  "marathon-ironfisttemporada2": "7 septiembre 2018",
  "marathon-thorragnarok": "3 noviembre 2017",
  "marathon-daredeviltemporada3": "19 octubre 2018",
  "marathon-thepunishertemporada2": "18 enero 2019",
  "marathon-jessicajonestemporada3": "14 junio 2019",
  "marathon-agentsofshieldtemporada5": "1 diciembre 2017",
  "marathon-antmanandthewasp": "6 julio 2018",
  "marathon-avengersinfinitywar": "27 abril 2018",
  "marathon-agentsofshieldtemporada6": "10 mayo 2019",
  "marathon-agentsofshieldtemporada7": "27 mayo 2020",
  "marathon-avengersendgame": "26 abril 2019",

  // FASE 4
  "marathon-lokitemporada1": "9 junio 2021",
  "marathon-whatiftemporada1": "11 agosto 2021",
  "marathon-wandavision": "15 enero 2021",
  "marathon-thefalconandthewintersoldier": "19 marzo 2021",
  "marathon-shangchiylaleyendadelosdiezanillos": "3 septiembre 2021",
  "marathon-spidermanfarfromhome": "2 julio 2019",
  "marathon-eternals": "5 noviembre 2021",
  "marathon-spidermannowayhome": "17 diciembre 2021",
  "marathon-doctorstrangeenelmultiversodelalocura": "6 mayo 2022",
  "marathon-hawkeye": "24 noviembre 2021",
  "marathon-moonknight": "30 marzo 2022",
  "marathon-echo": "9 enero 2024",
  "marathon-shehulkdefensoradehéroes": "18 agosto 2022",
  "marathon-msmarvel": "8 junio 2022",
  "marathon-thorloveandthunder": "8 julio 2022",
  "marathon-werewolfbynight": "7 octubre 2022",
  "marathon-blackpantherwakandaforever": "11 noviembre 2022",
  "marathon-guardianesdelagalaxiaespecialnavideño": "25 noviembre 2022",
  "marathon-ironheart": "24 junio 2025",

  // FASE 5
  "marathon-antmanandthewaspquantumania": "17 febrero 2023",
  "marathon-guardianesdelagalaxiavol3": "5 mayo 2023",
  "marathon-secretinvasion": "21 junio 2023",
  "marathon-themarvels": "10 noviembre 2023",
  "marathon-lokitemporada2": "5 octubre 2023",
  "marathon-deadpoolwolverine": "26 julio 2024",
  "marathon-whatiftemporada2": "22 diciembre 2023",
  "marathon-agathaallalong": "18 septiembre 2024",
  "marathon-whatiftemporada3": "22 diciembre 2024",

  // FASE 6
  "marathon-daredevilbornagaintemporada1": "4 marzo 2025",
  "marathon-wonderman": "27 enero 2026",
  "marathon-captainamericabravenewworld": "14 febrero 2025",
  "marathon-thunderbolts": "2 mayo 2025",
  "marathon-daredevilbornagaintemporada2": "24 marzo 2026",
  "marathon-thepunisherespecial": "~Mediados 2026",
  "marathon-thefantasticfourfirststeps": "25 julio 2025",
  "marathon-spidermanbrandnewday": "31 julio 2026",
  "marathon-visionquest": "~Finales 2026",
  "marathon-avengersdoomsday": "18 diciembre 2026",

  // FUERA DE LA LÍNEA TEMPORAL
  "marathon-yourfriendlyneighborhoodspiderman": "29 enero 2025",
  "marathon-yourfriendlyneighborhoodspidermant2": "~Otoño 2026",
  "marathon-xmen97t1": "20 marzo 2024",
  "marathon-xmen97t2": "~Verano 2026",
  "marathon-marvelzombies": "24 septiembre 2025",
  "marathon-spidernoir": "~Mayo 2026",
  "marathon-inhumanstemporada1": "29 septiembre 2017",
  "marathon-runawaystemporadas13": "21 noviembre 2017",
  "marathon-cloakdaggertemporadas12": "7 junio 2018",
  "marathon-helstromtemporada1": "16 octubre 2020",
};

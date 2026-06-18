const mTick = document.getElementById("mTick");
const mActive = document.getElementById("mActive");
const mCompleted = document.getElementById("mCompleted");
const mRevenue = document.getElementById("mRevenue");
const entries = document.getElementById("entries");
const exits = document.getElementById("exits");
const trips = document.getElementById("trips");
const statusEl = document.getElementById("status");
const trafficMap = document.getElementById("trafficMap");
const alertsEl = document.getElementById("alerts");
const networkTitle = document.getElementById("networkTitle");
const badgeRoads = document.getElementById("badgeRoads");
const badgeCameras = document.getElementById("badgeCameras");
const badgeFleet = document.getElementById("badgeFleet");
const spotlight = document.getElementById("spotlight");
const roadHealth = document.getElementById("roadHealth");
const cameraWatch = document.getElementById("cameraWatch");
const revenueMix = document.getElementById("revenueMix");
const fleetIntel = document.getElementById("fleetIntel");
const overviewBoard = document.getElementById("overviewBoard");
const riskBoard = document.getElementById("riskBoard");
const fleetBoard = document.getElementById("fleetBoard");
const tabButtons = [...document.querySelectorAll(".tab-btn")];
const langToggle = document.getElementById("langToggle");
const langMenu = document.getElementById("langMenu");
const langOptions = [...document.querySelectorAll(".lang-option")];

const btnTick1 = document.getElementById("tick1");
const btnTick5 = document.getElementById("tick5");
const btnTick20 = document.getElementById("tick20");
const btnAuto = document.getElementById("auto");
const btnReset = document.getElementById("reset");

const TEXT_IDS = {
  headerSubtitle: "header.subtitle",
  heroEyebrow: "hero.eyebrow",
  heroCopy: "hero.copy",
  metricTickLabel: "metrics.tick",
  metricActiveLabel: "metrics.activeCars",
  metricCompletedLabel: "metrics.completed",
  metricRevenueLabel: "metrics.revenue",
  roadHealthTitle: "sections.roadHealth",
  cameraWatchTitle: "sections.cameraWatch",
  revenueMixTitle: "sections.revenueMix",
  fleetIntelTitle: "sections.fleetIntel",
  commandCenterTitle: "sections.commandCenter",
  tabOverviewBtn: "tabs.overview",
  tabRiskBtn: "tabs.risk",
  tabFleetBtn: "tabs.fleet",
  entryGatesTitle: "sections.entryGates",
  exitGatesTitle: "sections.exitGates",
  activeCarsTitle: "sections.activeCars",
  thId: "table.id",
  thPlate: "table.plate",
  thEntry: "table.entry",
  thExit: "table.exit",
  thKm: "table.km",
  thTicksLeft: "table.ticksLeft",
  thToll: "table.toll",
  trafficMapTitle: "sections.trafficMap",
  mapCaption: "map.caption",
  legendConnected: "map.legend.connected",
  legendDisconnected: "map.legend.disconnected",
  legendEntry: "map.legend.entry",
  legendExit: "map.legend.exit",
  legendWarning: "map.legend.warning",
  alertsTitle: "sections.alerts"
};

let autoTimer = null;
let pollTimer = null;
let currentState = null;
let currentLanguage = localStorage.getItem("highway-network-language") || "en";

const ROAD_CONNECTIONS = [
  ["A1", "A2"],
  ["A1", "A4"],
  ["A4", "A8"],
  ["A4", "A18"],
  ["A2", "A50"]
];

const ROAD_POSITIONS = {
  A1: { x: 390, y: 90 },
  A2: { x: 560, y: 120 },
  A4: { x: 700, y: 190 },
  A8: { x: 900, y: 150 },
  A18: { x: 860, y: 280 },
  A6: { x: 250, y: 280 },
  A50: { x: 560, y: 300 }
};

const TRANSLATIONS = {
  en: {
    languageName: "English",
    header: { subtitle: "Desktop GUI + C simulator service" },
    buttons: { tick1: "Tick +1", tick5: "Tick +5", tick20: "Tick +20", startAuto: "Start Auto", stopAuto: "Stop Auto", reset: "Reset" },
    hero: {
      eyebrow: "Motorway Operations Console",
      networkName: "Poland Highway Monitoring Grid",
      copy: "Real-time motorway surveillance with camera-derived vehicle identity, suspicious behavior warnings, and live corridor visibility.",
      roadsBadge: "{count} roads",
      camerasBadge: "{count} cameras",
      activeBadge: "{count} active",
      priorityWarning: "Priority Warning",
      networkStatus: "Network Status",
      warningDetectedSuffix: "detected on {route}.",
      warningVehicle: "Vehicle {vehicle} · {make} {model} · Camera {camera}",
      stableHeadline: "Stable flow.",
      stableCopy: "No suspicious driving events currently flagged by motorway cameras.",
      stableSubcopy: "The console is tracking toll flow, camera identity, route occupancy, and suspicious travel patterns."
    },
    metrics: { tick: "Tick", activeCars: "Active Cars", completed: "Completed", revenue: "Revenue" },
    sections: {
      roadHealth: "Road Health Matrix",
      cameraWatch: "Camera Watch",
      revenueMix: "Revenue Mix",
      fleetIntel: "Fleet Intelligence",
      commandCenter: "Command Center",
      entryGates: "Entry Gates",
      exitGates: "Exit Gates",
      activeCars: "Active Cars",
      trafficMap: "Live Traffic Map",
      alerts: "Suspicious Behavior Warnings"
    },
    tabs: { overview: "Overview", risk: "Risk Radar", fleet: "Fleet Watch" },
    table: { id: "ID", plate: "Plate", entry: "Entry", exit: "Exit", km: "Km", ticksLeft: "Ticks Left", toll: "Toll" },
    map: {
      caption: "Abstract motorway topology map. Road hubs show connectivity, and cars animate from entry gate -> motorway hub -> exit gate.",
      noActiveCars: "No active cars on the network",
      legend: {
        connected: "Connected Autostrada Hub",
        disconnected: "Disconnected Autostrada Hub",
        entry: "Entry Camera Gate",
        exit: "Exit Camera Gate",
        warning: "Speeding / Suspicious Path Warning"
      }
    },
    roadHealth: { stable: "Stable", watch: "Watch", hot: "Hot", active: "active", warnings: "warnings", avg: "avg" },
    cameraWatch: { flagged: "Flagged road", clear: "Clear feed", road: "Road", lane: "Lane", entry: "Entry", exit: "Exit" },
    revenueMix: { low: "Low toll corridors", medium: "Medium toll corridors", high: "High toll corridors", total: "Total collected" },
    fleetIntel: { avgSpeed: "Avg live speed", dominantMake: "Dominant make", dominantColor: "Dominant color", warningDensity: "Warning density" },
    commandCenter: {
      networkPosture: "Network Posture",
      mostPressured: "Most Pressured Road",
      cameraCoverage: "Camera Coverage",
      latestWarnings: "Latest Warnings",
      riskHeuristic: "Risk Heuristic",
      operatorNote: "Operator Note",
      fastestCars: "Fastest Live Cars",
      identityDepth: "Identity Depth",
      flowCharacter: "Flow Character",
      denseFlow: "Dense motorway flow across primary corridors.",
      moderateFlow: "Moderate motorway load with room for throughput growth.",
      noHotRoad: "No hot corridor right now.",
      hotRoad: "{road} with {count} warnings",
      coverageText: "{count} active gate cameras across {roads} motorway corridors.",
      noWarnings: "No warnings",
      escalated: "Escalated monitoring recommended on high-speed corridors.",
      tolerance: "Warning volume remains inside expected tolerance.",
      operatorText: "Repeated speeding on the same road is the clearest signal for targeted enforcement placement.",
      noActiveCars: "No active cars",
      identityText: "Plate, make, model, color, road, route, camera source, and live toll are currently tracked per active car.",
      mixedFlow: "Mixed private and long-distance motorway traffic profile.",
      lowFlow: "Low-volume motorway stream with cleaner camera observability."
    },
    alerts: {
      none: "No suspicious behavior warnings.",
      labelCar: "Car",
      labelCamera: "Camera",
      labelSpeed: "Speed",
      labelLimit: "Limit",
      labelRoute: "Route"
    },
    entries: { none: "No entry gates" },
    exits: { none: "No exit gates" },
    trips: { none: "No active cars" },
    status: { noResponse: "No response from simulator.", error: "Simulator error: {error}{details}" },
    misc: { unknownRoute: "unknown route", currency: "PLN", nA: "n/a", noData: "n/a" }
  },
  pl: {
    languageName: "Polski",
    header: { subtitle: "Desktop GUI + usługa symulatora w C" },
    buttons: { tick1: "Tick +1", tick5: "Tick +5", tick20: "Tick +20", startAuto: "Start Auto", stopAuto: "Stop Auto", reset: "Reset" },
    hero: {
      eyebrow: "Konsola Operacyjna Autostrad",
      networkName: "Polska Sieć Monitoringu Autostrad",
      copy: "Monitorowanie autostrad w czasie rzeczywistym z identyfikacją pojazdów z kamer, ostrzeżeniami o podejrzanych zachowaniach i widocznością korytarzy ruchu.",
      roadsBadge: "{count} dróg",
      camerasBadge: "{count} kamer",
      activeBadge: "{count} aktywnych",
      priorityWarning: "Priorytetowe Ostrzeżenie",
      networkStatus: "Stan Sieci",
      warningDetectedSuffix: "wykryto na trasie {route}.",
      warningVehicle: "Pojazd {vehicle} · {make} {model} · Kamera {camera}",
      stableHeadline: "Ruch stabilny.",
      stableCopy: "Kamery autostradowe nie zgłaszają obecnie podejrzanych zdarzeń.",
      stableSubcopy: "Konsola śledzi opłaty, tożsamość z kamer, obciążenie tras i podejrzane wzorce przejazdu."
    },
    metrics: { tick: "Tick", activeCars: "Aktywne Auta", completed: "Zakończone", revenue: "Przychód" },
    sections: {
      roadHealth: "Stan Dróg",
      cameraWatch: "Podgląd Kamer",
      revenueMix: "Struktura Opłat",
      fleetIntel: "Analiza Floty",
      commandCenter: "Centrum Dowodzenia",
      entryGates: "Bramki Wjazdowe",
      exitGates: "Bramki Zjazdowe",
      activeCars: "Aktywne Auta",
      trafficMap: "Mapa Ruchu Na Żywo",
      alerts: "Ostrzeżenia o Podejrzanym Zachowaniu"
    },
    tabs: { overview: "Przegląd", risk: "Radar Ryzyka", fleet: "Obserwacja Floty" },
    table: { id: "ID", plate: "Tablica", entry: "Wjazd", exit: "Zjazd", km: "Km", ticksLeft: "Pozostałe Ticki", toll: "Opłata" },
    map: {
      caption: "Abstrakcyjna mapa topologii autostrad. Węzły dróg pokazują połączenia, a auta przemieszczają się od bramki wjazdowej przez węzeł do bramki zjazdowej.",
      noActiveCars: "Brak aktywnych aut w sieci",
      legend: {
        connected: "Połączony Węzeł Autostrady",
        disconnected: "Niepołączony Węzeł Autostrady",
        entry: "Brama Kamery Wjazdowej",
        exit: "Brama Kamery Zjazdowej",
        warning: "Przekroczenie Prędkości / Podejrzana Trasa"
      }
    },
    roadHealth: { stable: "Stabilnie", watch: "Obserwuj", hot: "Gorąco", active: "aktywnych", warnings: "ostrzeżeń", avg: "śr." },
    cameraWatch: { flagged: "Droga oznaczona", clear: "Kanał czysty", road: "Droga", lane: "Pas", entry: "Wjazd", exit: "Wyjazd" },
    revenueMix: { low: "Niskie opłaty", medium: "Średnie opłaty", high: "Wysokie opłaty", total: "Łącznie zebrano" },
    fleetIntel: { avgSpeed: "Średnia prędkość", dominantMake: "Dominująca marka", dominantColor: "Dominujący kolor", warningDensity: "Gęstość ostrzeżeń" },
    commandCenter: {
      networkPosture: "Stan Sieci",
      mostPressured: "Najbardziej Obciążona Droga",
      cameraCoverage: "Pokrycie Kamer",
      latestWarnings: "Najnowsze Ostrzeżenia",
      riskHeuristic: "Heurystyka Ryzyka",
      operatorNote: "Notatka Operatora",
      fastestCars: "Najszybsze Auta",
      identityDepth: "Zakres Identyfikacji",
      flowCharacter: "Charakter Ruchu",
      denseFlow: "Duże natężenie ruchu na głównych korytarzach.",
      moderateFlow: "Umiarkowane obciążenie autostrad z zapasem przepustowości.",
      noHotRoad: "Brak obecnie gorącego korytarza.",
      hotRoad: "{road} z liczbą ostrzeżeń: {count}",
      coverageText: "{count} aktywnych kamer bramkowych na {roads} korytarzach autostradowych.",
      noWarnings: "Brak ostrzeżeń",
      escalated: "Zalecany wzmożony nadzór na szybkich korytarzach.",
      tolerance: "Liczba ostrzeżeń mieści się w oczekiwanym zakresie.",
      operatorText: "Powtarzające się przekroczenia prędkości na tej samej drodze to najmocniejszy sygnał do ustawienia kontroli.",
      noActiveCars: "Brak aktywnych aut",
      identityText: "Dla każdego aktywnego auta śledzone są: tablica, marka, model, kolor, droga, trasa, kamera źródłowa i opłata.",
      mixedFlow: "Mieszany profil ruchu prywatnego i dalekobieżnego.",
      lowFlow: "Niski wolumen ruchu z lepszą obserwowalnością kamer."
    },
    alerts: {
      none: "Brak ostrzeżeń o podejrzanym zachowaniu.",
      labelCar: "Auto",
      labelCamera: "Kamera",
      labelSpeed: "Prędkość",
      labelLimit: "Limit",
      labelRoute: "Trasa"
    },
    entries: { none: "Brak bramek wjazdowych" },
    exits: { none: "Brak bramek zjazdowych" },
    trips: { none: "Brak aktywnych aut" },
    status: { noResponse: "Brak odpowiedzi z symulatora.", error: "Błąd symulatora: {error}{details}" },
    misc: { unknownRoute: "nieznana trasa", currency: "PLN", nA: "brak", noData: "brak" }
  },
  de: {
    languageName: "Deutsch",
    header: { subtitle: "Desktop-GUI + Simulatordienst in C" },
    buttons: { tick1: "Tick +1", tick5: "Tick +5", tick20: "Tick +20", startAuto: "Auto Start", stopAuto: "Auto Stopp", reset: "Zurücksetzen" },
    hero: {
      eyebrow: "Autobahn-Leitstelle",
      networkName: "Polnisches Autobahn-Monitoring",
      copy: "Echtzeitüberwachung der Autobahnen mit kamerabasierter Fahrzeugidentifikation, Warnungen bei auffälligem Verhalten und Sichtbarkeit der Korridore.",
      roadsBadge: "{count} Straßen",
      camerasBadge: "{count} Kameras",
      activeBadge: "{count} aktiv",
      priorityWarning: "Prioritätswarnung",
      networkStatus: "Netzstatus",
      warningDetectedSuffix: "auf {route} erkannt.",
      warningVehicle: "Fahrzeug {vehicle} · {make} {model} · Kamera {camera}",
      stableHeadline: "Stabiler Fluss.",
      stableCopy: "Derzeit werden keine verdächtigen Fahrereignisse von den Autobahnkameras markiert.",
      stableSubcopy: "Die Konsole verfolgt Mautfluss, Kameraidentität, Routenbelegung und verdächtige Fahrmuster."
    },
    metrics: { tick: "Tick", activeCars: "Aktive Autos", completed: "Abgeschlossen", revenue: "Erlös" },
    sections: {
      roadHealth: "Straßenzustand",
      cameraWatch: "Kameraüberblick",
      revenueMix: "Mautmix",
      fleetIntel: "Flottenanalyse",
      commandCenter: "Leitstand",
      entryGates: "Einfahrtskameras",
      exitGates: "Ausfahrtskameras",
      activeCars: "Aktive Autos",
      trafficMap: "Live-Verkehrskarte",
      alerts: "Warnungen bei Verdächtigem Verhalten"
    },
    tabs: { overview: "Übersicht", risk: "Risikoradar", fleet: "Flottenblick" },
    table: { id: "ID", plate: "Kennzeichen", entry: "Einfahrt", exit: "Ausfahrt", km: "Km", ticksLeft: "Ticks Übrig", toll: "Maut" },
    map: {
      caption: "Abstrakte Topologiekarte des Autobahnnetzes. Straßenknoten zeigen Verbindungen, und Autos bewegen sich vom Einfahrtstor über den Knoten zum Ausfahrtstor.",
      noActiveCars: "Keine aktiven Autos im Netz",
      legend: {
        connected: "Verbundener Autobahnknoten",
        disconnected: "Nicht verbundener Autobahnknoten",
        entry: "Einfahrtskamera",
        exit: "Ausfahrtskamera",
        warning: "Geschwindigkeit / Verdächtige Route"
      }
    },
    roadHealth: { stable: "Stabil", watch: "Beobachten", hot: "Heiß", active: "aktiv", warnings: "Warnungen", avg: "Ø" },
    cameraWatch: { flagged: "Markierte Straße", clear: "Klarer Feed", road: "Straße", lane: "Spur", entry: "Einfahrt", exit: "Ausfahrt" },
    revenueMix: { low: "Niedrige Maut", medium: "Mittlere Maut", high: "Hohe Maut", total: "Gesamtbetrag" },
    fleetIntel: { avgSpeed: "Ø Live-Geschwindigkeit", dominantMake: "Häufigste Marke", dominantColor: "Häufigste Farbe", warningDensity: "Warnungsdichte" },
    commandCenter: {
      networkPosture: "Netzlage",
      mostPressured: "Am Stärksten Belastete Straße",
      cameraCoverage: "Kameraabdeckung",
      latestWarnings: "Neueste Warnungen",
      riskHeuristic: "Risikoheuristik",
      operatorNote: "Operator-Hinweis",
      fastestCars: "Schnellste Autos",
      identityDepth: "Identitätstiefe",
      flowCharacter: "Verkehrscharakter",
      denseFlow: "Dichter Autobahnverkehr auf Primärkorridoren.",
      moderateFlow: "Mittlere Auslastung mit Spielraum für mehr Durchsatz.",
      noHotRoad: "Derzeit kein kritischer Korridor.",
      hotRoad: "{road} mit {count} Warnungen",
      coverageText: "{count} aktive Kameratore über {roads} Autobahnkorridore.",
      noWarnings: "Keine Warnungen",
      escalated: "Verstärkte Überwachung auf schnellen Korridoren empfohlen.",
      tolerance: "Das Warnvolumen liegt im erwarteten Bereich.",
      operatorText: "Wiederholtes Rasen auf derselben Straße ist das stärkste Signal für gezielte Kontrollen.",
      noActiveCars: "Keine aktiven Autos",
      identityText: "Kennzeichen, Marke, Modell, Farbe, Straße, Route, Kameraquelle und Live-Maut werden pro aktivem Auto verfolgt.",
      mixedFlow: "Gemischtes Profil aus Privat- und Fernverkehr.",
      lowFlow: "Niedriges Verkehrsaufkommen mit besserer Kamerabeobachtung."
    },
    alerts: {
      none: "Keine Warnungen zu verdächtigem Verhalten.",
      labelCar: "Auto",
      labelCamera: "Kamera",
      labelSpeed: "Geschwindigkeit",
      labelLimit: "Limit",
      labelRoute: "Route"
    },
    entries: { none: "Keine Einfahrtskameras" },
    exits: { none: "Keine Ausfahrtskameras" },
    trips: { none: "Keine aktiven Autos" },
    status: { noResponse: "Keine Antwort vom Simulator.", error: "Simulatorfehler: {error}{details}" },
    misc: { unknownRoute: "unbekannte Route", currency: "PLN", nA: "k. A.", noData: "k. A." }
  },
  fr: {
    languageName: "Français",
    header: { subtitle: "Interface desktop + service simulateur en C" },
    buttons: { tick1: "Tick +1", tick5: "Tick +5", tick20: "Tick +20", startAuto: "Démarrer Auto", stopAuto: "Arrêter Auto", reset: "Réinitialiser" },
    hero: {
      eyebrow: "Console d’Exploitation Autoroutière",
      networkName: "Réseau de Surveillance des Autoroutes Polonaises",
      copy: "Surveillance autoroutière en temps réel avec identification des véhicules par caméra, alertes de comportements suspects et visibilité des corridors.",
      roadsBadge: "{count} routes",
      camerasBadge: "{count} caméras",
      activeBadge: "{count} actives",
      priorityWarning: "Alerte Prioritaire",
      networkStatus: "État du Réseau",
      warningDetectedSuffix: "détecté sur {route}.",
      warningVehicle: "Véhicule {vehicle} · {make} {model} · Caméra {camera}",
      stableHeadline: "Flux stable.",
      stableCopy: "Aucun comportement suspect n’est actuellement signalé par les caméras autoroutières.",
      stableSubcopy: "La console suit les péages, l’identité caméra, l’occupation des routes et les schémas de trajet suspects."
    },
    metrics: { tick: "Tick", activeCars: "Voitures Actives", completed: "Terminés", revenue: "Revenu" },
    sections: {
      roadHealth: "État des Routes",
      cameraWatch: "Surveillance Caméras",
      revenueMix: "Répartition des Péages",
      fleetIntel: "Analyse de Flotte",
      commandCenter: "Centre de Commande",
      entryGates: "Portes d’Entrée",
      exitGates: "Portes de Sortie",
      activeCars: "Voitures Actives",
      trafficMap: "Carte du Trafic en Direct",
      alerts: "Alertes de Comportement Suspect"
    },
    tabs: { overview: "Vue Générale", risk: "Radar de Risque", fleet: "Suivi de Flotte" },
    table: { id: "ID", plate: "Plaque", entry: "Entrée", exit: "Sortie", km: "Km", ticksLeft: "Ticks Restants", toll: "Péage" },
    map: {
      caption: "Carte topologique abstraite du réseau autoroutier. Les nœuds montrent la connectivité, et les voitures vont de la porte d’entrée au nœud autoroutier puis à la sortie.",
      noActiveCars: "Aucune voiture active sur le réseau",
      legend: {
        connected: "Nœud Autoroutier Connecté",
        disconnected: "Nœud Autoroutier Déconnecté",
        entry: "Porte Caméra d’Entrée",
        exit: "Porte Caméra de Sortie",
        warning: "Excès de Vitesse / Trajet Suspect"
      }
    },
    roadHealth: { stable: "Stable", watch: "Surveiller", hot: "Critique", active: "actives", warnings: "alertes", avg: "moy." },
    cameraWatch: { flagged: "Route signalée", clear: "Flux clair", road: "Route", lane: "Voie", entry: "Entrée", exit: "Sortie" },
    revenueMix: { low: "Péages faibles", medium: "Péages moyens", high: "Péages élevés", total: "Total collecté" },
    fleetIntel: { avgSpeed: "Vitesse moyenne", dominantMake: "Marque dominante", dominantColor: "Couleur dominante", warningDensity: "Densité d’alertes" },
    commandCenter: {
      networkPosture: "Posture du Réseau",
      mostPressured: "Route la Plus Sous Pression",
      cameraCoverage: "Couverture Caméra",
      latestWarnings: "Dernières Alertes",
      riskHeuristic: "Heuristique de Risque",
      operatorNote: "Note Opérateur",
      fastestCars: "Voitures les Plus Rapides",
      identityDepth: "Profondeur d’Identification",
      flowCharacter: "Caractère du Flux",
      denseFlow: "Trafic dense sur les principaux corridors autoroutiers.",
      moderateFlow: "Charge autoroutière modérée avec marge de débit.",
      noHotRoad: "Aucun corridor critique pour le moment.",
      hotRoad: "{road} avec {count} alertes",
      coverageText: "{count} caméras de porte actives sur {roads} corridors autoroutiers.",
      noWarnings: "Aucune alerte",
      escalated: "Surveillance renforcée recommandée sur les corridors rapides.",
      tolerance: "Le volume d’alertes reste dans la tolérance attendue.",
      operatorText: "Les excès de vitesse répétés sur la même route sont le meilleur signal pour un contrôle ciblé.",
      noActiveCars: "Aucune voiture active",
      identityText: "Plaque, marque, modèle, couleur, route, trajet, source caméra et péage en direct sont suivis pour chaque voiture active.",
      mixedFlow: "Profil mixte de circulation privée et longue distance.",
      lowFlow: "Flux faible avec une meilleure observabilité caméra."
    },
    alerts: {
      none: "Aucune alerte de comportement suspect.",
      labelCar: "Voiture",
      labelCamera: "Caméra",
      labelSpeed: "Vitesse",
      labelLimit: "Limite",
      labelRoute: "Trajet"
    },
    entries: { none: "Aucune porte d’entrée" },
    exits: { none: "Aucune porte de sortie" },
    trips: { none: "Aucune voiture active" },
    status: { noResponse: "Aucune réponse du simulateur.", error: "Erreur du simulateur : {error}{details}" },
    misc: { unknownRoute: "trajet inconnu", currency: "PLN", nA: "n/d", noData: "n/d" }
  },
  es: {
    languageName: "Español",
    header: { subtitle: "GUI de escritorio + servicio simulador en C" },
    buttons: { tick1: "Tick +1", tick5: "Tick +5", tick20: "Tick +20", startAuto: "Iniciar Auto", stopAuto: "Detener Auto", reset: "Reiniciar" },
    hero: {
      eyebrow: "Consola de Operaciones de Autopistas",
      networkName: "Red Polaca de Monitorización de Autopistas",
      copy: "Vigilancia de autopistas en tiempo real con identificación de vehículos por cámara, alertas de comportamiento sospechoso y visibilidad de corredores.",
      roadsBadge: "{count} carreteras",
      camerasBadge: "{count} cámaras",
      activeBadge: "{count} activas",
      priorityWarning: "Alerta Prioritaria",
      networkStatus: "Estado de la Red",
      warningDetectedSuffix: "detectado en {route}.",
      warningVehicle: "Vehículo {vehicle} · {make} {model} · Cámara {camera}",
      stableHeadline: "Flujo estable.",
      stableCopy: "Actualmente no hay eventos de conducción sospechosa marcados por las cámaras de autopista.",
      stableSubcopy: "La consola rastrea peajes, identidad de cámara, ocupación de rutas y patrones sospechosos de viaje."
    },
    metrics: { tick: "Tick", activeCars: "Coches Activos", completed: "Completados", revenue: "Ingresos" },
    sections: {
      roadHealth: "Estado de Carreteras",
      cameraWatch: "Vigilancia de Cámaras",
      revenueMix: "Distribución de Peajes",
      fleetIntel: "Inteligencia de Flota",
      commandCenter: "Centro de Mando",
      entryGates: "Puertas de Entrada",
      exitGates: "Puertas de Salida",
      activeCars: "Coches Activos",
      trafficMap: "Mapa de Tráfico en Vivo",
      alerts: "Alertas de Comportamiento Sospechoso"
    },
    tabs: { overview: "Resumen", risk: "Radar de Riesgo", fleet: "Vigilancia de Flota" },
    table: { id: "ID", plate: "Matrícula", entry: "Entrada", exit: "Salida", km: "Km", ticksLeft: "Ticks Restantes", toll: "Peaje" },
    map: {
      caption: "Mapa topológico abstracto de autopistas. Los nodos muestran conectividad y los coches se animan desde la entrada al nodo y luego a la salida.",
      noActiveCars: "No hay coches activos en la red",
      legend: {
        connected: "Nodo de Autopista Conectado",
        disconnected: "Nodo de Autopista Desconectado",
        entry: "Puerta de Cámara de Entrada",
        exit: "Puerta de Cámara de Salida",
        warning: "Exceso de Velocidad / Ruta Sospechosa"
      }
    },
    roadHealth: { stable: "Estable", watch: "Vigilar", hot: "Crítico", active: "activos", warnings: "alertas", avg: "prom." },
    cameraWatch: { flagged: "Carretera marcada", clear: "Señal limpia", road: "Carretera", lane: "Carril", entry: "Entrada", exit: "Salida" },
    revenueMix: { low: "Peajes bajos", medium: "Peajes medios", high: "Peajes altos", total: "Total recaudado" },
    fleetIntel: { avgSpeed: "Velocidad media", dominantMake: "Marca dominante", dominantColor: "Color dominante", warningDensity: "Densidad de alertas" },
    commandCenter: {
      networkPosture: "Postura de la Red",
      mostPressured: "Carretera Más Presionada",
      cameraCoverage: "Cobertura de Cámaras",
      latestWarnings: "Últimas Alertas",
      riskHeuristic: "Heurística de Riesgo",
      operatorNote: "Nota del Operador",
      fastestCars: "Coches Más Rápidos",
      identityDepth: "Profundidad de Identidad",
      flowCharacter: "Carácter del Flujo",
      denseFlow: "Flujo denso en los corredores principales.",
      moderateFlow: "Carga moderada con margen para más capacidad.",
      noHotRoad: "No hay corredor crítico ahora mismo.",
      hotRoad: "{road} con {count} alertas",
      coverageText: "{count} cámaras de puerta activas en {roads} corredores de autopista.",
      noWarnings: "Sin alertas",
      escalated: "Se recomienda vigilancia reforzada en corredores de alta velocidad.",
      tolerance: "El volumen de alertas sigue dentro de la tolerancia esperada.",
      operatorText: "El exceso de velocidad repetido en la misma carretera es la señal más clara para control dirigido.",
      noActiveCars: "No hay coches activos",
      identityText: "Se rastrean matrícula, marca, modelo, color, carretera, ruta, cámara y peaje en vivo por coche activo.",
      mixedFlow: "Perfil mixto de tráfico privado y de larga distancia.",
      lowFlow: "Flujo bajo con mejor observabilidad por cámara."
    },
    alerts: {
      none: "No hay alertas de comportamiento sospechoso.",
      labelCar: "Coche",
      labelCamera: "Cámara",
      labelSpeed: "Velocidad",
      labelLimit: "Límite",
      labelRoute: "Ruta"
    },
    entries: { none: "No hay puertas de entrada" },
    exits: { none: "No hay puertas de salida" },
    trips: { none: "No hay coches activos" },
    status: { noResponse: "No hay respuesta del simulador.", error: "Error del simulador: {error}{details}" },
    misc: { unknownRoute: "ruta desconocida", currency: "PLN", nA: "n/d", noData: "n/d" }
  }
};

function icon(name, extraClass = "") {
  const cls = extraClass ? `icon ${extraClass}` : "icon";
  const icons = {
    roads: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path d="M8 3h8l-1 6h2l-1.2 6H18l-1 6h-2l1-6h-4l-1 6H9l1-6H7.2L8.4 9H10L8 3Zm3 12h4l.6-3h-4Z" fill="currentColor"/></svg>`,
    camera: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path d="M9 5 7.5 7H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2.5L15 5H9Zm3 4.2A3.8 3.8 0 1 1 8.2 13 3.8 3.8 0 0 1 12 9.2Z" fill="currentColor"/></svg>`,
    car: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path d="M7 5h10l2.3 5H21a1 1 0 0 1 1 1v5h-2a2 2 0 1 1-4 0H8a2 2 0 1 1-4 0H2v-5a1 1 0 0 1 1-1h1.7L7 5Zm1.3 2L6.9 10h10.2L15.7 7Z" fill="currentColor"/></svg>`,
    warning: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path d="M12 4 2.7 20h18.6L12 4Zm1 5v5h-2V9h2Zm0 8v2h-2v-2h2Z" fill="currentColor"/></svg>`,
    entry: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path d="M13 5v4h6v6h-6v4l-8-7 8-7Z" fill="currentColor"/></svg>`,
    exit: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path d="M11 5v4H5v6h6v4l8-7-8-7Z" fill="currentColor"/></svg>`,
    revenue: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path d="M12 3a7 7 0 0 1 7 7c0 4.4-3.6 7-7 7a3 3 0 1 0 3 3h2a5 5 0 1 1-5-5c2.6 0 5-1.8 5-5a5 5 0 1 0-10 0H5a7 7 0 0 1 7-7Z" fill="currentColor"/></svg>`,
    speed: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path d="M12 5a9 9 0 1 0 9 9A9 9 0 0 0 12 5Zm0 2a7 7 0 0 1 6.8 5.5H17a5.3 5.3 0 0 0-10 0H5.2A7 7 0 0 1 12 7Zm-1 7 5-3-3 5a1.5 1.5 0 1 1-2-2Z" fill="currentColor"/></svg>`,
    factory: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path d="M3 20V8l6 3V8l6 3V4l6 3v13H3Zm3-2h2v-3H6v3Zm4 0h2v-3h-2v3Zm4 0h2v-3h-2v3Z" fill="currentColor"/></svg>`,
    palette: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path d="M12 3a9 9 0 0 0 0 18h1.2a2.8 2.8 0 0 0 0-5.6H11a1.5 1.5 0 0 1 0-3h2a4 4 0 0 0 0-8H12Zm-4 7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4-3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" fill="currentColor"/></svg>`,
    density: `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path d="M5 17h3v2H5v-2Zm5-6h3v8h-3v-8Zm5-4h3v12h-3V7Z" fill="currentColor"/></svg>`
  };
  return icons[name] || "";
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function dict() {
  return TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
}

function pathValue(obj, path) {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

function interpolate(template, vars = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));
}

function t(path, vars = {}) {
  const value = pathValue(dict(), path) ?? pathValue(TRANSLATIONS.en, path) ?? path;
  return typeof value === "string" ? interpolate(value, vars) : value;
}

function formatBadgeCount(count, key) {
  return t(key, { count });
}

function safeText(value) {
  return value || t("misc.noData");
}

function tollColor(toll) {
  if (toll < 80) return "#34d399";
  if (toll <= 160) return "#f59e0b";
  return "#ef4444";
}

function estimatedSpeed(t) {
  const totalTicks = Math.max(1, Number(t.totalTicks || 1));
  const elapsedTicks = Math.max(1, totalTicks - Number(t.ticksLeft || 0));
  const hours = (elapsedTicks * 30.0) / 3600.0;
  const progressedKm = Number(t.distanceKm || 0) * (elapsedTicks / totalTicks);
  if (hours <= 0) return 0;
  return progressedKm / hours;
}

function roadStats(state) {
  const stats = {};
  state.activeTrips.forEach((trip) => {
    if (!stats[trip.road]) {
      stats[trip.road] = { active: 0, revenue: 0, avgSpeed: 0, warnings: 0, samples: 0 };
    }
    stats[trip.road].active += 1;
    stats[trip.road].revenue += Number(trip.toll || 0);
    stats[trip.road].avgSpeed += estimatedSpeed(trip);
    stats[trip.road].samples += 1;
  });
  (state.alerts || []).forEach((alert) => {
    const road = String(alert.route || "").split(":")[0];
    if (!stats[road]) {
      stats[road] = { active: 0, revenue: 0, avgSpeed: 0, warnings: 0, samples: 0 };
    }
    stats[road].warnings += 1;
  });
  Object.values(stats).forEach((entry) => {
    if (entry.samples > 0) entry.avgSpeed /= entry.samples;
  });
  return stats;
}

function setActiveTab(tabId) {
  tabButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `tab-${tabId}`);
  });
}

function hydrateStaticIcons() {
  document.querySelectorAll("[data-icon]").forEach((el) => {
    const markup = icon(el.dataset.icon || "");
    if (markup) el.innerHTML = markup;
  });
}

function roadSet(state) {
  const set = new Set();
  state.entries.forEach((entry) => set.add(entry.road));
  state.exits.forEach((entry) => set.add(entry.road));
  return [...set];
}

function connectedRoads(roads) {
  const connected = new Set();
  ROAD_CONNECTIONS.forEach(([a, b]) => {
    if (roads.includes(a) && roads.includes(b)) {
      connected.add(a);
      connected.add(b);
    }
  });
  return connected;
}

function buildGateNodes(state) {
  const nodes = {};
  const grouped = {};

  const place = (gate, type) => {
    if (!grouped[gate.road]) grouped[gate.road] = { entry: [], exit: [] };
    grouped[gate.road][type].push(gate);
  };

  state.entries.forEach((gate) => place(gate, "entry"));
  state.exits.forEach((gate) => place(gate, "exit"));

  Object.keys(grouped).forEach((road) => {
    const center = ROAD_POSITIONS[road] || { x: 600, y: 180 };
    grouped[road].entry.forEach((gate, index) => {
      nodes[gate.id] = { x: center.x - 120, y: center.y - 40 + index * 22, gate, type: "entry" };
    });
    grouped[road].exit.forEach((gate, index) => {
      nodes[gate.id] = { x: center.x + 120, y: center.y - 40 + index * 22, gate, type: "exit" };
    });
  });

  return nodes;
}

function drawRoadGraphBase(state) {
  const roads = roadSet(state);
  const connected = connectedRoads(roads);
  let svg = `
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1e1b4b"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2b3350" stroke-width="1" opacity="0.5"/>
      </pattern>
    </defs>
    <rect x="0" y="0" width="1200" height="420" fill="url(#bgGrad)" />
    <rect x="0" y="0" width="1200" height="420" fill="url(#grid)" />
  `;

  ROAD_CONNECTIONS.forEach(([a, b]) => {
    if (!roads.includes(a) || !roads.includes(b)) return;
    const pa = ROAD_POSITIONS[a];
    const pb = ROAD_POSITIONS[b];
    svg += `<line x1="${pa.x}" y1="${pa.y}" x2="${pb.x}" y2="${pb.y}" stroke="#e5e7eb" stroke-width="2.2" opacity="0.9"/>`;
  });

  roads.forEach((road) => {
    const point = ROAD_POSITIONS[road] || { x: 600, y: 180 };
    const isConnected = connected.has(road);
    const fill = isConnected ? "#1d4ed8" : "#7c3aed";
    const stroke = isConnected ? "#60a5fa" : "#c4b5fd";
    svg += `
      <circle cx="${point.x}" cy="${point.y}" r="28" fill="${fill}" stroke="${stroke}" stroke-width="3" />
      <text x="${point.x}" y="${point.y + 6}" fill="#eef2ff" font-size="16" font-weight="700" text-anchor="middle">${escapeHtml(road)}</text>
    `;
  });

  return svg;
}

function renderTrafficMap(state) {
  if (!state || state.error) {
    trafficMap.innerHTML = "";
    return;
  }

  const gateNodes = buildGateNodes(state);
  let svg = drawRoadGraphBase(state);

  state.entries.forEach((gate) => {
    const node = gateNodes[gate.id];
    if (!node) return;
    svg += `
      <circle cx="${node.x}" cy="${node.y}" r="10" fill="#22c55e" stroke="#bbf7d0" stroke-width="2" />
      <text x="${node.x - 16}" y="${node.y - 14}" fill="#dbeafe" font-size="11" text-anchor="end">${escapeHtml(gate.id)}</text>
    `;
  });

  state.exits.forEach((gate) => {
    const node = gateNodes[gate.id];
    if (!node) return;
    svg += `
      <circle cx="${node.x}" cy="${node.y}" r="10" fill="#f97316" stroke="#fed7aa" stroke-width="2" />
      <text x="${node.x + 16}" y="${node.y - 14}" fill="#dbeafe" font-size="11" text-anchor="start">${escapeHtml(gate.id)}</text>
    `;
  });

  state.activeTrips.forEach((trip, index) => {
    const start = gateNodes[trip.entryId];
    const end = gateNodes[trip.exitId];
    const hub = ROAD_POSITIONS[trip.road] || { x: 600, y: 180 };
    if (!start || !end) return;

    const totalTicks = Math.max(1, Number(trip.totalTicks || 1));
    const progress = Math.max(0, Math.min(1, 1 - trip.ticksLeft / totalTicks));
    let vx;
    let vy;

    if (progress < 0.5) {
      const factor = progress * 2;
      vx = start.x + (hub.x - start.x) * factor;
      vy = start.y + (hub.y - start.y) * factor;
    } else {
      const factor = (progress - 0.5) * 2;
      vx = hub.x + (end.x - hub.x) * factor;
      vy = hub.y + (end.y - hub.y) * factor;
    }

    const color = tollColor(Number(trip.toll || 0));
    const jitter = ((index % 5) - 2) * 3;

    svg += `
      <path d="M ${start.x} ${start.y} L ${hub.x} ${hub.y} L ${end.x} ${end.y}" stroke="${color}" stroke-width="2" fill="none" stroke-dasharray="5 6" opacity="0.9" />
      <circle cx="${vx + jitter}" cy="${vy - jitter}" r="6.5" fill="${color}">
        <animate attributeName="r" values="6.2;7.8;6.2" dur="1.4s" repeatCount="indefinite" />
      </circle>
    `;
  });

  if (!state.activeTrips.length) {
    svg += `<text x="600" y="210" fill="#cbd5e1" font-size="14" text-anchor="middle">${escapeHtml(t("map.noActiveCars"))}</text>`;
  }

  trafficMap.innerHTML = svg;
}

function renderAlerts(state) {
  const alerts = Array.isArray(state?.alerts) ? state.alerts : [];
  alertsEl.innerHTML = "";

  if (!alerts.length) {
    alertsEl.innerHTML = `<div class="small">${escapeHtml(t("alerts.none"))}</div>`;
    return;
  }

  alerts
    .slice()
    .reverse()
    .forEach((alert) => {
      const item = document.createElement("div");
      item.className = "alert-item";
      item.innerHTML = `
        <span class="alert-icon">${icon("warning")}</span>
        <span>
          <strong>${escapeHtml(alert.type || "warning")}</strong> [t=${alert.tick}] ${escapeHtml(alert.message)}<br/>
          ${escapeHtml(t("alerts.labelCar"))}: ${escapeHtml(alert.vehicleA || t("misc.nA"))} · ${escapeHtml(safeText(alert.make))} ${escapeHtml(safeText(alert.model))} · ${escapeHtml(safeText(alert.color))}<br/>
          ${escapeHtml(t("alerts.labelCamera"))}: ${escapeHtml(alert.cameraId || "CAM-UNKNOWN")} · ${escapeHtml(t("alerts.labelSpeed"))}: ${Number(alert.measuredSpeedKmh || 0).toFixed(1)} km/h / ${escapeHtml(t("alerts.labelLimit"))} ${Number(alert.speedLimitKmh || 0).toFixed(0)} km/h · ${escapeHtml(t("alerts.labelRoute"))} ${escapeHtml(alert.route || "")}
        </span>
      `;
      alertsEl.appendChild(item);
    });
}

function renderHero(state) {
  const roads = roadSet(state);
  networkTitle.textContent = t("hero.networkName");
  badgeRoads.textContent = formatBadgeCount(roads.length, "hero.roadsBadge");
  badgeCameras.textContent = formatBadgeCount(state.entries.length + state.exits.length, "hero.camerasBadge");
  badgeFleet.textContent = formatBadgeCount(state.activeTripCount, "hero.activeBadge");

  const topAlert = (state.alerts || []).slice().reverse()[0];
  if (topAlert) {
    spotlight.innerHTML = `
      <div class="eyebrow">${escapeHtml(t("hero.priorityWarning"))}</div>
      <div><strong>${escapeHtml(topAlert.type || "warning")}</strong> ${escapeHtml(t("hero.warningDetectedSuffix", { route: topAlert.route || t("misc.unknownRoute") }))}</div>
      <div class="small">${escapeHtml(t("hero.warningVehicle", {
        vehicle: topAlert.vehicleA || t("misc.nA"),
        make: safeText(topAlert.make),
        model: safeText(topAlert.model),
        camera: topAlert.cameraId || "CAM-UNKNOWN"
      }))}</div>
    `;
  } else {
    spotlight.innerHTML = `
      <div class="eyebrow">${escapeHtml(t("hero.networkStatus"))}</div>
      <div><strong>${escapeHtml(t("hero.stableHeadline"))}</strong> ${escapeHtml(t("hero.stableCopy"))}</div>
      <div class="small">${escapeHtml(t("hero.stableSubcopy"))}</div>
    `;
  }
}

function renderRoadHealth(state) {
  const stats = roadStats(state);
  const roads = roadSet(state).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  roadHealth.innerHTML = "";

  roads.forEach((road) => {
    const s = stats[road] || { active: 0, revenue: 0, avgSpeed: 0, warnings: 0 };
    const badgeClass = s.warnings > 3 ? "bad" : s.warnings > 0 ? "warn" : "good";
    const badgeText = s.warnings > 3 ? t("roadHealth.hot") : s.warnings > 0 ? t("roadHealth.watch") : t("roadHealth.stable");
    const div = document.createElement("div");
    div.className = "road-card";
    div.innerHTML = `
      <div class="road-top">
        <div class="road-code">${icon("roads", "icon-sm")}<span>${road}</span></div>
        <span class="badge ${badgeClass}">${escapeHtml(badgeText)}</span>
      </div>
      <div class="road-metrics">
        <span>${icon("car", "icon-xs")} ${s.active} ${escapeHtml(t("roadHealth.active"))}</span>
        <span>${icon("revenue", "icon-xs")} ${s.revenue.toFixed(0)} ${escapeHtml(t("misc.currency"))}</span>
        <span>${icon("warning", "icon-xs")} ${s.warnings} ${escapeHtml(t("roadHealth.warnings"))}</span>
        <span>${icon("speed", "icon-xs")} ${s.avgSpeed ? s.avgSpeed.toFixed(0) : 0} km/h ${escapeHtml(t("roadHealth.avg"))}</span>
      </div>
    `;
    roadHealth.appendChild(div);
  });
}

function renderCameraWatch(state) {
  const cameras = [...state.entries.map((g) => ({ ...g, kind: "Entry" })), ...state.exits.map((g) => ({ ...g, kind: "Exit" }))];
  const watchRoutes = new Set((state.alerts || []).map((alert) => String(alert.route || "").split(":")[0]));
  cameraWatch.innerHTML = "";

  cameras.slice(0, 8).forEach((camera, index) => {
    const hot = watchRoutes.has(camera.road);
    const card = document.createElement("div");
    card.className = "camera-card";
    card.innerHTML = `
      <div class="camera-top">
        <div class="camera-id">${icon(camera.kind === "Entry" ? "entry" : "exit", "icon-sm")}<span>${camera.id}</span></div>
        <span class="badge ${hot ? "warn" : "good"}">${escapeHtml(hot ? t("cameraWatch.flagged") : t("cameraWatch.clear"))}</span>
      </div>
      <div class="camera-meta">
        <span>${escapeHtml(t("cameraWatch.road"))} ${camera.road}</span>
        <span>${escapeHtml(camera.name)}</span>
        <span>${escapeHtml(t("cameraWatch.lane"))} ${index + 1}</span>
      </div>
    `;
    cameraWatch.appendChild(card);
  });
}

function renderRevenueMix(state) {
  const buckets = { low: 0, medium: 0, high: 0 };
  state.activeTrips.forEach((trip) => {
    const toll = Number(trip.toll || 0);
    if (toll < 80) buckets.low += 1;
    else if (toll <= 160) buckets.medium += 1;
    else buckets.high += 1;
  });

  revenueMix.innerHTML = `
    <div class="mini-stat"><span>${icon("roads", "icon-xs")} ${escapeHtml(t("revenueMix.low"))}</span><strong>${buckets.low}</strong></div>
    <div class="mini-stat"><span>${icon("roads", "icon-xs")} ${escapeHtml(t("revenueMix.medium"))}</span><strong>${buckets.medium}</strong></div>
    <div class="mini-stat"><span>${icon("warning", "icon-xs")} ${escapeHtml(t("revenueMix.high"))}</span><strong>${buckets.high}</strong></div>
    <div class="mini-stat"><span>${icon("revenue", "icon-xs")} ${escapeHtml(t("revenueMix.total"))}</span><strong>${state.revenue.toFixed(0)} ${escapeHtml(t("misc.currency"))}</strong></div>
  `;
}

function renderFleetIntel(state) {
  const byMake = {};
  const byColor = {};
  state.activeTrips.forEach((trip) => {
    byMake[trip.make] = (byMake[trip.make] || 0) + 1;
    byColor[trip.color] = (byColor[trip.color] || 0) + 1;
  });

  const topMake = Object.entries(byMake).sort((a, b) => b[1] - a[1])[0];
  const topColor = Object.entries(byColor).sort((a, b) => b[1] - a[1])[0];
  const avgSpeed = state.activeTrips.length
    ? state.activeTrips.reduce((sum, trip) => sum + estimatedSpeed(trip), 0) / state.activeTrips.length
    : 0;

  fleetIntel.innerHTML = `
    <div class="mini-stat"><span>${icon("speed", "icon-xs")} ${escapeHtml(t("fleetIntel.avgSpeed"))}</span><strong>${avgSpeed.toFixed(0)} km/h</strong></div>
    <div class="mini-stat"><span>${icon("factory", "icon-xs")} ${escapeHtml(t("fleetIntel.dominantMake"))}</span><strong>${escapeHtml(topMake ? `${topMake[0]} · ${topMake[1]}` : t("misc.noData"))}</strong></div>
    <div class="mini-stat"><span>${icon("palette", "icon-xs")} ${escapeHtml(t("fleetIntel.dominantColor"))}</span><strong>${escapeHtml(topColor ? `${topColor[0]} · ${topColor[1]}` : t("misc.noData"))}</strong></div>
    <div class="mini-stat"><span>${icon("density", "icon-xs")} ${escapeHtml(t("fleetIntel.warningDensity"))}</span><strong>${state.activeTripCount ? ((state.alerts.length / state.activeTripCount) * 100).toFixed(0) : 0}%</strong></div>
  `;
}

function renderCommandCenter(state) {
  const stats = roadStats(state);
  const hottestRoad = Object.entries(stats).sort((a, b) => b[1].warnings - a[1].warnings)[0];
  const fastest = state.activeTrips
    .map((trip) => ({ ...trip, speed: estimatedSpeed(trip) }))
    .sort((a, b) => b.speed - a.speed)
    .slice(0, 4);
  const recentAlerts = (state.alerts || []).slice().reverse().slice(0, 4);

  overviewBoard.innerHTML = `
    <div class="board-card">
      <h5>${escapeHtml(t("commandCenter.networkPosture"))}</h5>
      <p>${escapeHtml(state.activeTripCount > 18 ? t("commandCenter.denseFlow") : t("commandCenter.moderateFlow"))}</p>
    </div>
    <div class="board-card">
      <h5>${escapeHtml(t("commandCenter.mostPressured"))}</h5>
      <p>${escapeHtml(hottestRoad ? t("commandCenter.hotRoad", { road: hottestRoad[0], count: hottestRoad[1].warnings }) : t("commandCenter.noHotRoad"))}</p>
    </div>
    <div class="board-card">
      <h5>${escapeHtml(t("commandCenter.cameraCoverage"))}</h5>
      <p>${escapeHtml(t("commandCenter.coverageText", { count: state.entries.length + state.exits.length, roads: roadSet(state).length }))}</p>
    </div>
  `;

  riskBoard.innerHTML = `
    <div class="board-card">
      <h5>${escapeHtml(t("commandCenter.latestWarnings"))}</h5>
      <ul>${recentAlerts.length ? recentAlerts.map((alert) => `<li>${escapeHtml(alert.type)} · ${escapeHtml(alert.vehicleA)} · ${escapeHtml(alert.route)}</li>`).join("") : `<li>${escapeHtml(t("commandCenter.noWarnings"))}</li>`}</ul>
    </div>
    <div class="board-card">
      <h5>${escapeHtml(t("commandCenter.riskHeuristic"))}</h5>
      <p>${escapeHtml(state.alerts.length > 6 ? t("commandCenter.escalated") : t("commandCenter.tolerance"))}</p>
    </div>
    <div class="board-card">
      <h5>${escapeHtml(t("commandCenter.operatorNote"))}</h5>
      <p>${escapeHtml(t("commandCenter.operatorText"))}</p>
    </div>
  `;

  fleetBoard.innerHTML = `
    <div class="board-card">
      <h5>${escapeHtml(t("commandCenter.fastestCars"))}</h5>
      <ul>${fastest.length ? fastest.map((trip) => `<li>${escapeHtml(trip.plate)} · ${escapeHtml(trip.make)} ${escapeHtml(trip.model)} · ${trip.speed.toFixed(0)} km/h</li>`).join("") : `<li>${escapeHtml(t("commandCenter.noActiveCars"))}</li>`}</ul>
    </div>
    <div class="board-card">
      <h5>${escapeHtml(t("commandCenter.identityDepth"))}</h5>
      <p>${escapeHtml(t("commandCenter.identityText"))}</p>
    </div>
    <div class="board-card">
      <h5>${escapeHtml(t("commandCenter.flowCharacter"))}</h5>
      <p>${escapeHtml(state.activeTripCount > 12 ? t("commandCenter.mixedFlow") : t("commandCenter.lowFlow"))}</p>
    </div>
  `;
}

function renderStaticText() {
  document.documentElement.lang = currentLanguage;
  Object.entries(TEXT_IDS).forEach(([id, key]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = t(key);
  });
  btnTick1.textContent = t("buttons.tick1");
  btnTick5.textContent = t("buttons.tick5");
  btnTick20.textContent = t("buttons.tick20");
  btnReset.textContent = t("buttons.reset");
  btnAuto.textContent = autoTimer ? t("buttons.stopAuto") : t("buttons.startAuto");
  langOptions.forEach((option) => {
    option.classList.toggle("active", option.dataset.lang === currentLanguage);
  });
}

function render(state) {
  currentState = state;
  if (!state) {
    statusEl.textContent = t("status.noResponse");
    return;
  }
  if (state.error) {
    const details = state.details ? ` (${state.details})` : "";
    statusEl.textContent = t("status.error", { error: state.error, details });
    return;
  }

  renderStaticText();
  statusEl.textContent = "";
  mTick.textContent = state.tick;
  mActive.textContent = state.activeTripCount;
  mCompleted.textContent = state.completedTrips;
  mRevenue.textContent = `${state.revenue.toFixed(2)} ${state.currency || t("misc.currency")}`;

  renderHero(state);
  renderRoadHealth(state);
  renderCameraWatch(state);
  renderRevenueMix(state);
  renderFleetIntel(state);
  renderCommandCenter(state);

  entries.innerHTML = "";
  if (!state.entries.length) {
    const li = document.createElement("li");
    li.className = "small";
    li.textContent = t("entries.none");
    entries.appendChild(li);
  } else {
    state.entries.forEach((gate) => {
      const li = document.createElement("li");
      li.textContent = `${gate.road} · ${gate.id} - ${gate.name}`;
      entries.appendChild(li);
    });
  }

  exits.innerHTML = "";
  if (!state.exits.length) {
    const li = document.createElement("li");
    li.className = "small";
    li.textContent = t("exits.none");
    exits.appendChild(li);
  } else {
    state.exits.forEach((gate) => {
      const li = document.createElement("li");
      li.textContent = `${gate.road} · ${gate.id} - ${gate.name}`;
      exits.appendChild(li);
    });
  }

  trips.innerHTML = "";
  if (!state.activeTrips.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="7" class="small">${escapeHtml(t("trips.none"))}</td>`;
    trips.appendChild(tr);
  } else {
    state.activeTrips.forEach((trip) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${trip.tripId}</td><td>${escapeHtml(trip.plate)}<br/><span class="small">${escapeHtml(trip.make)} ${escapeHtml(trip.model)}, ${escapeHtml(trip.color)}</span></td><td>${escapeHtml(`${trip.road}:${trip.entryId}`)}</td><td>${escapeHtml(`${trip.road}:${trip.exitId}`)}</td><td>${trip.distanceKm}</td><td>${trip.ticksLeft}</td><td>${trip.toll.toFixed(2)}</td>`;
      trips.appendChild(tr);
    });
  }

  renderTrafficMap(state);
  renderAlerts(state);
}

function applyLanguage(lang) {
  currentLanguage = TRANSLATIONS[lang] ? lang : "en";
  localStorage.setItem("highway-network-language", currentLanguage);
  renderStaticText();
  if (currentState) render(currentState);
}

async function refresh() {
  render(await window.simApi.getState());
}

async function tick(steps) {
  render(await window.simApi.tick(steps));
}

btnTick1.onclick = () => tick(1);
btnTick5.onclick = () => tick(5);
btnTick20.onclick = () => tick(20);
btnReset.onclick = async () => render(await window.simApi.reset());
btnAuto.onclick = () => {
  if (autoTimer) {
    clearInterval(autoTimer);
    autoTimer = null;
    btnAuto.textContent = t("buttons.startAuto");
    return;
  }
  autoTimer = setInterval(() => tick(1), 700);
  btnAuto.textContent = t("buttons.stopAuto");
};

langToggle.addEventListener("click", () => {
  const open = langMenu.classList.toggle("open");
  langToggle.setAttribute("aria-expanded", open ? "true" : "false");
});

langOptions.forEach((option) => {
  option.addEventListener("click", () => {
    applyLanguage(option.dataset.lang);
    langMenu.classList.remove("open");
    langToggle.setAttribute("aria-expanded", "false");
  });
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".lang-switcher")) {
    langMenu.classList.remove("open");
    langToggle.setAttribute("aria-expanded", "false");
  }
});

hydrateStaticIcons();
applyLanguage(currentLanguage);
refresh();
pollTimer = setInterval(() => {
  refresh();
}, 800);

window.addEventListener("beforeunload", () => {
  if (autoTimer) clearInterval(autoTimer);
  if (pollTimer) clearInterval(pollTimer);
});

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    setActiveTab(btn.dataset.tab);
  });
});

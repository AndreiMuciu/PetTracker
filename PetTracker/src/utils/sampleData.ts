// Acest fișier conține date de exemplu pentru testarea aplicației
// Poți copia aceste date în aplicație pentru a testa rapid funcționalitățile

export const SAMPLE_PETS = [
  {
    name: "Rex",
    type: "dog",
    breed: "Labrador Retriever",
    walkSchedule: [
      {
        time: "08:00",
        daysOfWeek: [1, 2, 3, 4, 5], // Luni - Vineri
      },
      {
        time: "18:00",
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7], // Zilnic
      },
    ],
  },
  {
    name: "Miau",
    type: "cat",
    breed: "Persan",
    walkSchedule: [
      {
        time: "19:00",
        daysOfWeek: [1, 3, 5], // Luni, Miercuri, Vineri
      },
    ],
  },
  {
    name: "Buddy",
    type: "dog",
    breed: "Golden Retriever",
    walkSchedule: [
      {
        time: "07:30",
        daysOfWeek: [0, 6], // Weekend
      },
      {
        time: "17:00",
        daysOfWeek: [1, 2, 3, 4, 5], // Luni - Vineri
      },
    ],
  },
];

export const SAMPLE_ROUTES = [
  {
    name: "Parcul Central",
    description: "Traseu scurt prin parcul din centru",
    estimatedDistance: "2.5 km",
    estimatedDuration: "30 min",
    difficulty: "Ușor",
  },
  {
    name: "Traseu Riverside",
    description: "Plimbare de-a lungul râului",
    estimatedDistance: "5 km",
    estimatedDuration: "1 oră",
    difficulty: "Mediu",
  },
  {
    name: "Circuit Cartier",
    description: "Tur rapid prin cartier",
    estimatedDistance: "1.2 km",
    estimatedDuration: "15 min",
    difficulty: "Ușor",
  },
  {
    name: "Dealul Verde",
    description: "Urcuș prin pădure",
    estimatedDistance: "3.8 km",
    estimatedDuration: "50 min",
    difficulty: "Dificil",
  },
];

export const SAMPLE_SCHEDULE_IDEAS = [
  {
    title: "Program Dimineață",
    time: "07:00",
    days: "Luni - Vineri",
    note: "Plimbare energizantă de dimineață înainte de muncă",
  },
  {
    title: "Pauza de Prânz",
    time: "12:30",
    days: "Luni - Vineri",
    note: "Scurtă plimbare în pauza de masă",
  },
  {
    title: "Program Seară",
    time: "18:00",
    days: "Zilnic",
    note: "Plimbarea principală a zilei",
  },
  {
    title: "Weekend Relaxat",
    time: "09:00",
    days: "Sâmbătă, Duminică",
    note: "Plimbare mai lungă în weekend",
  },
];

export const TIPS = [
  "💡 Tip: Creează trasee diferite pentru vreme diferită (ploaie/soare)",
  "💡 Tip: Setează notificări cu 15 min înainte pentru a te pregăti",
  "💡 Tip: Marchează traseele favorite cu steluța pentru acces rapid",
  "💡 Tip: Folosește tracking GPS pentru a vedea exact câți km ai făcut",
  "💡 Tip: Verifică istoricul pentru a vedea progresul săptămânal",
];

// Exemple de coordonate pentru București (pentru testare hartă)
export const SAMPLE_COORDINATES = {
  herastrau: {
    center: { latitude: 44.473, longitude: 26.0813 },
    name: "Parcul Herăstrău",
  },
  tineretului: {
    center: { latitude: 44.4058, longitude: 26.1019 },
    name: "Parcul Tineretului",
  },
  carol: {
    center: { latitude: 44.4163, longitude: 26.1044 },
    name: "Parcul Carol",
  },
  cismigiu: {
    center: { latitude: 44.4359, longitude: 26.0933 },
    name: "Parcul Cișmigiu",
  },
};

# 🐾 PetTracker - Aplicație Mobilă pentru Gestionarea Animalelor de Companie

## 📱 Caracteristici Principale

### ✅ Gestionare Animale de Companie

- Adaugă, editează și șterge animale de companie
- Suport pentru câini, pisici și alte animale
- Informații despre rasă și detalii personalizate

### 🗺️ Hartă Interactivă cu Trasee

- Desenează trasee personalizate pe hartă
- Salvează traseele favorite pentru plimbări
- Calculează automat distanța traseelor
- Vizualizare trasee pe Google Maps
- Tracking GPS în timp real

### 🔔 Notificări Inteligente

- Programează ore specifice pentru plimbări
- Selectează zilele săptămânii (Luni-Duminică)
- Primește notificări automate
- Activează/dezactivează notificările pe animal

### 📊 Istoric Plimbări

- Vizualizează toate plimbările anterioare
- Statistici: număr plimbări, distanță totală, durată medie
- Filtrare pe animal
- Detalii complete pentru fiecare plimbare

## 🚀 Instalare și Rulare

### Cerințe

- Node.js (versiunea 18 sau mai nouă)
- Expo Go instalat pe telefon (pentru testare)
- Pentru dezvoltare: Android Studio sau Xcode (opțional)

### Pași de instalare

1. **Instalează dependențele:**

```bash
npm install
```

2. **Pornește serverul Expo:**

```bash
npm start
```

3. **Scanează QR code-ul:**
   - Pe Android: Deschide Expo Go și scanează codul
   - Pe iOS: Deschide Camera și scanează codul

## 📱 Configurare Google Maps (Opțional pentru Android)

Pentru a folosi Google Maps pe Android, trebuie să obții un API Key:

1. Mergi la [Google Cloud Console](https://console.cloud.google.com/)
2. Creează un proiect nou sau selectează unul existent
3. Activează "Maps SDK for Android"
4. Creează un API Key
5. Înlocuiește `YOUR_GOOGLE_MAPS_API_KEY` în `app.json` cu cheia ta

**Pentru iOS**, Google Maps funcționează fără API Key în development.

## 🔧 Configurare Notificări

Notificările funcționează automat în Expo Go. Pentru build-uri de producție:

### Android

- Permisiunile sunt deja configurate în `app.json`
- Notificările funcționează out-of-the-box

### iOS

- Notificările necesită certificat Apple Developer
- În development, funcționează cu Expo Go

## 📂 Structura Proiectului

```
PetTracker/
├── src/
│   ├── screens/           # Ecranele aplicației
│   │   ├── PetsScreen.tsx        # Gestionare animale
│   │   ├── MapScreen.tsx         # Hartă și trasee
│   │   ├── ScheduleScreen.tsx    # Programare plimbări
│   │   └── HistoryScreen.tsx     # Istoric plimbări
│   ├── navigation/        # Configurare navigație
│   │   └── AppNavigator.tsx
│   ├── services/          # Servicii backend
│   │   ├── storage.ts            # AsyncStorage (bază de date locală)
│   │   ├── notifications.ts      # Sistem notificări
│   │   └── location.ts           # GPS și calcul distanțe
│   ├── types/             # TypeScript types
│   │   └── index.ts
│   └── utils/             # Funcții helper
├── assets/                # Imagini și resurse
├── App.tsx               # Entry point
├── app.json              # Configurare Expo
└── package.json          # Dependențe

```

## 🎯 Cum să Folosești Aplicația

### 1. Adaugă un Animal

1. Mergi la tab-ul "Animale"
2. Apasă butonul "+" din colțul dreapta-sus
3. Completează numele, tipul și rasa (opțional)
4. Apasă "Salvează"

### 2. Desenează un Traseu

1. Mergi la tab-ul "Hartă"
2. Apasă "Desenează Traseu"
3. Apasă pe hartă pentru a adăuga puncte
4. Apasă "Salvează Traseu" și dă-i un nume
5. Traseul va fi salvat și îl poți accesa oricând

### 3. Programează Notificări

1. Mergi la tab-ul "Program"
2. Selectează un animal și apasă "+"
3. Alege ora plimbării
4. Selectează zilele când vrei să primești notificări
5. Apasă "Salvează"
6. Vei primi notificări automat la orele programate!

### 4. Vezi Istoricul

1. Mergi la tab-ul "Istoric"
2. Vezi toate plimbările tale
3. Filtrează după animal specific
4. Vezi statistici detaliate

## 🛠️ Tehnologii Utilizate

- **React Native** - Framework pentru aplicații mobile
- **Expo** - Platformă de dezvoltare React Native
- **TypeScript** - Type safety
- **React Navigation** - Navigare între ecrane
- **React Native Maps** - Integrare Google Maps
- **Expo Location** - Acces la GPS
- **Expo Notifications** - Sistem de notificări
- **AsyncStorage** - Stocare locală (offline-first)

## 📝 Funcționalități Viitoare (Roadmap)

- [ ] Foto pentru animale (camera/galerie)
- [ ] Tracking live în timpul plimbării
- [ ] Statistici avansate (grafice)
- [ ] Export date (PDF, CSV)
- [ ] Widget pentru ecranul principal
- [ ] Integrare wearables (smartwatch)
- [ ] Mood tracking pentru animale
- [ ] Comunitate - share trasee cu alți utilizatori

## 🐛 Depanare

### Notificările nu funcționează?

- Verifică setările telefonului pentru permisiuni notificări
- Pe iOS, asigură-te că ai permis notificări pentru Expo Go
- Pe Android, verifică că permisiunile sunt acordate în Settings > Apps > Expo Go

### Harta nu se încarcă?

- Verifică conexiunea la internet
- Pentru Android: verifică Google Maps API Key
- Acordă permisiuni de locație aplicației

### Aplicația se oprește?

- Reînnoiește aplicația în Expo Go
- Verifică consolele pentru erori
- Rulează `npm install` din nou

## 📄 Licență

Acest proiect este open-source și disponibil pentru uz personal și educațional.

## 👨‍💻 Autor

Creat cu ❤️ pentru iubitorii de animale de companie!

---

**Notă**: Aceasta este o aplicație locală. Toate datele sunt salvate pe dispozitivul tău și nu sunt trimise nicăieri. Privacy-ul tău este garantat! 🔒

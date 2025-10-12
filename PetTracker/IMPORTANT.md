# ⚠️ IMPORTANT - Informații Esențiale

## 🔐 Permisiuni Necesare

Aplicația va cere următoarele permisiuni:

### 📍 Locație (GPS)
- **De ce**: Pentru a urmări traseele de plimbare pe hartă
- **Când**: La prima utilizare a ecranului Hartă
- **Tip**: "While using the app" (doar când folosești aplicația)
- ✅ **Sigur**: Nu trimite locația nicăieri, totul e local!

### 🔔 Notificări
- **De ce**: Pentru reminder-uri de plimbare
- **Când**: La prima programare a unei plimbări
- **Ce primești**: Notificări la orele setate de tine
- ✅ **Sigur**: Nu trimite spam, doar la orele tale!

## 💾 Stocare Date

### Tot este LOCAL! 🔒
- Datele sunt salvate în AsyncStorage (ca o bază de date locală)
- **NImic nu se trimite la server**
- **NImic nu se încarcă în cloud**
- Dacă ștergi aplicația, datele se pierd
- **Privacy 100%**: Nimeni nu vede datele tale!

### Ce date salvăm:
- Animalele tale (nume, tip, rasă)
- Traseele desenate pe hartă
- Programele de plimbare
- Istoricul plimbărilor

## 📱 Compatibilitate

### ✅ Funcționează pe:
- **Android**: 5.0 (Lollipop) și mai nou
- **iOS**: 13.0 și mai nou
- **Expo Go**: Versiunea curentă

### ⚠️ Limitări în Expo Go:
- Notificările funcționează, dar nu în background complet
- Pentru funcționalitate completă, build producție (EAS Build)
- Google Maps necesită API Key pentru Android build

### 🎨 **NOU: Immersive Mode (Android)**
- ✅ **Navigation Bar ascuns automat** - mai mult spațiu pe ecran!
- ✅ **Butoanele apar la swipe** - trage de jos în sus când ai nevoie
- ✅ **Experiență full-screen** - interface modern
- 📖 Vezi [IMMERSIVE_MODE.md](./IMMERSIVE_MODE.md) pentru detalii

## 🗺️ Google Maps Setup (Pentru Android Build)

### În Development (Expo Go):
- ✅ Funcționează fără API Key
- Maps-urile se încarcă normal

### Pentru Production Build (.apk/.aab):
1. Obține API Key de la [Google Cloud Console](https://console.cloud.google.com/)
2. Activează "Maps SDK for Android"
3. Adaugă în `app.json`:
   ```json
   "android": {
     "config": {
       "googleMaps": {
         "apiKey": "YOUR_API_KEY_HERE"
       }
     }
   }
   ```

### Pentru iOS:
- ✅ Funcționează fără API Key în development
- ✅ Funcționează fără API Key în production

## 🔄 Update Aplicație

### Hot Reload (Automat):
- Salvezi cod → aplicația se actualizează instant pe telefon
- Nu trebuie să rescenezi QR code-ul
- Magic! ✨

### Manual Reload:
- Scutură telefonul → "Reload"
- Sau apasă `r` în terminal Expo

## ⚡ Performance Tips

### Pentru telefoane mai vechi:
- Dezactivează animațiile complexe
- Nu desena trasee cu prea multe puncte (max 50-100 puncte)
- Șterge plimbări vechi din istoric periodic

### Pentru baterie:
- Notificările nu consumă baterie (doar se declanșează la ora setată)
- GPS-ul se folosește doar când deschizi harta
- Aplicația nu rulează în background (în Expo Go)

## 🐛 Known Issues

### Notificări nu apar exact la oră:
- **Android**: Poate avea întârzieri de 1-2 min (sistem Android)
- **iOS**: Mai precise, dar pot fi întârziate dacă telefonul e în "Low Power Mode"

### Hartă albă la pornire:
- Normal! Se încarcă în 2-3 secunde
- Verifică conexiunea internet
- Acordă permisiuni de locație

### "Notification scheduling failed":
- Acordă permisiuni de notificări
- Restart aplicația
- Verifică setările telefonului

## 📞 Suport

### Erori frecvente:

**"Metro bundler error"**
```bash
# Soluție:
npm start -- --clear
```

**"Unable to resolve module"**
```bash
# Soluție:
rm -rf node_modules
npm install
```

**"Network error"**
- Verifică că telefonul și PC-ul sunt pe aceeași WiFi
- Dezactivează firewall-ul temporar
- Restart Expo server

### Debug Mode:
1. Scutură telefonul
2. "Debug Remote JS"
3. Se deschide Chrome DevTools
4. Vezi console.log() în browser

## 🚀 Next Steps (După ce funcționează)

### Îmbunătățiri viitoare:
1. **Foto pentru animale** - Adaugă poze din galerie
2. **Live tracking** - Urmărește plimbarea în timp real
3. **Statistici avansate** - Grafice și rapoarte
4. **Export date** - Salvează rapoarte PDF
5. **Dark mode** - Temă întunecat

### Build pentru Store:
1. Creează cont [Expo Application Services](https://expo.dev/)
2. Configurează EAS Build
3. Build APK/IPA
4. Upload pe Play Store / App Store

## 🎓 Resurse Utile

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)

---

**Întrebări? Check README.md și QUICK_START.md** 📚

**Probleme? Verifică erorile în terminal Expo!** 🔍

**Enjoy tracking your pet walks!** 🐾❤️

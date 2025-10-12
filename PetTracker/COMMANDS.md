# 🛠️ Comenzi Utile - PetTracker

## Dezvoltare

### Pornire server Expo

```bash
npm start
```

### Pornire cu resetare cache

```bash
npm start -- --clear
```

### Deschide direct pe Android (dacă ai emulator)

```bash
npm run android
```

### Deschide direct pe iOS (doar macOS cu Xcode)

```bash
npm run ios
```

## Comenzi Scurte în Terminal Expo

După ce rulezi `npm start`, ai aceste comenzi disponibile:

- **`a`** - Deschide pe Android (emulator sau device conectat)
- **`i`** - Deschide pe iOS (simulator sau device conectat)
- **`w`** - Deschide în browser web
- **`r`** - Reîncarcă aplicația
- **`m`** - Toggle meniu dezvoltator
- **`j`** - Deschide debugger
- **`?`** - Arată toate comenzile

## Debugging

### Shake Device Menu

Pe telefon, **scutură** dispozitivul pentru a deschide meniul de dezvoltator:

- **Reload** - Reîncarcă aplicația
- **Debug** - Deschide Chrome DevTools
- **Performance Monitor** - Vezi FPS și memorie
- **Toggle Inspector** - Inspectează elemente UI

### Log în Console

Toate `console.log()` din cod apar în terminalul unde rulează Expo.

### React DevTools

```bash
npx react-devtools
```

## Build pentru Producție

### Build APK pentru Android

```bash
eas build --platform android
```

### Build pentru iOS (necesită cont Apple Developer)

```bash
eas build --platform ios
```

**Notă**: Pentru build-uri de producție, trebuie să configurezi EAS (Expo Application Services).

## Curățare și Reset

### Șterge cache și node_modules

```bash
rm -rf node_modules
rm -rf .expo
npm install
```

### Reset tot (Windows PowerShell)

```powershell
Remove-Item -Recurse -Force node_modules, .expo
npm install
```

## Git Commands

### Inițializare repo (dacă nu e deja)

```bash
git init
git add .
git commit -m "Initial commit - PetTracker app"
```

### Push la GitHub

```bash
git remote add origin https://github.com/username/PetTracker.git
git branch -M main
git push -u origin main
```

## Testing pe Device Real

### Android

1. Activează **Developer Options** pe telefon
2. Activează **USB Debugging**
3. Conectează telefonul la PC cu USB
4. Rulează: `adb devices` pentru a verifica
5. Rulează: `npm run android`

### iOS

1. Conectează iPhone-ul la Mac
2. Asigură-te că ai Xcode instalat
3. Rulează: `npm run ios`
4. Selectează device-ul din Xcode

## Actualizare Dependențe

### Update toate pachetele Expo

```bash
npx expo install --fix
```

### Update manual

```bash
npm update
```

### Verifică versiuni învechite

```bash
npm outdated
```

## Útil pentru Debugging

### Verifică ce porturi sunt folosite

```bash
netstat -ano | findstr :8081
```

### Oprește toate procesurile Node

```bash
taskkill /F /IM node.exe
```

### Verifică instalarea Expo CLI

```bash
npx expo --version
```

## Environment Variables (Viitor)

Pentru configurări sensibile (API keys), creează un fișier `.env`:

```bash
GOOGLE_MAPS_API_KEY=your_key_here
```

Apoi instalează:

```bash
npm install react-native-dotenv
```

---

**Pro Tip**: Păstrează terminalul Expo deschis mereu când dezvolți. Orice eroare va apărea instant aici! 🚀

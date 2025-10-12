# 🚀 Ghid Rapid de Start - PetTracker

## Pasul 1: Pornește Aplicația

Dacă serverul Expo nu rulează deja, pornește-l:

```bash
npm start
```

## Pasul 2: Deschide pe Telefon

### Pe Android:

1. Instalează **Expo Go** din Google Play Store
2. Deschide Expo Go
3. Scanează QR code-ul din terminal
4. Aplicația se va încărca automat!

### Pe iOS:

1. Instalează **Expo Go** din App Store
2. Deschide aplicația **Camera**
3. Scanează QR code-ul din terminal
4. Apasă pe notificarea care apare
5. Aplicația se va deschide în Expo Go!

## Pasul 3: Testează Funcționalitățile

### ✅ Test 1: Adaugă un Animal (2 minute)

1. Deschide aplicația
2. Ești deja pe tab-ul "Animale"
3. Apasă butonul **+** (albastru, colțul dreapta-sus)
4. Completează:
   - Nume: "Rex"
   - Tip: Selectează 🐕 Câine
   - Rasă: "Labrador" (opțional)
5. Apasă **Salvează**
6. ✅ Ai adăugat primul animal!

### ✅ Test 2: Desenează un Traseu (3 minute)

1. Mergi la tab-ul **Hartă** (iconița de hartă)
2. Apasă **Desenează Traseu**
3. Apasă pe hartă de 4-5 ori pentru a crea un traseu
   - Fiecare apăsare adaugă un punct
   - Punctele se conectează automat
4. Apasă **Salvează Traseu**
5. Introdu un nume: "Parcul din cartier"
6. Apasă **Salvează**
7. ✅ Primul traseu salvat!

### ✅ Test 3: Programează Notificări (2 minute)

1. Mergi la tab-ul **Program** (iconița de clopot)
2. Alege animalul "Rex"
3. Apasă butonul **+** de lângă Rex
4. Selectează o oră (ex: 18:00)
5. Selectează zilele: **L, M, M, J, V** (Luni-Vineri)
6. Apasă **Salvează**
7. ✅ Vei primi notificări în fiecare zi la ora 18:00!

**IMPORTANT**: Acordă permisiuni de notificări când aplicația cere!

### ✅ Test 4: Vezi Istoricul

1. Mergi la tab-ul **Istoric**
2. Vezi statisticile (deocamdată 0, normal!)
3. După ce faci plimbări, ele vor apărea aici

## 🎯 Tips & Tricks

### Notificări

- Notificările apar automat la ora programată
- Poți avea multiple programe pentru același animal
- Toggle-ul ON/OFF dezactivează temporar notificările

### Hartă

- Zoom in/out cu 2 degete
- Butonul de locație (colțul hartă) te centrează pe poziția ta
- Poți avea multiple trasee salvate
- Apasă steluța pentru favorite

### Animale

- Long-press pe un animal pentru a-l șterge rapid
- Editează apăsând pe card-ul animalului

## ⚠️ Troubleshooting

**Problema**: Notificările nu apar

- **Soluție**: Verifică setările telefonului → Notificări → Expo Go → Permite notificări

**Problema**: Harta nu arată locația mea

- **Soluție**: Acordă permisiuni de locație: Setări → Apps → Expo Go → Permissions → Location

**Problema**: Aplicația nu se încarcă

- **Soluție**:
  1. Închide serverul (Ctrl+C în terminal)
  2. Rulează `npm start` din nou
  3. Scanează codul din nou

## 🎨 Personalizare

Toate funcționalitățile sunt personalizabile:

- Adaugă câți de multe animale vrei
- Creează trasee nelimitate
- Programează multiple ore de plimbare
- Tot local, nimic nu se trimite la server!

## 📱 Hot Reload

Când modifici codul, aplicația se actualizează automat pe telefon! 🔥

- Modificări salvate automat se reflectă instant
- Nu trebuie să rescenezi QR code-ul

---

**Gata! Aplicația ta PetTracker este funcțională!** 🐾

Pentru mai multe detalii, vezi [README.md](./README.md)

# Kefo Baba Takipte — Ebeveyn Kontrolü & Uygulama İzleme

**PUNCH YAZILIM** · Native Android (Kotlin + Jetpack Compose + Firebase)

İki cihazlı, şeffaf bir ebeveyn kontrol sistemi. Tek APK, ilk açılışta rol seçimi:

- **İzlenen Cihaz (Çocuk modu):** Seçili uygulamalar açıldığında tespit eder ve olay gönderir.
- **Ebeveyn Cihazı (Yönetici modu):** Bildirim alır, izlenecek uygulamaları seçer, PIN yönetir.

İki cihaz **6 haneli eşleştirme kodu** ile aynı *aile* hesabına bağlanır.

> **Şeffaflık:** Uygulama gizlenmez. Launcher ikonu görünür, izlenen cihazda kalıcı
> "İzleme aktif" bildirimi gösterilir. Stealth / gizli mod / ikon gizleme **yoktur**.

---

## Mimari

```
İzlenen cihaz                         Firebase                      Ebeveyn cihaz
─────────────              ────────────────────────────            ─────────────
Uygulama açılır                                                     
   │  (UsageStats +                                                 
   │   AccessibilityService)                                        
   ▼                                                               
Firestore'a olay yaz  ───────►  events/{id} onCreate              
                                      │  (Cloud Function)           
                                      ▼                             
                                FCM push  ───────────────────────►  "'WhatsApp' açıldı — 14:32"
```

- **FCM server key istemcide tutulmaz.** Push yalnızca Cloud Function (Admin SDK) tarafından atılır.
- Tespit iki kaynaktan beslenir: `AccessibilityService` (TYPE_WINDOW_STATE_CHANGED) +
  `UsageStatsManager` yoklaması. Tek bir `DetectionCoordinator` 60 sn debounce uygular,
  böylece aynı açılış için çift bildirim oluşmaz.
- **Foreground Service** izlemeyi OEM kill'lerine karşı ayakta tutar.
- DI: **Hilt** · Eşzamanlılık: **Coroutines + Flow** · Güvenli depolama: **EncryptedSharedPreferences**

## Teknoloji

| Alan | Seçim |
|------|-------|
| Dil / UI | Kotlin, Jetpack Compose (Material 3) |
| minSdk / targetSdk / compileSdk | 26 / 35 / 35 |
| Firebase | Firestore, Cloud Messaging (FCM), Auth (anonim), Cloud Functions |
| DI | Hilt |
| Asenkron | Coroutines + Flow |
| Güvenlik | EncryptedSharedPreferences, SHA-256 + tuz (PIN) |

---

## Firestore Yapısı

```
families/{familyId}                       { pin_salt, pin_hash, createdAt }
families/{familyId}/devices/{deviceId}    { role, fcmToken, name, lastSeen }
families/{familyId}/monitoredApps/{pkg}   { appName, enabled }
families/{familyId}/events/{eventId}      { packageName, appName, timestamp, childDeviceId, childDeviceName }
pairingCodes/{code}                       { familyId, expiresAt }
```

---

## Çekirdek Özellikler

1. **Uygulama açılış tespiti** — UsageStats + AccessibilityService, 60 sn debounce.
2. **Cihazlar arası bildirim** — olay → Cloud Function → FCM push.
3. **Kaldırma koruması** — DeviceAdminReceiver; admin'i kapatmak için uygulama içinde PIN.
4. **Uygulama seçici** — yüklü uygulamalar, aranabilir liste, Firestore senkronu.
5. **Eşleştirme** — 6 haneli süreli kod (15 dk).
6. **Şeffaflık** — kalıcı "İzleme aktif" bildirimi, ikon gizleme yok.

---

## Kurulum

### 1) Firebase projesi oluştur

1. [Firebase Console](https://console.firebase.google.com) → **Proje ekle** → adı: `kefo-baba-takipte`
   (farklı isim kullanırsan `.firebaserc` ve `functions/src/index.ts` bölge ayarını gözden geçir).
2. **Firestore Database**'i etkinleştir (production mode).
3. **Authentication → Sign-in method → Anonymous**'u etkinleştir.
4. **Cloud Messaging** otomatik gelir.
5. **Android uygulaması ekle**:
   - Paket adı: `com.punchyazilim.kefobaba`
   - İndirilen **`google-services.json`** dosyasını `app/` klasörüne koy (repodaki yer tutucunun üzerine yaz).

### 2) Logo

Marka logosu zaten ekli: `app/src/main/res/drawable/logo_basak.png`.
Değiştirmek istersen aynı yola yeni PNG'yi koy.

### 3) Android uygulamasını derle

```bash
# JDK 17 gerekli
./gradlew assembleDebug
# APK: app/build/outputs/apk/debug/app-debug.apk

# Cihaza kur
./gradlew installDebug
```

> İlk derlemede Gradle wrapper (8.11.1) ve bağımlılıklar internetten iner.

### 3b) APK'yı GitHub Actions ile otomatik derle (yerel SDK kurmadan)

Repoda hazır bir workflow var: `.github/workflows/build-apk.yml`.

1. Projeyi `Kefo-Baba-Takipte` reposuna push'la.
2. GitHub → **Actions** sekmesi → **APK Derle** workflow'u otomatik çalışır
   (veya **Run workflow** ile elle tetikle).
3. Derleme bitince:
   - **Actions → ilgili run → Artifacts → `kefo-baba-takipte-debug-apk`** içinden APK'yı indir, **veya**
   - Repo izinleri uygunsa **Releases → `latest`** sürümüne otomatik eklenir.

> Not: Workflow, repodaki yer tutucu `google-services.json` ile debug APK üretir.
> Gerçek bildirimler için kendi `google-services.json`'unu eklemen ve Functions'ı deploy etmen gerekir.

### 4) Cloud Functions deploy

```bash
npm install -g firebase-tools
firebase login

cd functions
npm install
cd ..

# Firestore kuralları + indeksler + fonksiyonlar
firebase deploy --only firestore:rules,firestore:indexes,functions
```

Fonksiyonlar `europe-west1` bölgesine kurulur (`functions/src/index.ts` içinde değiştirilebilir).

---

## Kullanım

### Ebeveyn cihazında
1. Uygulamayı aç → **Ebeveyn Cihazı**'nı seç.
2. Aile oluşturulur → **PIN belirle**.
3. **Eşleştir** sekmesinden 6 haneli kod üret.
4. **Uygulamalar** sekmesinden izlenecek uygulamaları seç.
5. **Olaylar** sekmesinden geçmişi gör; bildirimler push olarak da gelir.

### Çocuk (izlenen) cihazında
1. Uygulamayı aç → **İzlenen Cihaz**'ı seç.
2. 6 haneli kodu gir.
3. **Kurulum sihirbazı**nı sırayla tamamla:
   Usage Access → Accessibility → Bildirim izni → (önerilir) Pil muafiyeti → (önerilir) Device Admin.
4. "İzleme aktif" ekranı görünür; kalıcı bildirim gösterilir.

### Kaldırma koruması
- Device Admin etkinken uygulama doğrudan kaldırılamaz.
- Çocuk ekranında **"Kaldırma korumasını yönet (PIN)"** → ebeveyn PIN'i girilince Device Admin
  kapatılır ve uygulama kaldırılabilir hale gelir.

---

## İzinler (neden gerekli?)

| İzin | Amaç |
|------|------|
| `PACKAGE_USAGE_STATS` | Hangi uygulamanın öne geldiğini tespit |
| Accessibility Service | Uygulama açılışını anında yakalama (ekran içeriği okunmaz) |
| `POST_NOTIFICATIONS` | Kalıcı "İzleme aktif" ve uyarı bildirimleri |
| `FOREGROUND_SERVICE(_SPECIAL_USE)` | İzlemeyi arka planda ayakta tutma |
| Pil optimizasyonu muafiyeti | Servisin OEM tarafından öldürülmemesi (önerilir) |
| Device Admin | İzinsiz kaldırmayı engelleme (önerilir) |
| `QUERY_ALL_PACKAGES` | Uygulama seçici için yüklü uygulama listesi |

---

## Proje Yapısı

```
.
├── app/                              # Android uygulaması
│   ├── src/main/
│   │   ├── AndroidManifest.xml
│   │   ├── java/com/punchyazilim/kefobaba/
│   │   │   ├── KefoApp.kt            # Application + bildirim kanalları
│   │   │   ├── MainActivity.kt
│   │   │   ├── admin/                # Device Admin (kaldırma koruması)
│   │   │   ├── data/                 # Modeller, Firestore/Settings/Auth depoları
│   │   │   ├── di/                   # Hilt modülü
│   │   │   ├── service/              # Accessibility, Foreground, FCM, Boot, Coordinator
│   │   │   ├── ui/                   # Compose ekranlar, tema, navigasyon
│   │   │   └── util/                 # PIN, izinler, yüklü uygulamalar, FCM token
│   │   └── res/                      # tema, renkler, ikonlar, logo_basak.png
│   ├── build.gradle.kts
│   └── google-services.json          # YER TUTUCU — kendi dosyanızla değiştirin
├── functions/                        # Cloud Functions (TypeScript)
│   └── src/index.ts                  # events onCreate → FCM push
├── firestore.rules
├── firestore.indexes.json
├── firebase.json
└── README.md
```

---

## Güvenlik Notları

- PIN düz metin saklanmaz: rastgele tuz + SHA-256, EncryptedSharedPreferences içinde.
- FCM gönderimi yalnızca sunucu tarafında (Cloud Function); istemcide server key yok.
- Firestore kuralları `request.auth != null` ister (anonim oturum). Üretimde aile bazlı
  üyelik kısıtı (custom claims / membership dökümanı) eklenmesi önerilir.

---

© PUNCH YAZILIM

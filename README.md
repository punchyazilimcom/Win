# Excel Yöneticisi (PWA)

Excel dosyalarını **Kategori + Yıl/Ay** düzeninde yöneten bir PWA. Bir dosyaya
tıklandığında dosya, Windows sunucudaki **gerçek masaüstü Excel**'de açılır ve
ekran bir **Apache Guacamole** oturumu olarak uygulama içinde `iframe` ile
gösterilir. Böylece kullanıcı uygulamadan çıkmaz ve `.xlsm` içindeki **VBA
makroları** gerçek Excel'de sorunsuz çalışır. Aynı anda en fazla **3 eşzamanlı
oturum** desteklenir.

```
┌──────────────┐     ID token      ┌────────────────┐  Encrypted JSON   ┌────────────┐
│  Client PWA  │ ───────────────▶  │ Express server │ ─── token ──────▶ │ Guacamole  │
│ (React/Vite) │  ◀── { url } ───  │ (Firebase Adm.)│                   │  (RDP)     │
└──────────────┘                   └────────────────┘                   └─────┬──────┘
       │  iframe(url)                                                         │ RemoteApp
       └─────────────────────────────────────────────────────────────▶  Windows + Excel
```

- **client**: React 18 + Vite + TypeScript + Tailwind CSS + PWA (`vite-plugin-pwa`)
- **auth + metadata**: Firebase Auth (email/şifre) + Firestore + Storage
- **server**: Node.js + Express + TypeScript (Guacamole token + dosya yönetimi)
- **excel açma**: Apache Guacamole `iframe` (Encrypted JSON auth ile token)

---

## 1. Dizin yapısı

```
client/                 # React PWA
  src/firebase.ts
  src/context/AuthContext.tsx
  src/theme.ts
  src/lib/{api,firestore,types}.ts
  src/components/        # Header, CategoryCard, FileCard, FilterBar, UploadModal,
                         # CategoryModal, GuacamoleViewer, SettingsPanel, Toast, ...
  src/pages/            # Login, Home, CategoryView, Settings
  vite.config.ts        # PWA plugin + dev proxy
  .env.example
server/                 # Express API
  src/index.ts
  src/middleware/auth.ts
  src/routes/{upload,open,sessions}.ts
  src/lib/{guacToken,fileStore,sessionStore,firebaseAdmin}.ts
  .env.example
firestore.rules
storage.rules
```

---

## 2. Gereksinimler

- Node.js 18+ (geliştirme Node 20/22 ile test edildi)
- Bir **Firebase** projesi (Auth + Firestore + Storage etkin)
- Bir **Windows** makinesi: masaüstü Excel kurulu, **RemoteApp** olarak Excel
  yayınlanmış, RDP açık
- Bir **Apache Guacamole** sunucusu (`guacamole-auth-json` eklentisiyle)
- Excel dosyalarının yazılacağı paylaşımlı klasör (Windows makinenin de
  eriştiği bir SMB/NFS share önerilir)

---

## 3. Firebase kurulumu

1. [Firebase console](https://console.firebase.google.com)'da proje oluşturun.
2. **Authentication → Sign-in method → Email/Password**'ü etkinleştirin.
3. **Firestore Database**'i oluşturun (production mode).
4. **Storage**'ı etkinleştirin.
5. **Project settings → General → Your apps → Web app** ekleyin; çıkan config
   değerlerini `client/.env` içine girin (bkz. `client/.env.example`).
6. **Project settings → Service accounts → Generate new private key** ile bir
   servis hesabı JSON'u indirin; `server/` altına `serviceAccount.json` olarak
   koyun (veya `FIREBASE_SERVICE_ACCOUNT` env'ine JSON içeriğini gömün).

### Güvenlik kuralları

```bash
# Firebase CLI ile (önerilir)
npm i -g firebase-tools
firebase login
firebase deploy --only firestore:rules,storage
```
veya kuralları console'dan `firestore.rules` / `storage.rules` içeriğiyle elle
yapıştırın.

### İlk yönetici (admin)

Yeni kullanıcılar otomatik olarak **viewer** rolüyle kaydolur. İlk yöneticiyi
elle yükseltin:

1. Uygulamadan bir kez giriş yapın (Firestore'da `users/{uid}` belgesi oluşur).
2. Firestore console'da o belgenin `role` alanını `admin` yapın.
3. Bundan sonra adminler, **Ayarlar → Kullanıcılar** ekranından rol atayabilir.

> Firebase Auth'ta kullanıcı oluşturma: Authentication → Users → Add user
> (email/şifre). Uygulamanın kendisinde kayıt ekranı yoktur; kullanıcılar
> yönetici tarafından oluşturulur.

---

## 4. Windows RemoteApp (Excel) hazırlığı

1. Windows Server'da **Remote Desktop Services / RemoteApp** rolünü kurun
   (veya tek makinede RDP + RemoteApp yapılandırması).
2. Excel'i RemoteApp olarak yayınlayın ve takma adını **`excel`** verin.
   Guacamole'de `remote-app` değeri `||excel` olarak gönderilir (baştaki `||`
   RemoteApp protokolünü belirtir, `excel` yayınlanan uygulama takma adıdır).
3. RDP erişimi olan bir kullanıcı hesabı açın; bilgilerini `server/.env`'e girin
   (`WINDOWS_RDP_USER`, `WINDOWS_RDP_PASS`).
4. Excel'in açacağı dosya yolu, Guacamole'ye `remote-app-args` ile
   `"<serverPath>"` biçiminde (tırnaklı) geçer. Paylaşımlı klasörün Windows'tan
   görünen yolu ile sunucunun yazdığı yolun **aynı dosyaya** işaret ettiğinden
   emin olun (ör. her ikisi de `\\NAS\excelshare\...`).

---

## 5. Apache Guacamole (Encrypted JSON) kurulumu

1. Guacamole'ye `guacamole-auth-json` eklentisini kurun (`GUACAMOLE_HOME/extensions/`).
2. `guacamole.properties` içine 128-bit (16 byte = **32 hex karakter**) bir
   anahtar tanımlayın:
   ```properties
   json-secret-key: 4c0b569e4c96df157eee1b65dd0e4d41
   ```
   Aynı değeri `server/.env` → `GUAC_JSON_SECRET_KEY` olarak girin.
3. Guacamole'yi (ve `guacd`'yi) yeniden başlatın.

### Token üretimi (server tarafı, `server/src/lib/guacToken.ts`)

Server, her açış için 60 saniye geçerli bir token üretir:

1. Bağlantı JSON'u oluşturulur (rdp + remote-app `||excel` + dosya yolu).
2. `plaintext = JSON.stringify(obj)` (UTF-8).
3. `signature = HMAC-SHA-256(plaintext, KEY)` — `KEY`, hex'ten Buffer.
4. `signed = signature || plaintext`.
5. `IV = 16 bayt sıfır`.
6. `encrypted = AES-128-CBC(signed, KEY, IV)`.
7. `token = base64(encrypted)`.
8. İstemciye dönen URL: `https://guac.host/guacamole/#/?data=<URL-encoded token>`.

`KEY`, RDP kimlik bilgileri ve sunucu IP'si **yalnızca server `.env`'de** tutulur;
istemciye asla sızmaz.

---

## 6. Yapılandırma (.env)

### `server/.env`  (örnek: `server/.env.example`)

| Değişken | Açıklama |
|---|---|
| `PORT` | API portu (vars. 4000) |
| `CORS_ORIGIN` | İzinli istemci origin'i (ör. `http://localhost:5173`) |
| `GOOGLE_APPLICATION_CREDENTIALS` / `FIREBASE_SERVICE_ACCOUNT` | Firebase Admin kimliği |
| `FIREBASE_PROJECT_ID` | Firebase proje kimliği |
| `FILE_SHARE_ROOT` | Excel'lerin yazılacağı kök klasör |
| `MAX_UPLOAD_BYTES` | Yükleme boyut limiti (vars. 50 MB) |
| `GUAC_JSON_SECRET_KEY` | 32 hex karakter (guacamole.properties ile aynı) |
| `GUAC_BASE_URL` | Guacamole web adresi |
| `WINDOWS_RDP_HOST/PORT/USER/PASS` | RDP host bilgileri |
| `GUAC_REMOTE_APP` | RemoteApp değeri (`||excel`) |
| `MAX_SESSIONS` | Eşzamanlı oturum limiti (vars. 3) |
| `TOKEN_TTL_MS` | Token ömrü (vars. 60000) |

### `client/.env`  (örnek: `client/.env.example`)

| Değişken | Açıklama |
|---|---|
| `VITE_FIREBASE_*` | Firebase web app config değerleri |
| `VITE_API_BASE` | API kök URL'si. Boş bırakılırsa Vite dev proxy (`/api`) kullanılır |

---

## 7. Çalıştırma (geliştirme)

```bash
# Terminal 1 — server
cd server
cp .env.example .env        # değerleri doldurun, serviceAccount.json ekleyin
npm install
npm run dev                 # http://localhost:4000

# Terminal 2 — client
cd client
cp .env.example .env        # VITE_FIREBASE_* doldurun
npm install
npm run dev                 # http://localhost:5173 (API'yi /api üzerinden proxy'ler)
```

## 8. Derleme / dağıtım (production)

```bash
# server
cd server && npm install && npm run build && npm start   # dist/index.js çalışır

# client
cd client && npm install && npm run build                # dist/ statik PWA çıktısı
```

- `client/dist` herhangi bir statik host'a (Nginx, Firebase Hosting, vb.) konur.
  SPA olduğundan tüm yolları `index.html`'e yönlendirin (history fallback).
- `server` bir Node süreci olarak çalışır; `CORS_ORIGIN`'i client domain'iyle
  eşleştirin ve `FILE_SHARE_ROOT`'u Windows makinenin de eriştiği paylaşıma
  bağlayın.
- Guacamole ve server'ı **HTTPS** arkasına alın; `iframe` için karışık içerik
  (mixed content) olmaması adına tüm uçlar `https` olmalı.

---

## 9. API uçları

Tüm uçlar `Authorization: Bearer <Firebase ID token>` ister. Yazma işlemleri
**admin** rolü gerektirir.

| Yöntem | Yol | Açıklama |
|---|---|---|
| `POST` | `/api/upload` | multipart dosya alır, `{SHARE}/{kategori}/{yıl}/{ay}/{dosya}` olarak yazar, Firestore `files` kaydı oluşturur. `.xlsm` ise `hasMacro=true`. Aynı ad varsa `version+1` (eskisi arşivlenir). |
| `POST` | `/api/open` | `{ fileId }` alır; aktif oturum < `MAX_SESSIONS` ise Guacamole token'lı `{ url }` döner. 3 doluysa **429**. |
| `GET` | `/api/sessions` | `{ active, max, sessions }` döner. |
| `POST` | `/api/sessions/close` | `{ fileId }` oturumu serbest bırakır. |
| `GET` | `/api/health` | sağlık kontrolü. |

---

## 10. Veri modeli (Firestore)

```
settings/app    : { appName, brandColor, logoUrl }
users/{uid}     : { role: "admin" | "viewer", displayName, email }
categories/{id} : { name, iconUrl, color, order, createdAt }
files/{id}      : { categoryId, name, year, month(1-12), serverPath, size,
                    hasMacro, version, isLatest, deleted, deletedAt,
                    uploadedAt, uploadedBy }
users/{uid}/recent/{fileId} : { fileId, name, openedAt }
```

---

## 11. Özellikler

- Firebase Auth ile giriş; oturum yoksa `/login`.
- Markalı appbar (logo `settings/app.logoUrl`'den; yoksa sarı "B").
- Kategori kartları (özel ikon + vurgu rengi, dosya sayısı rozeti).
- Kategori CRUD + sıra değiştirme (Ayarlar) + ikon yükleme (Storage).
- Yıl/Ay filtresi (varsayılan en güncel ay), dosya kartları, makro rozeti.
- Excel yükleme (sürükle-bırak, ad'dan yıl/ay tahmini, `.xlsx/.xlsm/.csv`).
- Dosya açma: Guacamole `iframe`, 3 oturum limiti (4.'de uyarı).
- Genel arama, son açılanlar, sürüm geçmişi (eski sürüme dön), çöp kutusu
  (yumuşak silme, 30 gün), roller (admin/viewer), PWA install.

---

## 12. Kabul kriteri

Giriş → kategori → yıl/ay filtre → dosya aç → `iframe` içinde gerçek Excel
makrolarıyla açılıyor; 4. eşzamanlı açış engelleniyor; `npm run build` hem
client hem server için hatasız.

# İdil & Burak | Nişan Anılarımız

React + Vite + TypeScript + Tailwind ile hazırlanmış, GitHub Pages üzerinde yayınlanabilen nişan fotoğraf/video yükleme sitesi.

Misafirler QR kod ile siteye girer, adlarını isterlerse yazar ve İdil & Burak'ın 16.05.2026 tarihli nişan fotoğraf/videolarını yükler. Dosyalar hızlı backend üzerinden Google Drive klasörünüze kaydedilir; backend URL verilmezse eski Google Apps Script fallback yolu kullanılabilir.

Yeni hızlı sürümde frontend GitHub Pages'te kalır, upload ise ayrı Node/Docker backend üzerinden Google Drive'a stream edilir. `VITE_UPLOAD_API_URL` verilirse hızlı backend kullanılır; verilmezse eski Apps Script/base64 yolu fallback olarak çalışır.

## Özellikler

- Çoklu fotoğraf/video seçimi
- Drag & drop yükleme alanı
- Misafir adı alanı, isteğe bağlı
- Her dosya için ayrı durum ve progress göstergesi
- Dosyalar 2'li gruplar halinde paralel yüklenir
- Hızlı backend modunda dosyalar base64'e çevrilmeden `multipart/form-data` ile gönderilir
- Türkçe, mobil öncelikli arayüz
- Dosya validasyonu
  - Fotoğraf: en fazla 2 GB
  - Video: en fazla 5 GB
  - Sadece `image/*` ve `video/*`
- Dosya adı sanitize edilir
- GitHub Pages ve GitHub Actions deploy desteği

## Ortam değişkenleri

`.env.example` dosyasını `.env` olarak kopyalayın:

```env
VITE_APPS_SCRIPT_UPLOAD_URL=
VITE_UPLOAD_API_URL=https://178.104.201.90.nip.io/upload
VITE_BASE_PATH=/newWedding/
```

`VITE_UPLOAD_API_URL`, hızlı backend upload endpoint'idir. Örnek:

```env
VITE_UPLOAD_API_URL=https://api.example.com/upload
```

`VITE_APPS_SCRIPT_UPLOAD_URL`, eski Apps Script Web App fallback URL'sidir.

## Hızlı backend kurulumu

Backend kodu `backend/` klasöründedir. GitHub Pages frontend'i statik kalır, dosya upload'ları bu API'ye gider.

Backend için önerilen Google Drive yetkilendirmesi OAuth refresh token'dır. Bu yöntem dosyaları senin Google hesabının Drive kotasıyla hedef klasöre yazar:

1. Google Cloud Console'da proje oluşturun veya mevcut proje kullanın.
2. Google Drive API'yi etkinleştirin.
3. OAuth consent ekranında kendi Gmail adresinizi test user olarak ekleyin.
4. OAuth Desktop client oluşturun ve client JSON dosyasını indirin.
5. `backend/scripts/get-refresh-token.mjs` ile izin verip refresh token alın.
6. Client id, client secret ve refresh token değerlerini sunucu env dosyasına yazın.

Service account desteği fallback olarak durur; kişisel Drive klasörüne büyük dosya yazarken OAuth daha sorunsuzdur.

Backend env örneği:

```env
PORT=8080
DRIVE_FOLDER_ID=1Kqi...
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REFRESH_TOKEN=
GOOGLE_SERVICE_ACCOUNT_FILE=/run/secrets/google-service-account.json
ALLOWED_ORIGINS=https://burakbayar95.github.io,http://localhost:5173,http://127.0.0.1:5173
MAX_FILE_BYTES=5368709120
```

Docker build:

```bash
docker build -t new-wedding-upload-api ./backend
```

Docker run:

```bash
docker run -d \
  --name new-wedding-upload-api \
  -p 8080:8080 \
  --env-file ./backend/.env \
  -v /opt/new-wedding/google-service-account.json:/run/secrets/google-service-account.json:ro \
  new-wedding-upload-api
```

Production'da bu API HTTPS arkasında yayınlanmalıdır. GitHub Pages HTTPS olduğu için backend de HTTPS olmalı; aksi halde tarayıcı mixed-content sebebiyle upload'u engeller.

Bu repo `deploy/docker-compose.yml` ile Caddy + upload API birlikte çalışacak şekilde hazırlanmıştır. Caddy otomatik HTTPS alır.

Sunucu deploy env örneği:

```bash
mkdir -p /opt/new-wedding
cp deploy/.env.example deploy/.env
```

`deploy/.env` içinde:

```env
UPLOAD_DOMAIN=178.104.201.90.nip.io
DRIVE_FOLDER_ID=1Kqi...
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REFRESH_TOKEN=
GOOGLE_SERVICE_ACCOUNT_FILE=/opt/new-wedding/google-service-account.json
ALLOWED_ORIGINS=https://burakbayar95.github.io,http://localhost:5173,http://127.0.0.1:5173
MAX_FILE_BYTES=5368709120
```

Sonra:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d --build
```

Frontend upload URL:

```env
VITE_UPLOAD_API_URL=https://178.104.201.90.nip.io/upload
```

Bu repo için GitHub Actions workflow'u bu URL'yi varsayılan olarak kullanır. Domain değişirse `VITE_UPLOAD_API_URL` secret veya variable olarak güncelleyin.

## Google Drive ve Apps Script kurulumu

1. Google Drive'da nişan için klasör oluşturun.
2. Klasör ID'sini URL'den alın.
3. [Google Apps Script](https://script.google.com/) projesi oluşturun.
4. `google-apps-script/Code.gs` içeriğini Apps Script editörüne yapıştırın.
5. `FOLDER_ID` değerini kendi Drive klasör ID'nizle değiştirin.
6. `Deploy > New deployment` ile Web App olarak deploy edin.
7. Ayarlar:
   - Type: `Web app`
   - Execute as: `Me`
   - Who has access: `Anyone`
8. Google'ın istediği Drive izinlerini onaylayın.
9. Web App URL'sini `.env` içindeki `VITE_APPS_SCRIPT_UPLOAD_URL` değerine yazın.

Daha ayrıntılı notlar için `google-apps-script/README.md` dosyasına bakın.

## Local çalıştırma

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## GitHub Pages deploy

1. GitHub'da `newWedding` adlı repo oluşturun.
2. Bu projeyi repo'ya push edin.
3. Repo ayarlarında `Settings > Pages > Build and deployment > Source` değerini `GitHub Actions` seçin.
4. `Settings > Secrets and variables > Actions` altında secret ekleyin:
   - `VITE_APPS_SCRIPT_UPLOAD_URL`
   - Backend domainini değiştirirseniz `VITE_UPLOAD_API_URL`
   - İsterseniz `VITE_BASE_PATH` için `/newWedding/`
5. `main` branch'e push edildiğinde `.github/workflows/deploy.yml` çalışır.

### `Get Pages site failed` hatası

GitHub Actions içinde `actions/configure-pages` adımı şu hatayı verirse:

```text
Get Pages site failed. Please verify that the repository has Pages enabled and configured to build using GitHub Actions.
```

Repo için GitHub Pages henüz etkin değildir. GitHub'da şu ayarı yapın:

```text
Repository > Settings > Pages > Build and deployment > Source > GitHub Actions
```

Bu ayardan sonra workflow'u yeniden çalıştırın veya `main` branch'e yeni bir push yapın.

Yayın URL'si:

```text
https://burakbayar95.github.io/newWedding/
```

QR kodu bu URL için oluşturabilirsiniz.

## Apps Script payload

Her dosya için şu JSON gövdesi gönderilir:

```json
{
  "guestName": "Misafir adı",
  "fileName": "orijinal-dosya-adi.jpg",
  "mimeType": "image/jpeg",
  "fileIndex": 1,
  "uploadGroupId": "20260512T183000-a1b2c3d4",
  "base64Data": "...."
}
```

Frontend bu JSON'u CORS preflight riskini azaltmak için `text/plain;charset=utf-8` content type ile gönderir. Apps Script tarafında yine JSON olarak parse edilir.

Drive dosya adı şu yapıda oluşur:

```text
misafir-adi_001_orijinal-dosya-adi_uploadGroupId.jpg
```

Misafir adı boşsa `misafir` kullanılır. Aynı seçimdeki dosyalar aynı `uploadGroupId` ile gruplanır ve `001`, `002`, `003` şeklinde sıralanır.

Beklenen başarılı yanıt:

```json
{
  "success": true,
  "fileId": "...",
  "fileUrl": "...",
  "fileName": "..."
}
```

## Büyük dosya uyarısı

Bu sürüm dosyayı binary olarak değil base64 JSON olarak gönderir. Base64 dönüşümü tarayıcı RAM'i kullanır ve veri boyutunu artırır. Özellikle çok büyük videolarda tarayıcı, ağ veya Apps Script limitleri nedeniyle yükleme başarısız olabilir. İlk sürüm basit ve çalışır bir akış hedefler.

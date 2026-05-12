# İdil & Burak | Nişan Anılarımız

React + Vite + TypeScript + Tailwind ile hazırlanmış, GitHub Pages üzerinde yayınlanabilen nişan fotoğraf/video yükleme sitesi.

Misafirler QR kod ile siteye girer, adlarını isterlerse yazar ve İdil & Burak'ın 16.05.2026 tarihli nişan fotoğraf/videolarını yükler. Dosyalar Firebase veya ayrı backend olmadan Google Apps Script Web App endpoint'i üzerinden Google Drive klasörünüze kaydedilir.

## Özellikler

- Çoklu fotoğraf/video seçimi
- Drag & drop yükleme alanı
- Misafir adı alanı, isteğe bağlı
- Her dosya için ayrı durum ve progress göstergesi
- Dosyalar 2'li gruplar halinde paralel yüklenir
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
VITE_BASE_PATH=/wedding-upload/
```

`VITE_APPS_SCRIPT_UPLOAD_URL`, Apps Script Web App deploy URL'sidir.

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

1. GitHub'da `wedding-upload` adlı repo oluşturun.
2. Bu projeyi repo'ya push edin.
3. Repo ayarlarında `Settings > Pages > Build and deployment > Source` değerini `GitHub Actions` seçin.
4. `Settings > Secrets and variables > Actions` altında secret ekleyin:
   - `VITE_APPS_SCRIPT_UPLOAD_URL`
   - İsterseniz `VITE_BASE_PATH` için `/wedding-upload/`
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
https://burakbayar95.github.io/wedding-upload/
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

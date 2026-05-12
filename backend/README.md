# New Wedding Upload API

GitHub Pages frontend'i icin hizli upload backend'i. Dosyalar base64'e cevrilmeden `multipart/form-data` ile gelir ve Google Drive API'ye stream edilir.

## Gerekli Google ayari

1. Google Cloud Console'da bir service account olusturun.
2. JSON key indirin.
3. Drive'daki hedef klasoru service account email'i ile paylasin.
4. Sunucuda JSON'u gizli dosya olarak saklayin veya `GOOGLE_SERVICE_ACCOUNT_JSON` env degerine tek satir JSON olarak koyun.

## Env

```env
PORT=8080
DRIVE_FOLDER_ID=1Kqi...
GOOGLE_SERVICE_ACCOUNT_FILE=/run/secrets/google-service-account.json
ALLOWED_ORIGINS=https://burakbayar95.github.io,http://127.0.0.1:5187
MAX_FILE_BYTES=5368709120
```

## Docker

```bash
docker build -t new-wedding-upload-api ./backend
docker run -d \
  --name new-wedding-upload-api \
  -p 8080:8080 \
  --env-file ./backend/.env \
  -v /opt/new-wedding/google-service-account.json:/run/secrets/google-service-account.json:ro \
  new-wedding-upload-api
```

Production icin nginx/HTTPS arkasindan yayinlayin ve frontend'e su env'i verin:

```env
VITE_UPLOAD_API_URL=https://api.example.com/upload
```

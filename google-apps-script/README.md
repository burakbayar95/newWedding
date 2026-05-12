# Google Apps Script kurulumu

Bu klasördeki `Code.gs`, GitHub Pages'teki React uygulamasından gelen base64 JSON yükleme isteklerini alır ve dosyayı tek bir Google Drive klasörüne kaydeder.

## Drive izni nasıl çalışır?

- Web App `Execute as: Me` ile deploy edilir.
- İlk deploy veya ilk test sırasında Google, script için Drive erişimi ister.
- Bu izni siz verirsiniz; misafirlerin Google hesabıyla giriş yapmasına gerek yoktur.
- `Who has access: Anyone` seçilirse QR kodu açan herkes Web App endpoint'ine yükleme isteği gönderebilir.
- Dosyalar sizin Drive hesabınızda, `FOLDER_ID` ile verdiğiniz klasörde oluşur.

## Kurulum

1. Google Drive'da nişan için bir klasör oluşturun.
2. Klasörü açın ve URL'deki klasör ID'sini kopyalayın.
   - Örnek URL: `https://drive.google.com/drive/folders/1AbC...`
   - Klasör ID'si: `1AbC...`
3. [Google Apps Script](https://script.google.com/) içinde yeni proje oluşturun.
4. `Code.gs` içeriğini Apps Script editörüne yapıştırın.
5. En üstteki `FOLDER_ID` değerini kendi klasör ID'nizle değiştirin.
6. `Deploy > New deployment` seçin.
7. Type: `Web app`
8. Execute as: `Me`
9. Who has access: `Anyone`
10. Deploy edin ve Google'ın istediği Drive izinlerini onaylayın.
11. Web App URL'sini kopyalayın.
12. Frontend `.env` dosyasında şu değere yazın:

```env
VITE_APPS_SCRIPT_UPLOAD_URL=https://script.google.com/macros/s/.../exec
```

## Health check

Deploy sonrası Web App URL'sini tarayıcıda açtığınızda şu yanıtı görmelisiniz:

```json
{ "status": "ok" }
```

## CORS notu

Apps Script `ContentService` özel CORS header set etmeye izin vermez. Bu yüzden frontend JSON gövdesini `Content-Type: text/plain;charset=utf-8` ile gönderir. Gövde yine JSON string'dir ve `doPost(e)` içinde parse edilir.

`application/json` veya özel header kullanırsanız tarayıcı preflight isteği yapabilir ve Apps Script Web App bunu beklediğiniz gibi yanıtlamayabilir.

## Büyük dosya notu

Bu ilk sürüm dosyayı tarayıcıda base64'e çevirir ve Apps Script'e JSON olarak gönderir. Base64 dönüşümü RAM kullanır ve dosya boyutunu yaklaşık üçte bir artırır. Çok büyük videolarda tarayıcı, ağ veya Apps Script çalışma limitleri nedeniyle hata alınabilir.

İlk sürüm basit çalışacak şekilde tasarlanmıştır; yoğun kullanım veya çok büyük videolar için ileride resumable upload destekli farklı bir backend düşünülmelidir.

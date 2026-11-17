# Barber Reservation
 
Berberler için geliştirilmiş, uçtan  uca bir randevu yönetim sistemi. Müşteriler bir dükkanın sayfasından uygun saatleri görüp randevu alabilir; berber ise yönetim panelinden çalışma saatlerini, randevuları ve kara listeyi yönetir.
 
Backend Spring Boot ile REST API olarak, frontend React ve TypeScript ile tek sayfalık uygulama olarak yazılmıştır.
 
## Özellikler
 
**Müşteri tarafı**
- Dükkana özel adres üzerinden (`/:slug`) randevu sayfası
- Seçilen güne ait müsait saatlerin listelenmesi
- Hizmet seçimi (örn. saç, sakal, saç + sakal) ile randevu oluşturma
- Her randevu için üretilen iptal kodu ile randevuyu iptal edebilme
- WhatsApp üzerinden otomatik hatırlatma mesajları

**Berber / yönetici tarafı**
- JWT tabanlı giriş
- Randevuları listeleme ve durum güncelleme (onaylı, iptal, tamamlandı)
- Tek tek ya da bir gün için toplu zaman dilimi (slot) üretme ve silme
- Çalışma saatleri, dükkan bilgileri ve dükkan açık/kapalı durumu yönetimi
- Hesap güvenlik bilgilerini (kullanıcı adı, parola) güncelleme
- Müşteri telefonuna göre kara liste; kara listedeki müşteri o dükkandan randevu alamaz
**Otomatik görevler**
- Her gün 03:00'te tarihi geçmiş ve boş kalmış slotlar silinir; veritabanı gereksiz veriyle büyümez.
- Her gün 19:00'da (Europe/Istanbul) ertesi günkü randevular için hatırlatma gönderilir.
- 5 dakikada bir çalışan görevler, randevuya yaklaşık 2 saat ve 30 dakika kalan müşterilere hatırlatma gönderir. Her hatırlatma için ayrı bir gönderildi bayrağı tutulduğundan aynı mesaj tekrar gönderilmez.
## Teknolojiler
 
| Katman | Teknolojiler |
| :--- | :--- |
| Backend | Java 21, Spring Boot, Spring Web, Spring Data JPA (Hibernate), Spring Security, Bean Validation |
| Kimlik doğrulama | JWT (jjwt), BCrypt ile parola saklama |
| Veritabanı | PostgreSQL |
| Dokümantasyon | springdoc-openapi (Swagger UI) |
| Bildirim | Twilio WhatsApp API |
| Frontend | React 19, TypeScript, Vite, React Router, Axios, Tailwind CSS |
| Araçlar | Maven, Docker (PostgreSQL için), Git |
 

## Veri Modeli
 
- **Shop**: Dükkan bilgileri ve URL'de kullanılan `slug`
- **Admin**: Bir dükkana bağlı yönetici hesabı
- **TimeSlot**: Tarih, başlangıç ve bitiş saati; `booked` ve `active` alanları. `(slotDate, startTime)` çifti üzerinde benzersizlik kısıtı vardır, aynı güne aynı saatin iki kez açılması veritabanı seviyesinde engellenir.
- **Appointment**: Müşteri adı, telefonu, hizmet türü, durum, iptal kodu ve hatırlatma bayrakları
- **Blacklist**: Dükkana göre engellenen müşteri telefonları
## API Özeti
 
Tüm uç noktalar `/api/v1` altındadır. Ayrıntılar Swagger UI'da görülebilir.
 
| Alan | Yöntem ve yol | Erişim |
| :--- | :--- | :--- |
| Giriş | `POST /auth/login` | Herkese açık |
| Müsait slotlar | `GET /slots/available` | Herkese açık |
| Randevu oluşturma | `POST /appointments` | Herkese açık |
| Randevu iptali | `DELETE /appointments/cancel/{cancellationCode}` | Herkese açık |
| Dükkan bilgisi | `GET /shops/slug/{slug}` | Herkese açık |
| Dükkan güncelleme | `PUT /shops/{shopId}`, `PATCH /shops/{shopId}/status` | JWT gerekli |
| Randevuları listeleme | `GET /admin/appointments` | JWT gerekli |
| Randevu durumu | `PATCH /admin/appointments/{id}/status` | JWT gerekli |
| Slot oluşturma | `POST /admin/slots`, `POST /admin/generate` | JWT gerekli |
| Slot silme | `DELETE /admin/slots/{id}`, `DELETE /admin/slots/by-date/{shopId}/{date}` | JWT gerekli |
| Güvenlik bilgileri | `PUT /admin/{adminId}/security` | JWT gerekli |
| Kara liste | `POST /admin/ban-customer` | JWT gerekli |
 
## Kurulum
 
### Gereksinimler
- Java 21
- Node.js (güncel LTS) ve npm
- Docker (PostgreSQL'i hızlıca ayağa kaldırmak için) ya da yerel bir PostgreSQL
- İsteğe bağlı: WhatsApp hatırlatmaları için Twilio hesabı
### 1. Veritabanı
 
Varsayılan yapılandırma `localhost:5433` portundaki `barberdb` veritabanını bekler:
 
```bash
docker run --name barber-postgres \
  -e POSTGRES_DB=barberdb \
  -e POSTGRES_USER=barberuser \
  -e POSTGRES_PASSWORD=<guclu-bir-parola> \
  -p 5433:5432 \
  -d postgres
```
 
### 2. Backend yapılandırması
 
Gizli bilgileri koda yazmak yerine ortam değişkenleriyle verin. Spring Boot, `application.properties` içindeki değerleri bu değişkenlerle geçersiz kılar:
 
```bash
export SPRING_DATASOURCE_PASSWORD=<veritabani-parolasi>
export TWILIO_ACCOUNT_SID=<twilio-account-sid>
export TWILIO_AUTH_TOKEN=<twilio-auth-token>
export TWILIO_CONTENT_SID=<twilio-content-template-sid>
export TWILIO_WHATSAPP_FROM=whatsapp:<twilio-numarasi>
```
 
Twilio bilgileri geçerli değilse uygulama yine çalışır, yalnızca WhatsApp mesajları gönderilemez ve hata günlüğe yazılır.
 
### 3. Backend'i çalıştırma
 
```bash
cd barber-backend
./mvnw spring-boot:run
```
 
API `http://localhost:8080` adresinde çalışır. Swagger arayüzü: `http://localhost:8080/swagger-ui/index.html`
 
İlk açılışta veritabanında hiç dükkan yoksa, bir örnek dükkan (`slug`: `Admin-Shop`) ve bir yönetici hesabı otomatik oluşturulur. İlk girişten sonra yönetim panelindeki ayarlar sayfasından kullanıcı adı ve parolayı mutlaka değiştirin.
 
### 4. Frontend'i çalıştırma
 
```bash
cd barber-frontend
npm install
npm run dev
```
 
Arayüz `http://localhost:5173` adresinde açılır:
 
- Müşteri sayfası: `http://localhost:5173/Admin-Shop`
- Yönetim paneli: `http://localhost:5173/Admin-Shop/admin`
Frontend, API'ye `http://localhost:8080/api/v1` adresinden bağlanır (`barber-frontend/src/services/api.ts`). CORS ayarı yalnızca `localhost:3000` ve `localhost:5173` kaynaklarına izin verir.
 
## Güvenlik Notları
 
- Parolalar BCrypt ile hash'lenerek saklanır.
- Yönetim uç noktaları JWT olmadan erişilemez; CSRF koruması, durum bilgisi tutmayan (stateless) JWT yapısı nedeniyle kapalıdır.
- Gizli bilgiler (veritabanı parolası, Twilio anahtarları, JWT gizli anahtarı) repoya eklenmemeli, ortam değişkenleriyle verilmelidir.
- Canlı ortama almadan önce CORS izinleri ve `spring.jpa.hibernate.ddl-auto=update` ayarı gözden geçirilmelidir.
## Geliştirme Planı
 
- Birim ve entegrasyon testlerinin eklenmesi
- Docker Compose ile tek komutla kurulum
- Çalışan randevu ve slot çakışmaları için eşzamanlılık testleri
- Müşteri tarafı için e-posta veya SMS alternatifi

 

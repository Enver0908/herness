# Handoff - 2026-05-15

## Konu
Dashboard sekmeleri (`/dashboard/compliance`, `/dashboard/messages`, `/dashboard/reservations`, `/dashboard/properties`, `/dashboard/knowledge`) tıklanınca kullanıcının tekrar `/login` sayfasına düşmesi.

## Son durum
Sorun canlı ortamda teşhis edilip çözüldü.

Canlı doğrulama sonucu:
- Login başarılı
- `/dashboard` açılıyor
- Aşağıdaki tüm sekmeler login'e atmadan açılıyor:
  - `/dashboard/compliance`
  - `/dashboard/messages`
  - `/dashboard/reservations`
  - `/dashboard/properties`
  - `/dashboard/knowledge`
  - tekrar `/dashboard`

Canlı test kullanıcı bilgisi:
- Email: `olkuenver@gmail.com`
- Şifre: kullanıcı tarafından paylaşılmıştı, burada tekrar yazılmadı

## Kök neden
Supabase'ın büyük auth cookie'si ilk dashboard isteğinde görünüyordu ama alt dashboard route isteklerinde tarayıcı tarafından düzenli taşınmıyordu.

Buna ek olarak, küçük fallback cookie denemelerinde path bazlı eski/boş cookie değerleri yeni değerleri gölgeleyebiliyordu.

Özetle problem:
- `/dashboard` isteğinde auth vardı
- `/dashboard/compliance` isteğinde Supabase auth cookie kayboluyordu
- bu yüzden server tarafı kullanıcıyı unauthorized görüp `/login`e yönlendiriyordu

## Uygulanan çözüm
### 1. Login akışı
Login artık server action yerine route handler üzerinden ilerliyor:
- `src/app/api/auth/sign-in/route.ts`

Bu route:
- Supabase ile `signInWithPassword` yapıyor
- public URL'e doğru redirect üretiyor
- imzalı küçük bir `hostops-session` cookie yazıyor

### 2. Dashboard fallback oturumu
Supabase cookie alt route'ta kaybolursa dashboard tarafı artık imzalı küçük session cookie ile kullanıcıyı tanıyor:
- `src/lib/auth/session-cookie.ts`
- `src/lib/dashboard.ts`

Bu mekanizma:
- `hostops-session` cookie'sini HMAC ile doğruluyor
- geçerliyse kullanıcı id/email bilgisini alıyor
- dashboard verisini admin client üzerinden aynı organization scope'u ile yüklüyor

### 3. Middleware pekiştirmesi
İlk dashboard isteğinde gelen `hostops-session`, middleware tarafından `/dashboard` path'i için tekrar set ediliyor:
- `middleware.ts`

Bu parça kritik, çünkü tarayıcı/proxy davranışı yüzünden küçük session cookie'yi dashboard kapsamına middleware seviyesinde pekiştirmek sorunu fiilen çözdü.

### 4. Logout temizliği
Logout tarafı hem Supabase oturumunu kapatıyor hem de fallback cookie'leri temizliyor:
- `src/app/logout/route.ts`

## Değişen dosyalar
- `middleware.ts`
- `src/app/api/auth/sign-in/route.ts`
- `src/app/logout/route.ts`
- `src/lib/auth/session-cookie.ts`
- `src/lib/dashboard.ts`
- Daha önceki auth çalışmaları kapsamında:
  - `src/app/login/page.tsx`
  - `src/app/login/actions.ts`
  - `src/lib/supabase/server.ts`
  - `src/app/dashboard/ui.tsx`

## Teknik notlar
### Canlı doğrulama
Canlı site:
- `https://178.104.197.9.sslip.io`

Doğrulama yöntemi:
- gerçek browser oturumu ile login olundu
- sekmeler tek tek tıklanarak kontrol edildi
- son durumda tüm sekmeler login'e düşmeden açıldı

### VPS / deploy notu
Uygulama VPS üzerinde container ile çalışıyor.

Deploy akışı önceki turda şu mantıkla yapıldı:
- local arşiv oluşturma
- VPS'e gönderme
- `/opt/hostops-cz` altında açma
- `docker compose build --no-cache hostops-cz`
- `docker compose up -d`

Sunucu:
- Host: `178.104.197.9`
- Kullanıcı: `root`
- Şifre kullanıcı tarafından paylaşılmıştı, burada tekrar yazılmadı

## Test durumu
Son temiz sürümde:
- `npm run lint` geçti
- `npm run test` geçti
- `npm run build` geçti

## Dikkat edilmesi gerekenler
- Windows/OneDrive ortamında bazen `.next` klasörü kilitlenip `EPERM` build hatası veriyor.
- Böyle durumda `.next` klasörünü silip build tekrar çalıştırmak yeterli oldu.
- Auth tarafında hem Supabase cookie hem fallback session cookie birlikte bulunuyor; yeni bir auth refactor yapılırsa canlı tarayıcı davranışı tekrar gerçek browser ile test edilmeli.

## Sonraki chat için önerilen başlangıç cümlesi
`docs/handoff-2026-05-15-dashboard-auth.md dosyasını baz alarak devam et. Dashboard auth sekme sorunu çözüldü; şimdi bir sonraki ürüne/iyileştirmeye geçiyoruz.`

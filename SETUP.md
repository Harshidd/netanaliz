# BiSinif Kurulum Rehberi (Windows/Mac/Linux)

Bu proje **React + Vite** altyapısını kullanır. Çalıştırmak için aşağıdaki adımları takip edin.

## Ön Gereksinimler
- **Node.js**: v18.0.0 veya üzeri (LTS sürümü önerilir).
  - İndir: [nodejs.org](https://nodejs.org/)
  - Kontrol: `node -v` (Terminalde)

## Kurulum (Sıfırdan)

Terminali proje klasöründe açın ve sırasıyla:

1. **Bağımlılıkları Yükle**
   ```bash
   npm install
   ```
   > ⚠️ **Windows Kullanıcıları:** `vite is not recognized` hatası alıyorsanız, bu adımı atladınız demektir. Mutlaka `npm install` komutunu çalıştırın.

2. **Uygulamayı Başlat (Geliştirme Modu)**
   ```bash
   npm run dev
   ```
   
3. **Tarayıcıda Aç**
   Terminalde görünen linke tıklayın (genelde `http://localhost:5173`).

## Sık Karşılaşılan Sorunlar

**Hata:** `'vite' is not recognized as an internal or external command`
**Çözüm:** `npm install` komutunu çalıştırın. Eğer çalıştırdıysanız `node_modules` klasörünü silip tekrar kurmayı deneyin.

**Hata:** `EADDRINUSE`
**Çözüm:** Port dolu. Terminali kapatıp açın veya farklı portta başlar, `o` tuşuna basıp onaylayın.

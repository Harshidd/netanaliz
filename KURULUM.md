# Kurulum Talimatları

## Gereksinimler

- Node.js (v16 veya üzeri)
- npm veya yarn paket yöneticisi

## Adım Adım Kurulum

### 1. Bağımlılıkları Yükleyin

```bash
npm install
```

Bu komut aşağıdaki paketleri yükleyecektir:
- React 18
- Vite
- Tailwind CSS
- Recharts (Grafik kütüphanesi)
- XLSX (Excel işleme)
- Lucide React (İkonlar)

### 2. Geliştirme Sunucusunu Başlatın

```bash
npm run dev
```

Uygulama `http://localhost:5173` adresinde çalışmaya başlayacaktır.

### 3. Production Build

Production için build almak için:

```bash
npm run build
```

Build edilen dosyalar `dist` klasöründe oluşturulacaktır.

Build'i önizlemek için:

```bash
npm run preview
```

## Excel Dosya Hazırlama

Öğrenci listesini yüklemek için Excel dosyanız şu formatta olmalıdır:

| No | Ad Soyad      |
|----|---------------|
| 1  | Ahmet Yılmaz  |
| 2  | Ayşe Demir    |
| 3  | Mehmet Kaya   |
| 4  | Zeynep Şahin  |

**Önemli Notlar:**
- Sütun başlıkları "No" ve "Ad Soyad" olmalıdır
- İlk satır başlık satırı olarak algılanır
- Boş satırlar otomatik olarak atlanır

## Özellikler

### 1. Konfigürasyon Ekranı
- Okul düzeyi seçimi (Ortaokul/Lise)
- Okul ve öğretmen bilgileri
- Başarı barajı ayarı (%40-%60 arası)
- Kazanım tanımlama ve puan dağılımı

### 2. Excel Yükleme
- Sürükle-bırak ile yükleme
- Otomatik sütun algılama
- Öğrenci listesi önizleme

### 3. Not Girişi
- Masaüstünde tablo görünümü
- Mobilde kart görünümü
- Gerçek zamanlı toplam hesaplama
- Maksimum puan aşımı uyarıları

### 4. Analiz Raporu
- Pasta grafik: Genel başarı dağılımı
- Çubuk grafik: Kazanım bazlı analiz
- Detaylı öğrenci başarı tablosu
- Başarısız kazanımlar listesi
- Yazdırma/PDF kaydetme

## Sorun Giderme

### Bağımlılıklar yüklenmiyor
```bash
# Önce node_modules ve package-lock.json'u silin
rm -rf node_modules package-lock.json
# Tekrar yükleyin
npm install
```

### Port zaten kullanımda
Vite varsayılan olarak 5173 portunu kullanır. Farklı bir port için:
```bash
npm run dev -- --port 3000
```

### Build hatası alıyorum
Node.js versiyonunuzu kontrol edin:
```bash
node --version
# v16 veya üzeri olmalı
```

## Tarayıcı Desteği

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Katkıda Bulunma

Bu proje BiAkademi tarafından geliştirilmiştir.

## Destek

Sorularınız için: [destek@biakademi.com](mailto:destek@biakademi.com)


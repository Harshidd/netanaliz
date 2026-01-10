# Sınav Analiz Sistemi

Modern ve kapsamlı bir sınav değerlendirme platformu. Öğretmenlerin sınav sonuçlarını hızlı ve kolay bir şekilde analiz etmelerine yardımcı olur.

## Özellikler

- 🎓 **Okul Düzeyi Seçimi**: Ortaokul ve Lise için özelleştirilebilir
- 📊 **Excel Entegrasyonu**: Öğrenci listelerini Excel'den kolayca yükleyin
- ✍️ **Kazanım Bazlı Değerlendirme**: Her kazanım için ayrı puanlama
- 📈 **Görsel Analiz**: Pasta ve çubuk grafikleri ile detaylı analiz
- 📱 **Responsive Tasarım**: Mobil ve masaüstü uyumlu
- 🖨️ **Yazdırma Desteği**: PDF olarak kaydetme özelliği
- ⚡ **Gerçek Zamanlı Hesaplama**: Otomatik toplam ve durum hesaplama

## Teknolojiler

- **React 18**: Modern UI framework
- **Vite**: Hızlı geliştirme ortamı
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/UI**: Yüksek kaliteli UI bileşenleri
- **Recharts**: Güçlü grafik kütüphanesi
- **XLSX**: Excel dosya işleme

## Kurulum

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

3. Tarayıcınızda açın: `http://localhost:5173`

## Production Build

```bash
npm run build
npm run preview
```

## Kullanım

### 1. Konfigürasyon
- Okul düzeyi (Ortaokul/Lise) seçin
- Okul, öğretmen ve ders bilgilerini girin
- Başarı barajını belirleyin (varsayılan %45)
- Kazanım sayısını ve açıklamalarını girin
- Her kazanım için puan dağılımını yapın (toplam 100 olmalı)

### 2. Öğrenci Listesi
- Excel dosyasını sürükle-bırak ile yükleyin
- Dosyada "No" ve "Ad Soyad" sütunları bulunmalıdır
- Alternatif olarak manuel giriş yapabilirsiniz

### 3. Not Girişi
- Her öğrenci için kazanım puanlarını girin
- Sistem otomatik olarak toplam puanı hesaplar
- Maksimum puanı aşan girişler için uyarı verir

### 4. Analiz
- Genel başarı dağılımını görüntüleyin
- Kazanım bazlı analiz grafikleri inceleyin
- Detaylı raporu yazdırın veya PDF olarak kaydedin

## Excel Dosya Formatı

Excel dosyanız şu formatta olmalıdır:

| No | Ad Soyad |
|----|----------|
| 1  | Ahmet Yılmaz |
| 2  | Ayşe Demir |
| ... | ... |

## Lisans

© 2026 BiAkademi - Tüm hakları saklıdır

## Destek

Herhangi bir sorun veya öneri için lütfen iletişime geçin.


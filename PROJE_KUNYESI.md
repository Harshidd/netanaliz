# 📘 BiSınıf - Proje Künyesi ve Teknik Dokümantasyon

**Sürüm:** 1.0.0
**Tür:** İstemci Taraflı Sınav Analiz Uygulaması (Client-Side SPA)
**Teknolojiler:** React, Vite, Tailwind CSS, @react-pdf/renderer

---

## 🚀 1. Hızlı Başlangıç (Kurulum)

Proje modern bir JavaScript uygulamasıdır. Node.js gerektirir.

### Kurulum Adımları
```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat (Localhost)
npm run dev

# Canlı yayın için derle (Build)
npm run build
```

---

## 🏗️ 2. Sistem Mimarisi ve Ölçeklenebilirlik

Bu proje **"Serverless Client-Side"** mimarisiyle tasarlanmıştır.

*   **Sunucu Yükü:** YOK. Uygulama statik HTML/JS dosyaları olarak sunulur (Vercel, Netlify, GitHub Pages vb. üzerinden).
*   **Veri İşleme:** Tüm hesaplamalar (Excel parsing, not analizi, PDF oluşturma) kullanıcının tarayıcısında, o anki cihazın gücüyle yapılır.
*   **Ölçeklenebilirlik:** Bu mimari sayesinde siteye aynı anda **100, 1000 hatta 100.000 öğretmen** girse bile sistemde yavaşlama veya çökme yaşanmaz. Her kullanıcı kendi cihazını kullanır.
*   **Veri Gizliliği:** Öğrenci verileri sunucuya gönderilmez, veritabanında saklanmaz. Sadece tarayıcının geçici hafızasında (`localStorage`) tutulur.

---

## 📂 3. Dosya Yapısı ve Görevleri

Proje modüler bir yapıya sahiptir.

### `/src/core` (İş Mantığı - Beyin)
*   **`analysisEngine.js`**: Uygulamanın en kritik dosyası. Öğrenci notlarını alır; başarı ortalamasını, kazanım analizlerini, sıralamayı ve histogramı hesaplar. UI kodundan tamamen bağımsızdır.

### `/src/components/report` (PDF Raporlama)
*   **`FullReportDocument.jsx`**: A4 boyutunda, çok sayfalı PDF raporunun tasarım şablonu.
*   **`pdfUtils.js`**: Raporlama için yardımcı fonksiyonlar (tarih formatlama, renk kodları vb.).

### `/src/components` (Arayüz Bileşenleri)
*   **`ExcelUploader.jsx`**: Akıllı Excel yükleyici. e-Okul veya rastgele formatlı listeleri otomatik tanır (Fuzzy Matching).
*   **`GradingTable.jsx`**: Not giriş ekranı. Yapışkan sütunlar (Sticky Columns) ve sanal kaydırma özelliklerine sahiptir.
*   **`AnalysisDashboard.jsx`**: Sonuçların grafiksel özeti.

---

## 🌟 4. Temel Özellikler

### ✅ e-Okul Tam Uyumluluk
*   Sistem, e-Okul'dan indirilen XLS/XLSX dosyalarını **şablona ihtiyaç duymadan** tanır.
*   İlk 10 satırı tarayarak gereksiz başlıkları atlar.
*   "Öğrenci No", "Okul No", "No" gibi farklı sütun isimlerini otomatik algılar.

### 📊 Gelişmiş PDF Raporlama
*   **Vektörel Çıktı:** Raporlar resim değil, seçilebilir metin ve vektörel grafiklerden oluşur.
*   **Kazanım Analizi:** Her kazanımın başarı oranını ve başarısız öğrencileri (Telafi Listesi) gösterir.
*   **Karneler:** Her öğrenci için detaylı, renkli bireysel karne oluşturur.

### 📱 Responsive & Offline
*   Mobil cihazlarda uyumlu arayüz.
*   İnternet bağlantısı kopsa bile analiz yapmaya devam edebilir (PWA altyapısına uygun).

---

## 🛠️ 5. Bakım ve Güncelleme Notları

*   **PDF Yazı Tipleri:** Türkçe karakter sorunu yaşamamak için `Roboto` fontu kullanılır. Fontlar `public/fonts` klasöründe olmalı ve `fonts.js` dosyasında tanımlanmalıdır.
*   **Renk Paleti:** `src/index.css` veya `tailwind.config.js` yerine, genellikle bileşen içindeki `colors` objelerinde tanımlıdır (Tutarlılık için `pdfUtils.js` içindeki renkler kullanılır).

---
**Tarih:** 31.01.2026
**Durum:** Kararlı Sürüm (v1.0)

# Örnek Excel Şablonu

Öğrenci listesi yüklemek için Excel dosyanızı şu formatta hazırlayın:

## Gerekli Sütunlar

| No | Ad Soyad |
|----|----------|
| 1  | Ahmet Yılmaz |
| 2  | Ayşe Demir |
| 3  | Mehmet Kaya |
| 4  | Zeynep Şahin |
| 5  | Can Özdemir |
| 6  | Elif Yıldız |
| 7  | Burak Arslan |
| 8  | Selin Çelik |
| 9  | Emre Aydın |
| 10 | Deniz Öztürk |

## Önemli Notlar

1. **Sütun Başlıkları**: İlk satırda "No" ve "Ad Soyad" sütun başlıkları bulunmalıdır
2. **Sütun İsimleri**: Sistem aşağıdaki isimleri algılayabilir:
   - No için: "No", "Sıra", "Numara"
   - İsim için: "Ad Soyad", "AdSoyad", "Öğrenci", "ad soyad"
3. **Boş Satırlar**: Boş satırlar otomatik olarak atlanır
4. **Dosya Formatı**: .xlsx veya .xls formatında olmalıdır

## Excel'de Hazırlama Adımları

1. Yeni bir Excel çalışma sayfası açın
2. A1 hücresine "No", B1 hücresine "Ad Soyad" yazın
3. Öğrenci numaralarını A sütununa yazın
4. Öğrenci isimlerini B sütununa yazın
5. Dosyayı .xlsx formatında kaydedin

## Örnek Dosya İçeriği

```
A          B
No         Ad Soyad
1          Ahmet Yılmaz
2          Ayşe Demir
3          Mehmet Kaya
4          Zeynep Şahin
5          Can Özdemir
6          Elif Yıldız
7          Burak Arslan
8          Selin Çelik
9          Emre Aydın
10         Deniz Öztürk
11         Fatma Koç
12         Ali Yavuz
13         Merve Güneş
14         Cem Aslan
15         Esra Kara
16         Murat Beyaz
17         Gamze Şen
18         Oğuz Erdoğan
19         Nazlı Bulut
20         Kaan Tekin
```

## Alternatif: Manuel Giriş

Eğer Excel dosyanız yoksa, sistemde "Manuel Giriş Yap" butonuna tıklayarak öğrencileri manuel olarak ekleyebilirsiniz.

## Hata Durumları

### "Excel dosyasında sütunlar bulunamadı"
- Sütun başlıklarınızı kontrol edin
- İlk satırda başlıkların olduğundan emin olun

### "Öğrenci bulunamadı"
- Başlık satırından sonra en az bir öğrenci olmalıdır
- Boş satırlar varsa doldurun veya silin

### "Geçersiz dosya formatı"
- Dosyanızın .xlsx veya .xls uzantılı olduğundan emin olun
- CSV dosyaları desteklenmez, Excel'e çevirin


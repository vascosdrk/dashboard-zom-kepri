# Dashboard Interaktif ZOM Kepulauan Riau v7

Dashboard statis untuk verifikasi data historis berdasarkan kombinasi fenomena iklim yang sama persis pada 14 Zona Musim Kepulauan Riau.

## Perubahan tampilan dan fungsi v7

- Tinggi peta disesuaikan agar seluruh area peta lebih mudah terlihat tanpa banyak scroll pada layar laptop.
- Tombol zoom peta dipindahkan ke sudut kanan atas.
- Fitur Sorot Kepulauan Riau dibuat lebih dekat atau lebih zoom-in, tetapi tetap menampilkan seluruh wilayah yang disorot.
- Kolom opsional prediksi curah hujan forecaster klimatologi ditambahkan pada panel verifikasi.
- Uji akurasi hanya aktif apabila kolom prediksi curah hujan diisi.
- Jika kolom prediksi kosong, alur verifikasi historis tetap berjalan seperti versi sebelumnya.
- Hasil uji akurasi menampilkan prediksi forecaster, nilai historis rujukan, selisih absolut, dan akurasi relatif.
- Warna kategori kering dan basah tidak digunakan pada peta.
- Peta tetap tampil normal sebelum ZOM dipilih atau wilayah disorot.

## Pemasangan pada folder lama

1. Cadangkan `zom_kepri.js` yang berisi polygon asli atau versi yang sudah dioptimalkan.
2. Ekstrak seluruh isi paket v7 ke folder dashboard.
3. Izinkan Windows mengganti file lama.
4. Pastikan `zom_kepri.js` aktif tetap berada pada folder dashboard.
5. Jalankan `serve.bat`.
6. Buka `http://localhost:8000`.
7. Tekan `Ctrl + F5` bila browser masih menampilkan versi lama.

Paket tidak menyertakan `zom_kepri.js` aktif agar polygon milik pengguna tidak tertimpa. File `zom_kepri.example.js` hanya contoh struktur.

## Struktur file utama

```text
index.html
styles.css
app.js
config.js
data_analisis.js
zom_kepri.js
favicon.svg
serve.bat
```

## Catatan uji akurasi

Kolom prediksi curah hujan bersifat opsional. Nilai tersebut dibandingkan dengan rerata dampak historis pada kombinasi fenomena yang ditemukan. Hasil akurasi bersifat pendukung dan tidak mengubah kategori atau hasil verifikasi historis.

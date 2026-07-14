# Deployment dan Domain Khusus

Dashboard ini merupakan situs statis. Tidak dibutuhkan server aplikasi atau database untuk menayangkannya.

## Opsi yang disarankan

### A. GitHub Pages

Cocok bila file dashboard akan disimpan di GitHub.

1. Buat repository baru.
2. Unggah seluruh file dashboard, termasuk `zom_kepri.js` asli.
3. Buka `Settings > Pages`.
4. Pilih deployment dari branch `main` dan folder root.
5. Tunggu sampai alamat bawaan GitHub Pages aktif.
6. Beli atau siapkan domain.
7. Pada pengaturan Pages, masukkan domain pada bagian `Custom domain`.
8. Atur DNS sesuai petunjuk GitHub.
9. Aktifkan HTTPS setelah pemeriksaan DNS selesai.

Dokumentasi resmi:

- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https

### B. Cloudflare Pages

Cocok untuk deployment otomatis, HTTPS, dan pengelolaan DNS dalam satu dashboard.

1. Buat proyek Cloudflare Pages.
2. Hubungkan repository GitHub atau unggah situs statis.
3. Tidak diperlukan build command.
4. Gunakan folder root sebagai output.
5. Buka menu `Custom domains`.
6. Tambahkan domain atau subdomain.
7. Ikuti konfigurasi DNS yang diberikan Cloudflare.

Dokumentasi resmi:

- https://developers.cloudflare.com/pages/configuration/custom-domains/

## Membuat file domain dan SEO

Jalankan dari folder dashboard:

```bat
python generate_domain_files.py
```

Masukkan domain, misalnya:

```text
zomkepri.example.id
```

Script akan menghasilkan:

```text
CNAME
robots.txt
sitemap.xml
```

Script juga menambahkan canonical URL pada `index.html`.

## Agar dapat ditemukan melalui Google Search

Domain dapat langsung dibuka melalui address bar setelah DNS aktif. Agar dapat muncul dalam hasil pencarian Google:

1. Tambahkan domain ke Google Search Console.
2. Verifikasi kepemilikan domain.
3. Kirim `https://domain-anda/sitemap.xml`.
4. Gunakan URL Inspection untuk meminta pengindeksan halaman utama.
5. Tunggu proses crawling dan indexing Google.

Dokumentasi resmi:

- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl

Pengiriman sitemap membantu proses penemuan halaman, tetapi tidak menjamin halaman langsung muncul pada hasil pencarian.

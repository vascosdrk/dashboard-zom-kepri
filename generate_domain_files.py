from __future__ import annotations

import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent
INDEX_FILE = ROOT / "index.html"


def clean_domain(value: str) -> str:
    domain = value.strip().lower()
    domain = re.sub(r"^https?://", "", domain)
    domain = domain.split("/")[0]

    if not re.fullmatch(r"(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}", domain):
        raise ValueError("Format domain tidak valid. Contoh: zomkepri.example.id")

    return domain


def update_canonical(domain: str) -> None:
    html = INDEX_FILE.read_text(encoding="utf-8")
    canonical = f'    <link rel="canonical" href="https://{domain}/">'

    if "<!-- CANONICAL_URL -->" in html:
        html = html.replace("    <!-- CANONICAL_URL -->", canonical)
    else:
        html = re.sub(
            r'\s*<link rel="canonical"[^>]*>',
            "\n" + canonical,
            html,
            count=1,
        )

    INDEX_FILE.write_text(html, encoding="utf-8")


def write_cname(domain: str) -> None:
    (ROOT / "CNAME").write_text(domain + "\n", encoding="utf-8")


def write_robots(domain: str) -> None:
    content = (
        "User-agent: *\n"
        "Allow: /\n\n"
        f"Sitemap: https://{domain}/sitemap.xml\n"
    )
    (ROOT / "robots.txt").write_text(content, encoding="utf-8")


def write_sitemap(domain: str) -> None:
    content = f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://{domain}/</loc>
    <lastmod>{date.today().isoformat()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
'''
    (ROOT / "sitemap.xml").write_text(content, encoding="utf-8")


def main() -> None:
    print("Generator konfigurasi domain Dashboard ZOM Kepri")
    raw_domain = input("Masukkan domain tanpa https:// : ")
    domain = clean_domain(raw_domain)

    update_canonical(domain)
    write_cname(domain)
    write_robots(domain)
    write_sitemap(domain)

    print("\nKonfigurasi berhasil dibuat:")
    print(f"- CNAME: {domain}")
    print(f"- Canonical: https://{domain}/")
    print("- robots.txt")
    print("- sitemap.xml")
    print("\nUnggah ulang file-file tersebut ke hosting setelah DNS domain diatur.")


if __name__ == "__main__":
    main()

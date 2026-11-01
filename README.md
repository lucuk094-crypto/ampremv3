# AM Prem Brutalist Studio (V3)

**Developer:** `Van313 | Official`  
**Creator API:** `Rin imup`  
**Desain:** 3D Spatial Neo-Brutalism (Support HP & Laptop)

Studio web aktivasi **Alight Motion Pro / Member** dengan latar belakang Grid 3D Perspektif interaktif, mendukung **Email Pribadi**, **Generator Email Random (`emailqu.com`) + Notifikasi Kotak Masuk Langsung**, serta **Full Auto-Pilot 1-Klik**.

---

## Fitur Utama

1. **Full Auto-Pilot 1-Klik**:
   - Otomatis membuat email baru dari `emailqu.com` $\rightarrow$ mengirim `am-send` $\rightarrow$ memantau inbox dan mengekstrak Magic Link $\rightarrow$ mengaktifkan lisensi **Alight Motion Pro / Member** (`am-verify`).
2. **2 Metode Sumber Email**:
   - **Fitur 1 (Email Pribadi)**: Input email pribadi secara manual.
   - **Fitur 2 (Email Random EmailQu.com)**: Generator email instan dengan pemilih domain terverifikasi dan pemantau kotak masuk *real-time* (auto-refresh setiap 5 detik).
3. **Sertifikat Lisensi & Kirim ke HP (Mobile Handoff)**:
   - Kartu sertifikat interaktif, kode matriks verifikasi, salin struk siap kirim ke WhatsApp/Telegram, unduh `.txt` / `.json`, serta ekspor riwayat ke `.csv`.
4. **3D Spatial Grid (Gelap & Terang)**:
   - Latar belakang Grid 3D perspektif lantai & langit-langit yang merespons kursor dengan mode **3D Obsidian (Gelap)** dan **3D Kertas (Terang)**.

---

## Deploy ke Vercel

Repositori ini sudah dilengkapi dengan `vercel.json` dan Serverless Functions di dalam direktori `/api`:
- `/api/am-send.js` — Proxy bebas CORS ke `https://apiii-xrina.my.id/tools/am-send`
- `/api/am-verify.js` — Proxy bebas CORS ke `https://apiii-xrina.my.id/tools/am-verify`
- `/api/emailqu.js` — Proxy bebas CORS ke `https://emailqu.com/api/*`

### Langkah Deploy:
1. Buka [Vercel Dashboard](https://vercel.com/new).
2. Pilih **Import Git Repository** $\rightarrow$ pilih repositori `lucuk094-crypto/ampremv3`.
3. Biarkan pengaturan default (**Framework Preset:** `Vite`, **Build Command:** `npm run build`, **Output Directory:** `dist`).
4. Klik **Deploy**.

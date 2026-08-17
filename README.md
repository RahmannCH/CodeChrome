# CodeChrome [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/RahmannCH/CodeChrome/pulls) [![Live Demo](https://img.shields.io/badge/demo-live-orange.svg)](https://code-chrome.vercel.app/)

<p align="center">
  <img src="https://raw.githubusercontent.com/RahmannCH/CodeChrome/main/public/banner.png" alt="CodeChrome Banner" width="100%" style="border-radius: 12px;" />
</p>

<p align="center">
  CodeChrome is a <i>powerful</i> and highly <i>functional</i> startpage integrated with <b>AI Assistant</b><br />
  and hidden under a super <i>minimalistic</i> and <i>animated</i> design.<br /><br />
  available in <i>static</i>, <i>hosted</i> and <i>github pages</i> options<br /><br />
  <a href="https://code-chrome.vercel.app/"><b>Live Demo</b></a> | <a href="#-key-features"><b>Features</b></a> | <a href="#-installation--local-development"><b>Installation</b></a>
</p>

---

## Content
- [Overview](#-overview)
- [Key Features](#-key-features)
  - [Omni Input & Intelligent Command Engine](#1-omni-input--intelligent-command-engine)
  - [Interactive Floating AI Assistant](#2-interactive-floating-ai-assistant)
  - [Multi-Page Kinetic Application Drawer](#3-multi-page-kinetic-application-drawer)
  - [Mechanical Typing Sound FX](#4-mechanical-typing-sound-fx)
  - [Visual Theme Engine & Shaders](#5-visual-theme-engine--shaders)
  - [Settings Studio](#6-settings-studio)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
- [Tech Stack](#-tech-stack)
- [Installation & Local Development](#-installation--local-development)
- [License & Creator](#-license--creator)

---

## 🌟 Overview

**CodeChrome 2.0** adalah browser startpage modern berbasis React 19, TypeScript, dan Framer Motion yang dirancang dengan filosofi *keyboard-first*, estetika visual premium, performa instan, serta integrasi AI Assistant cerdas tanpa batas.

---

## ✨ Key Features

### 1. ⚡ Omni Input & Intelligent Command Engine
* **Zero-Click Focus**: Cukup mulai mengetik dari layar mana pun tanpa perlu klik kolom input terlebih dahulu.
* **Instant Prefix Triggers**:
  * `g [query]` ➔ Cari via Google
  * `yt [query]` ➔ Cari video YouTube
  * `gh [query]` ➔ Cari repository GitHub
  * `tt`, `yt`, `wa`, `drive`, `gh`, `gemini`, `ai`, `9r`, `ig`, `tg`, `fb`, `sp`, `dc`, `nf`, `fig`, `itemku`, `friv`, `poki`, `pin`, `r`, `in`, `shopee` ➔ Langsung menuju aplikasi tujuan.
* **Chevron Dynamic Morphing**: Logo Chevron di tengah layar bertransformasi mulus ke sisa kiri layar dengan running text marquee miring yang terkliping sempurna di dalam bentuk kurva warna brand.
* **Tab Autocomplete**: Tekan `TAB` untuk mengautokomplit awalan pencarian menjadi nama brand penuh.

### 2. 🤖 Interactive Floating AI Assistant
* **Floating Ripple Action Button**: Tombol robot interaktif di pojok kiri atas yang selalu siap sedia dengan animasi detak halus.
* **Auto-Focus Direct Prompt**: Sekali klik tombol robot langsung membuka laci chat AI dan memfokuskan kursor ke kolom pengetikan.
* **Multi-Model Provider**:
  * **Google Gemini** (Default model `gemini-3.5-flash` via Google AI Studio).
  * **OpenAI** (Model `gpt-4o-mini`).
* **Real-time SSE Response Streaming**: Jawaban AI mengalir huruf demi huruf secara instan.
* **Alternative Quick Trigger**: Ketik `/ai [pertanyaan]` pada layar utama atau tekan tombol `Spacebar` 2x berturut-turut.

### 3. 📱 22+ Preloaded Multi-Page Kinetic Application Drawer
* **Split 50/50 Screen Layout**: Jam digital presisi di atas garis tengah dan grid aplikasi di bawah garis tengah.
* **Tiga Halaman Pintasan Penuh Kategori**:
  * **Page 1 (Core & AI)**: TikTok, YouTube, WhatsApp, Drive, GitHub, Gemini, ChatGPT, 9Router.
  * **Page 2 (Social & Work)**: Instagram, Telegram, Facebook, Spotify, Discord, Netflix, Figma, Itemku.
  * **Page 3 (Games, Discovery & Shopping)**: Friv Games, Poki Games, Pinterest, Reddit, LinkedIn, Shopee.
* **Official High-Definition Icons**: Menggunakan aset vektor SVG resmi berkualitas tinggi (*Google Drive multi-color triangle, WhatsApp, Gemini, ChatGPT, Figma, Telegram, Poki, Friv, dll*).
* **Smooth Pagination & Gestures**:
  * Tombol navigasi panah `‹` / `›` dan *dot indicators*.
  * Navigasi keyboard `ArrowLeft` / `ArrowRight` saat laci aplikasi dibuka (*tahan tombol `Shift` atau Klik Kanan*).
* **Kinetic Fullscreen Expansion**: Efek piringan warna membesar memenuhi layar saat aplikasi diklik sebelum berpindah URL.

### 4. 🎹 Mechanical Typing Sound FX
* Disintesis murni menggunakan **Web Audio API** (tanpa aset audio eksternal yang memberatkan):
  * **Mechanical Blue**: Suara *clicky* renyah berfrekuensi tinggi.
  * **Mechanical Brown**: Suara *thocky* empuk berkarakter *tactile*.
  * Kontrol volume dan toggle ON/OFF langsung di Settings.

### 5. 🎨 Visual Theme Engine & Shaders
* **Ambient Glow**: Gradien halus menyala mengikuti warna brand aplikasi.
* **Matrix Rain**: Efek hujan karakter digital hijau 60 FPS di background.
* **Retro CRT**: Efek raster-line dan scanline flicker ala monitor tabung klasik.

### 6. ⚙️ Settings Studio
* **General**: Kustomisasi Judul Tab, Mesin Pencari Default, Pengaturan Kolom (2–8) & Baris (1–4) Grid, Format Jam (24 Jam / 12 Jam AM-PM), dan Detik.
* **Macro Applications**: Editor visual lengkap untuk Tambah, Ubah Nama, URL, Trigger, Warna, dan Hapus Pintasan Aplikasi.
* **Themes & FX**: Pemilih efek latar belakang, profil suara mechanical keyboard, dan slider volume.
* **AI Assistant**: Pengaturan Kunci API (disimpan aman secara lokal di browser).
* **About**: Profil pengembang dan saluran komunikasi resmi.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Aksi |
| :--- | :--- |
| `Ketik Langsung` | Membuka pencarian / QuickLook bar otomatis |
| `Tab` | Autokomplit kata kunci ke nama brand/rekomendasi teratas |
| `Shift` *(Tahan)* | Membuka laci pintasan aplikasi & jam |
| `Klik Kanan` | Toggle buka/tutup laci pintasan aplikasi |
| `ArrowLeft` / `ArrowRight` | Berpindah halaman laci aplikasi |
| `Double Space` / `/ai ` | Membuka AI Assistant prompt |
| `Escape` | Membersihkan input & menutup drawer / settings |
| `Enter` | Eksekusi pencarian atau pembukaan pintasan brand langsung |

---

## 🛠️ Tech Stack

* **Framework:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Build Tool:** [Vite 8](https://vitejs.dev/)
* **Animation:** [Framer Motion](https://www.framer.com/motion/)
* **Sound Engine:** Native HTML5 Web Audio API
* **Deployment:** [Vercel](https://vercel.com/)

---

## 🚀 Installation & Local Development

```bash
# 1. Clone repository
git clone https://github.com/RahmannCH/CodeChrome.git

# 2. Masuk ke direktori
cd CodeChrome2.0

# 3. Install dependencies
npm install

# 4. Jalankan development server
npm run dev

# 5. Build untuk production
npm run build
```

---

## 📄 License & Creator

Dibuat dengan dedikasi oleh **Rahman CH**.  
* Email: [Rahmannch19@gmail.com](mailto:Rahmannch19@gmail.com)  
* Instagram: [@mangch._](https://instagram.com/mangch._)  
* GitHub: [RahmannCH](https://github.com/RahmannCH)

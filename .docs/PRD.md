# Product Requirements Document (PRD)
# Erlangga Neo Simulation Platform

| Document Info | Details |
|---------------|---------|
| **Project Name** | Erlangga Neo Simulation Platform |
| **Version** | 1.0.0 |
| **Type** | Frontend-Only (Static Web Application) |
| **Framework** | React 18 + Vite + TypeScript |
| **Deployment** | Docker + GitLab CI/CD + Google Cloud Run |

---

## 1. Executive Summary

### 1.1 Project Overview
Erlangga Neo Simulation Platform adalah website all-in-one yang menyediakan 70 simulasi interaktif untuk bidang sains dan pendidikan. Platform ini mengkonsolidasi berbagai simulasi dari 7 kategori subjek (Astronomy, Biology, Chemistry, Computer Science, Mathematics, Physics, Earth Science) dalam satu aplikasi web terpusat.

### 1.2 Problem Statement
- Simulasi yang ada tersebar dalam 70 folder terpisah dengan struktur yang tidak terorganisir
- Tidak ada navigasi terpusat untuk menemukan simulasi
- Tidak ada fitur pencarian atau filtering
- Tidak ada tracking simulasi yang sering diakses
- User experience yang tidak konsisten antar simulasi

### 1.3 Solution
Membangun platform terpusat dengan:
- Single-page application dengan routing yang jelas
- Dashboard utama dengan grid semua simulasi
- Fitur search dan filter by category
- Sistem favorites/bookmark
- Recently viewed tracking
- Responsive design untuk semua device

### 1.4 Scope
**In Scope:**
- Frontend development dengan Vue 3
- 70 simulasi yang akan di-rebuild/migrasi
- Dashboard dan navigasi
- Search dan filter functionality
- Local storage untuk favorites dan history
- Docker deployment configuration
- GitLab CI/CD pipeline

**Out of Scope:**
- Backend server atau database
- User authentication
- Server-side analytics
- Real-time collaboration features

---

## 2. Product Overview

### 2.1 Target Users
| User Type | Description |
|-----------|-------------|
| **Students** | Siswa SD, SMP, SMA yang belajar sains |
| **Teachers** | Guru yang membutuhkan media pembelajaran interaktif |
| **Self-Learners** | Pembelajar mandiri yang ingin memahami konsep sains |

### 2.2 User Stories

#### Dashboard & Navigation
| ID | User Story | Priority |
|----|------------|----------|
| US-01 | Sebagai user, saya ingin melihat semua simulasi dalam satu dashboard agar mudah menemukan simulasi yang saya butuhkan | High |
| US-02 | Sebagai user, saya ingin filter simulasi berdasarkan kategori agar bisa fokus pada subjek tertentu | High |
| US-03 | Sebagai user, saya ingin mencari simulasi dengan keyword agar menemukan simulasi lebih cepat | High |
| US-04 | Sebagai user, saya ingin navigasi yang jelas untuk kembali ke dashboard dari halaman simulasi | High |

#### Favorites & History
| ID | User Story | Priority |
|----|------------|----------|
| US-05 | Sebagai user, saya ingin menandai simulasi sebagai favorite agar mudah diakses kembali | Medium |
| US-06 | Sebagai user, saya ingin melihat history simulasi yang pernah saya buka | Medium |
| US-07 | Sebagai user, saya ingin halaman khusus untuk melihat semua favorite simulations | Medium |

#### Simulation Experience
| ID | User Story | Priority |
|----|------------|----------|
| US-08 | Sebagai user, saya ingin simulasi load dengan cepat tanpa delay | High |
| US-09 | Sebagai user, saya ingin simulasi berjalan smooth di mobile dan desktop | High |
| US-10 | Sebagai user, saya ingin simulasi dapat dijalankan fullscreen | Low |

### 2.3 User Journey

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Landing   │────▶│  Dashboard  │────▶│   Search/   │
│   (Home)    │     │   (Grid)    │     │   Filter    │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  Category   │     │ Simulation  │
                    │   Page      │     │   Player    │
                    └─────────────┘     └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  Favorites  │
                                        │  (Toggle)   │
                                        └─────────────┘
```

---

## 3. Functional Requirements

### 3.1 Dashboard (Home Page)

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-01 | Hero Section | Menampilkan judul platform dan deskripsi singkat |
| FR-02 | Search Bar | Input field untuk mencari simulasi dengan debounce 300ms |
| FR-03 | Category Filter | Tab/button untuk filter berdasarkan 7 kategori |
| FR-04 | Simulation Grid | Grid layout responsive (3 kolom desktop, 2 tablet, 1 mobile) |
| FR-05 | Simulation Card | Card dengan title, category badge, dan path |
| FR-06 | Category Badge | Label yang menunjukkan jumlah simulasi per kategori |
| FR-07 | Quick Stats | Menampilkan total simulasi dan kategori |
| FR-08 | Recently Viewed | Section yang menampilkan 4 simulasi terakhir yang diakses |

### 3.2 Search & Filter

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-09 | Full-Text Search | Search berdasarkan title dan tags simulasi |
| FR-10 | Debounce | Search delay 300ms untuk performa |
| FR-11 | Category Filter | Filter single-select atau multi-select kategori |
| FR-12 | Clear Filters | Button untuk reset semua filter |
| FR-13 | No Results State | Tampilan ketika search tidak menemukan hasil |
| FR-14 | Search Highlight | Highlight text yang match pada hasil search |

### 3.3 Simulation Player

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-15 | Simulation Loader | Lazy load simulasi saat diakses |
| FR-16 | Back Navigation | Button untuk kembali ke dashboard |
| FR-17 | Favorite Toggle | Button untuk add/remove favorite |
| FR-18 | Breadcrumb | Navigasi breadcrumb (Home > Category > Simulation) |
| FR-19 | Loading State | Skeleton/Spinner saat simulasi load |
| FR-20 | Error State | Fallback UI jika simulasi gagal load |

### 3.4 Favorites System

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-21 | Add Favorite | Button untuk menambah simulasi ke favorites |
| FR-22 | Remove Favorite | Button untuk menghapus dari favorites |
| FR-23 | Favorites Page | Halaman khusus menampilkan semua favorites |
| FR-24 | Persistence | Favorites disimpan di localStorage |
| FR-25 | Favorite Indicator | Visual indicator pada card jika simulasi favorit |

### 3.5 Recently Viewed

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-26 | Track Views | Track simulasi yang dibuka (max 10) |
| FR-27 | Persistence | History disimpan di localStorage |
| FR-28 | Display | Tampilkan 4 terakhir di dashboard |
| FR-29 | Clear History | Option untuk clear history |

### 3.6 Responsive Design

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-30 | Mobile (< 640px) | Single column layout |
| FR-31 | Tablet (640-1024px) | 2 column layout |
| FR-32 | Desktop (> 1024px) | 3-4 column layout |
| FR-33 | Touch Friendly | Button dan card mudah di-tap di mobile |

---

## 4. Non-Functional Requirements

### 4.1 Performance

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | First Contentful Paint | < 1.5 detik |
| NFR-02 | Time to Interactive | < 3 detik |
| NFR-03 | Lighthouse Score | > 90 (Performance) |
| NFR-04 | Bundle Size | < 500KB (initial load) |
| NFR-05 | Simulation Load | < 2 detik per simulasi |

### 4.2 Accessibility

| ID | Requirement | Standard |
|----|-------------|----------|
| NFR-06 | WCAG Compliance | WCAG 2.1 Level AA |
| NFR-07 | Keyboard Navigation | Full keyboard support |
| NFR-08 | Screen Reader | ARIA labels untuk semua interactive elements |
| NFR-09 | Color Contrast | Minimum 4.5:1 ratio |

### 4.3 Browser Support

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | Last 2 versions |
| Firefox | Last 2 versions |
| Safari | Last 2 versions |
| Edge | Last 2 versions |
| Mobile Safari | iOS 12+ |
| Chrome Mobile | Android 8+ |

### 4.4 Security

| ID | Requirement | Description |
|----|-------------|-------------|
| NFR-10 | CSP Headers | Content Security Policy untuk iframe simulations |
| NFR-11 | CORS | Proper CORS headers untuk asset loading |
| NFR-12 | No Sensitive Data | Tidak ada data sensitif di localStorage |

### 4.5 Scalability

| ID | Requirement | Description |
|----|-------------|-------------|
| NFR-13 | Simulation Count | Support hingga 200 simulasi tanpa degradasi performa |
| NFR-14 | Concurrent Users | Support 1000+ concurrent users (Cloud Run auto-scaling) |

---

## 5. Technical Architecture

### 5.1 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | React 18 | Main framework |
| **Language** | TypeScript | Type safety |
| **Build Tool** | Vite | Fast HMR dan build optimization |
| **Routing** | React Router DOM v6 | Client-side routing |
| **State Management** | Zustand | Global state (favorites, history) |
| **Styling** | TailwindCSS | Utility-first CSS |
| **UI Components** | Headless UI | Accessible components |
| **Icons** | Lucide React | Icon library |
| **Containerization** | Docker (nginx:alpine) | Deployment |
| **CI/CD** | GitLab CI | Build dan deploy pipeline |
| **Hosting** | Google Cloud Run | Serverless hosting |

### 5.2 Project Structure

```
erlangga-neo-simulation-rework/
├── .docs/                      # Documentation
│   └── PRD.md
├── public/                     # Static assets
│   └── favicon.ico
├── src/
│   ├── assets/                 # Images, fonts, global styles
│   ├── components/
│   │   ├── common/
│   │   │   ├── SearchBar.tsx
│   │   │   ├── CategoryFilter.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── simulation/
│   │   │   ├── SimulationCard.tsx
│   │   │   ├── SimulationGrid.tsx
│   │   │   ├── SimulationPlayer.tsx
│   │   │   └── FavoriteButton.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       ├── Navigation.tsx
│   │       └── MainLayout.tsx
│   ├── hooks/
│   │   ├── useSearch.ts
│   │   ├── useFilter.ts
│   │   ├── useFavorites.ts
│   │   └── useRecentlyViewed.ts
│   ├── data/
│   │   └── simulations.ts      # Simulations metadata registry
│   ├── router/
│   │   └── index.tsx
│   ├── stores/
│   │   ├── favoritesStore.ts
│   │   └── historyStore.ts
│   ├── types/
│   │   └── index.ts
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Category.tsx
│   │   ├── Favorites.tsx
│   │   ├── Simulation.tsx
│   │   └── NotFound.tsx
│   ├── simulations/            # All 70 simulations
│   │   ├── Astronomy/
│   │   │   ├── FaseBulan/
│   │   │   ├── GerakParalaks/
│   │   │   └── ...
│   │   ├── Biology/
│   │   ├── Chemistry/
│   │   ├── ComputerScience/
│   │   ├── Mathematics/
│   │   ├── Physics/
│   │   └── EarthScience/
│   ├── App.tsx
│   └── main.tsx
├── .gitlab-ci.yml
├── Dockerfile
├── nginx.conf
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

### 5.3 Routing Structure

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Home | Dashboard dengan semua simulasi |
| `/category/:category` | Category | Filter by category |
| `/simulation/:id` | Simulation | Simulation player |
| `/favorites` | Favorites | Favorites page |
| `/*` | NotFound | 404 page |

### 5.4 Data Models

```typescript
// Simulation Metadata
interface Simulation {
  id: string;              // Unique identifier (e.g., 'fase-bulan')
  title: string;           // Display title
  category: Category;      // Category enum
  path: string;            // Internal path for routing
  description?: string;    // Optional description
  tags: string[];          // Search tags
  component: () => Promise<React.ComponentType>; // Lazy load component
}

type Category = 
  | 'Astronomy' 
  | 'Biology' 
  | 'Chemistry' 
  | 'ComputerScience' 
  | 'Mathematics' 
  | 'Physics' 
  | 'EarthScience';

// Favorites Store (Zustand)
interface FavoritesStore {
  favorites: string[];     // Array of simulation IDs
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

// History Store (Zustand)
interface HistoryStore {
  history: HistoryItem[];  // Array of viewed simulations
  addToHistory: (id: string) => void;
  clearHistory: () => void;
  getRecentlyViewed: (limit: number) => Simulation[];
}

interface HistoryItem {
  id: string;
  viewedAt: number;        // Timestamp
}
```

### 5.5 Simulation Registry

Total: **70 Simulations**

#### Astronomy (5)
| ID | Title | Path |
|----|-------|------|
| `fase-bulan` | Fase Bulan | `/astronomy/fase-bulan` |
| `gerak-paralaks` | Gerak Paralaks | `/astronomy/gerak-paralaks` |
| `hukum-kepler-2` | Hukum Kepler 2 | `/astronomy/hukum-kepler-2` |
| `jam-matahari` | Jam Matahari | `/astronomy/jam-matahari` |
| `tata-surya-draggable` | Tata Surya Draggable | `/astronomy/tata-surya-draggable` |

#### Biology (8)
| ID | Title | Path |
|----|-------|------|
| `difusi` | Difusi | `/biology/difusi` |
| `genetika-buta-warna` | Genetika Buta Warna | `/biology/genetika-buta-warna` |
| `genetika-darah` | Genetika Darah | `/biology/genetika-darah` |
| `genetika-mendel` | Genetika Mendel | `/biology/genetika-mendel` |
| `golongan-darah` | Golongan Darah | `/biology/golongan-darah` |
| `lab-fotosintesis` | Lab Fotosintesis | `/biology/lab-fotosintesis` |
| `pembelahan-sel-mitosis` | Pembelahan Sel Mitosis | `/biology/pembelahan-sel-mitosis` |
| `pewarisan-kromosom-seks-manusia` | Pewarisan Kromosom Seks Manusia | `/biology/pewarisan-kromosom-seks-manusia` |

#### Chemistry (5)
| ID | Title | Path |
|----|-------|------|
| `membangun-atom` | Membangun Atom | `/chemistry/membangun-atom` |
| `sel-volta` | Sel Volta | `/chemistry/sel-volta` |
| `skala-ph` | Skala pH | `/chemistry/skala-ph` |
| `tabel-periodek` | Tabel Periodik | `/chemistry/tabel-periodek` |
| `titrasi-asam-basa` | Titrasi Asam Basa | `/chemistry/titrasi-asam-basa` |

#### Computer Science (4)
| ID | Title | Path |
|----|-------|------|
| `algoritma-sorting` | Algoritma Sorting | `/cs/algoritma-sorting` |
| `gerbang-logika` | Gerbang Logika | `/cs/gerbang-logika` |
| `pathfinding` | Pathfinding | `/cs/pathfinding` |
| `sql-join-visualizer` | SQL Join Visualizer | `/cs/sql-join-visualizer` |

#### Mathematics (11)
| ID | Title | Path |
|----|-------|------|
| `math-level-1-6` | Math Level 1-6 | `/math/level-1-6` |
| `konverter-satuan-universal` | Konverter Satuan Universal | `/math/konverter-satuan-universal` |
| `platonic-solid-3d` | Platonic Solid 3D | `/math/platonic-solid-3d` |
| `hukum-pythagoras` | Hukum Pythagoras | `/math/hukum-pythagoras` |
| `konverter-waktu` | Konverter Waktu | `/math/konverter-waktu` |
| `permutasi-kombinasi` | Permutasi Kombinasi | `/math/permutasi-kombinasi` |
| `perspektif-1-2-titik` | Perspektif 1-2 Titik | `/math/perspektif-1-2-titik` |
| `pizza-pecahan` | Pizza Pecahan | `/math/pizza-pecahan` |
| `poligon-interaktif` | Poligon Interaktif | `/math/poligon-interaktif` |
| `transformasi-vektor` | Transformasi Vektor | `/math/transformasi-vektor` |

#### Physics (36)
| ID | Title | Path |
|----|-------|------|
| `arus-listrik-dc` | Arus Listrik DC | `/physics/arus-listrik-dc` |
| `balon-udara` | Balon Udara | `/physics/balon-udara` |
| `bejana-berhubungan` | Bejana Berhubungan | `/physics/bejana-berhubungan` |
| `bidang-miring` | Bidang Miring | `/physics/bidang-miring` |
| `botol-musik` | Botol Musik | `/physics/botol-musik` |
| `cahaya-dan-pigmen` | Cahaya dan Pigmen | `/physics/cahaya-dan-pigmen` |
| `cakram-newton` | Cakram Newton | `/physics/cakram-newton` |
| `cartesian-diver` | Cartesian Diver | `/physics/cartesian-diver` |
| `cermin-cekung-cembung` | Cermin Cekung Cembung | `/physics/cermin-cekung-cembung` |
| `cermin-datar` | Cermin Datar | `/physics/cermin-datar` |
| `efek-doppler` | Efek Doppler | `/physics/efek-doppler` |
| `gaya-apung` | Gaya Apung | `/physics/gaya-apung` |
| `gaya-sentripetal` | Gaya Sentripetal | `/physics/gaya-sentripetal` |
| `gelombang-echo` | Gelombang Echo | `/physics/gelombang-echo` |
| `gelombang-transversal` | Gelombang Transversal | `/physics/gelombang-transversal` |
| `gerak-parabola` | Gerak Parabola | `/physics/gerak-parabola` |
| `hukum-archimedes` | Hukum Archimedes | `/physics/hukum-archimedes` |
| `hukum-hooke-pegas` | Hukum Hooke Pegas | `/physics/hukum-hooke-pegas` |
| `hukum-newton` | Hukum Newton | `/physics/hukum-newton` |
| `interaksi-magnet` | Interaksi Magnet | `/physics/interaksi-magnet` |
| `interferensi-suara` | Interferensi Suara | `/physics/interferensi-suara` |
| `kaca-planparalel` | Kaca Planparalel | `/physics/kaca-planparalel` |
| `katrol-tunggal` | Katrol Tunggal | `/physics/katrol-tunggal` |
| `kecepatan-percepatan` | Kecepatan Percepatan | `/physics/kecepatan-percepatan` |
| `kerapatan-udara` | Kerapatan Udara | `/physics/kerapatan-udara` |
| `konverter-rgb-cmyk` | Konverter RGB CMYK | `/physics/konverter-rgb-cmyk` |
| `optik-2-lensa` | Optik 2 Lensa | `/physics/optik-2-lensa` |
| `pemuaian-udara` | Pemuaian Udara | `/physics/pemuaian-udara` |
| `pengungkit-tuas` | Pengungkit Tuas | `/physics/pengungkit-tuas` |
| `perpindahan-kalor` | Perpindahan Kalor | `/physics/perpindahan-kalor` |
| `pompa-hidrolik` | Pompa Hidrolik | `/physics/pompa-hidrolik` |
| `prisma-cahaya` | Prisma Cahaya | `/physics/prisma-cahaya` |
| `refraksi-cahaya` | Refraksi Cahaya | `/physics/refraksi-cahaya` |
| `resonansi-pendulum` | Resonansi Pendulum | `/physics/resonansi-pendulum` |
| `roda-gigi` | Roda Gigi | `/physics/roda-gigi` |
| `telepon-kabel` | Telepon Kabel | `/physics/telepon-kabel` |

#### Earth Science (1)
| ID | Title | Path |
|----|-------|------|
| `siklus-hidrologi` | Siklus Hidrologi | `/earth-science/siklus-hidrologi` |

---

## 6. UI/UX Specifications

### 6.1 Design System

#### Color Palette
```css
:root {
  /* Primary */
  --primary: #3b82f6;
  --primary-dark: #2563eb;
  --primary-light: #60a5fa;
  --primary-glow: rgba(59, 130, 246, 0.5);
  
  /* Background */
  --bg: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  
  /* Card */
  --card-bg: rgba(30, 41, 59, 0.7);
  --card-border: rgba(51, 65, 85, 0.5);
  
  /* Text */
  --text: #f1f5f9;
  --text-muted: #94a3b8;
  
  /* Accent */
  --accent: #10b981;
  --accent-glow: rgba(16, 185, 129, 0.3);
  
  /* Category Colors */
  --astronomy: #8b5cf6;
  --biology: #22c55e;
  --chemistry: #eab308;
  --cs: #06b6d4;
  --math: #f97316;
  --physics: #ef4444;
  --earth: #14b8a6;
}
```

#### Typography
```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;

h1: 3.5rem (56px) - font-weight: 800
h2: 1.75rem (28px) - font-weight: 700
h3: 1.25rem (20px) - font-weight: 600
body: 1rem (16px) - font-weight: 400
small: 0.875rem (14px) - font-weight: 400
```

### 6.2 Component Specifications

#### Simulation Card
```
┌─────────────────────────────────┐
│  [Category Badge]     [★ Fav]  │
│                                 │
│  Simulation Title               │
│  (2-3 lines max)                │
│                                 │
│  ─────────────────────────      │
│  📁 category/simulation-name    │
└─────────────────────────────────┘

Hover Effects:
- Transform: translateY(-10px) scale(1.02)
- Border: primary color glow
- Shadow: elevated shadow + glow
```

#### Search Bar
```
┌─────────────────────────────────────────┐
│  🔍  Search simulations...              │
└─────────────────────────────────────────┘

Features:
- Debounce 300ms
- Clear button (×) when has value
- Focus: primary border + glow
```

#### Category Filter
```
[All] [Astronomy] [Biology] [Chemistry] [CS] [Math] [Physics] [Earth]

Active State:
- Background: primary color
- Text: white

Inactive State:
- Background: transparent
- Text: muted
- Border: card-border
```

### 6.3 Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | 1 column, stacked |
| Tablet | 640px - 1024px | 2 columns |
| Desktop | > 1024px | 3-4 columns |
| Large Desktop | > 1400px | Max width 1400px centered |

---

## 7. Deployment Architecture

### 7.1 Docker Configuration

**Dockerfile:**
```dockerfile
FROM nginx:alpine

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy built Vue app
COPY dist/ /usr/share/nginx/html

# Pre-compress WASM files
RUN find /usr/share/nginx/html -type f -name "*.wasm" -exec gzip -9 -k {} \;

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
```

**nginx.conf:**
```nginx
server {
    listen 8080;
    
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # CORS & Security headers
        add_header Cross-Origin-Resource-Policy cross-origin always;
        add_header Access-Control-Allow-Origin * always;
        add_header Content-Security-Policy "frame-ancestors *" always;
    }
    
    # WASM handling
    location ~ \.wasm$ {
        types { application/wasm wasm; }
        default_type application/wasm;
        gzip_static on;
        gzip off;
    }
}
```

### 7.2 GitLab CI/CD Pipeline

```yaml
stages:
  - build
  - deploy
  - cleanup

variables:
  IMAGE: "$PUB_REGION_JAKARTA-docker.pkg.dev/$PUB_EXPLORE_PROJECT_ID/$GCP_APP_NAME/$GCP_APP_NAME"

build:
  stage: build
  script:
    - npm install
    - npm run build
    - echo "$PUB_EXPLORE_SERVICE_ACCOUNT" > key.json
    - gcloud auth activate-service-account --key-file=key.json
    - gcloud auth configure-docker $PUB_REGION_JAKARTA-docker.pkg.dev --quiet
    - docker buildx build --platform linux/amd64 -t "${IMAGE}:latest" -t "${IMAGE}:${CI_COMMIT_SHORT_SHA}" --push .
  only:
    - main

deploy:
  stage: deploy
  script:
    - gcloud run deploy "$GCP_APP_NAME" --image "${IMAGE}:latest" --region "$PUB_REGION_JAKARTA" --port 8080 --memory 256Mi --cpu 1
  needs: ["build"]
  only:
    - main

cleanup:
  stage: cleanup
  script:
    - docker rmi "${IMAGE}:latest" || true
    - docker rmi "${IMAGE}:${CI_COMMIT_SHORT_SHA}" || true
  needs: ["deploy"]
  when: always
```

### 7.3 Cloud Run Configuration

| Parameter | Value |
|-----------|-------|
| **Region** | asia-southeast2 (Jakarta) |
| **Memory** | 256 MiB |
| **CPU** | 1 |
| **Port** | 8080 |
| **Auto-scaling** | 0-100 instances |
| **Timeout** | 300 seconds |

---

## 8. Development Timeline

### Phase 1: Foundation (Week 1-2)
- [ ] Setup Vue 3 + Vite + TypeScript project
- [ ] Configure TailwindCSS dan design system
- [ ] Setup Vue Router dengan basic routes
- [ ] Setup Pinia stores (favorites, history)
- [ ] Create simulation metadata registry
- [ ] Build core components (SearchBar, CategoryFilter, SimulationCard)

### Phase 2: Dashboard & Navigation (Week 2-3)
- [ ] HomeView dengan simulation grid
- [ ] Search functionality dengan debounce
- [ ] Category filter functionality
- [ ] Responsive layout
- [ ] Header, Footer, Navigation components

### Phase 3: Simulation Player (Week 3-4)
- [ ] SimulationView wrapper component
- [ ] Lazy loading mechanism
- [ ] Loading dan error states
- [ ] Back navigation dan breadcrumb
- [ ] Favorite toggle integration

### Phase 4: Features (Week 4-5)
- [ ] FavoritesView page
- [ ] Recently viewed section
- [ ] localStorage persistence
- [ ] Clear history functionality
- [ ] No results state

### Phase 5: Simulation Migration (Week 5-10)
- [ ] Migrate Astronomy simulations (5)
- [ ] Migrate Biology simulations (8)
- [ ] Migrate Chemistry simulations (5)
- [ ] Migrate ComputerScience simulations (4)
- [ ] Migrate Mathematics simulations (11)
- [ ] Migrate Physics simulations (36)
- [ ] Migrate EarthScience simulations (1)

### Phase 6: Testing & Optimization (Week 10-11)
- [ ] Performance optimization
- [ ] Lighthouse audit (>90 score)
- [ ] Cross-browser testing
- [ ] Mobile testing
- [ ] Accessibility audit (WCAG 2.1 AA)

### Phase 7: Deployment (Week 11-12)
- [ ] Docker configuration
- [ ] GitLab CI/CD pipeline
- [ ] Cloud Run deployment
- [ ] Production testing
- [ ] Documentation

---

## 9. Success Metrics

### 9.1 Performance KPIs
| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| Lighthouse Performance | > 90 |
| Lighthouse Accessibility | > 90 |
| Lighthouse Best Practices | > 90 |
| Lighthouse SEO | > 90 |

### 9.2 User Engagement KPIs
| Metric | Target |
|--------|--------|
| Bounce Rate | < 40% |
| Avg Session Duration | > 3 minutes |
| Pages per Session | > 4 |
| Return Visitors | > 30% |

### 9.3 Technical KPIs
| Metric | Target |
|--------|--------|
| Uptime | > 99.9% |
| Error Rate | < 0.1% |
| Build Time | < 2 minutes |
| Deploy Time | < 5 minutes |

---

## 10. Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Simulation compatibility issues | High | Medium | Test each simulation thoroughly, create fallback components |
| Large bundle size affecting performance | Medium | High | Implement code splitting, lazy loading, tree shaking |
| WASM loading issues on Cloud Run | Medium | Medium | Pre-compress WASM, optimize nginx config, proper MIME types |
| Browser compatibility | Low | Low | Test on all target browsers, use polyfills if needed |
| Memory limits on Cloud Run (256Mi) | Medium | Medium | Optimize asset loading, lazy load simulations, monitor memory usage |

---

## 11. Appendix

### 11.1 Glossary
| Term | Definition |
|------|------------|
| **SPA** | Single Page Application |
| **HMR** | Hot Module Replacement |
| **CSP** | Content Security Policy |
| **CORS** | Cross-Origin Resource Sharing |
| **WASM** | WebAssembly |
| **FCP** | First Contentful Paint |
| **TTI** | Time to Interactive |

### 11.2 References
- [Vue 3 Documentation](https://vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [TailwindCSS Documentation](https://tailwindcss.com/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Google Cloud Run Documentation](https://cloud.google.com/run)
- [GitLab CI/CD Documentation](https://docs.gitlab.com/ee/ci/)

### 11.3 Document History
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-03-16 | Development Team | Initial PRD creation |

---

## 12. Approval

| Role | Name | Status | Date |
|------|------|--------|------|
| Product Owner | TBD | ⏳ Pending | - |
| Tech Lead | TBD | ⏳ Pending | - |
| Development Lead | TBD | ⏳ Pending | - |

---

**END OF DOCUMENT**

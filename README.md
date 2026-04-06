# Erlangga Neo Simulation Platform

Interactive simulation platform for science education built with React + Vite + TypeScript.

## 🚀 Features

- **70 Simulations** across 7 categories (Astronomy, Biology, Chemistry, Computer Science, Mathematics, Physics, Earth Science)
- **Search & Filter** - Find simulations quickly with full-text search and category filtering
- **Favorites System** - Save your favorite simulations (localStorage)
- **Recently Viewed** - Track your simulation history
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Dark Theme** - Modern dark UI with glow effects

## 🛠️ Tech Stack

- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **Routing:** React Router DOM v6
- **State Management:** Zustand
- **Styling:** TailwindCSS v4
- **Icons:** Lucide React
- **Deployment:** Docker + Nginx + Google Cloud Run

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏗️ Project Structure

```
src/
├── components/
│   ├── common/        # Shared components (SearchBar, CategoryFilter, etc.)
│   ├── simulation/    # Simulation-specific components
│   └── layout/        # Layout components (Header, Footer, etc.)
├── hooks/             # Custom React hooks
├── pages/             # Page components
├── router/            # React Router configuration
├── stores/            # Zustand stores (favorites, history)
├── data/              # Simulation metadata registry
├── types/             # TypeScript type definitions
├── simulations/       # All 70 simulation components
└── assets/            # Static assets
```

## 🚢 Deployment

### Docker Build

```bash
docker build -t erlangga-neo-simulation .
```

### GitLab CI/CD

The project includes `.gitlab-ci.yml` for automated deployment to Google Cloud Run via GitLab CI/CD.

### Environment Variables

Required variables for deployment:
- `PUB_EXPLORE_SERVICE_ACCOUNT` - GCP service account JSON
- `PUB_EXPLORE_PROJECT_ID` - GCP project ID
- `PUB_REGION_JAKARTA` - GCP region (asia-southeast2)
- `GCP_APP_NAME` - Application name

## 📊 Simulations

| Category | Count |
|----------|-------|
| Astronomy | 5 |
| Biology | 8 |
| Chemistry | 5 |
| Computer Science | 4 |
| Mathematics | 11 |
| Physics | 36 |
| Earth Science | 1 |
| **Total** | **70** |

## 📄 Documentation

- [PRD](.docs/PRD.md) - Product Requirements Document

## 📝 License

ISC

## 👥 Authors

Erlangga Neo Team

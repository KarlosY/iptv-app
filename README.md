# 📺 IPTV Stream Web App

A modern, fast, and feature-rich IPTV web application built to stream live TV channels from around the world. Designed with a clean, dynamic aesthetic inspired by modern Smart TV interfaces and gamer platforms.

## 🚀 Features

*   **Global Live TV:** Access thousands of live TV channels via the [IPTV-org](https://github.com/iptv-org/iptv) dataset.
*   **HLS Video Player:** Integrated custom video player built on top of `hls.js` capable of smoothly streaming `.m3u8` playlists.
*   **Smart Filtering & Search:**
    *   **Debounced Search:** Find channels instantly without ui lag.
    *   **Categories & Countries:** Filter the channel grid dynamically by their genre or origin country.
*   **User Personalization (Zustand + LocalStorage):**
    *   ❤️ **Favorites:** Save your preferred channels and quickly access them from the sidebar.
    *   🕒 **Recently Viewed:** Automatically tracks your watch history for easy resuming.
*   **High Performance:**
    *   **Infinite Scrolling:** Employs the Intersection Observer API to only render channels visible on your screen, drastically reducing initial load times and memory footprint.
    *   **Optimized Architecture:** Clean Architecture principles ensuring decoupling between business logic, data boundaries, and UI presentation components.
*   **Modern UI/UX:** Built with React and CSS, utilizing responsive flexbox/grid layouts, glassmorphism overlays, and Lucide Icons.

## 🛠️ Technology Stack

*   [Next.js](https://nextjs.org/) (App Router Framework)
*   [React](https://reactjs.org/) 18 (UI Library)
*   [TypeScript](https://www.typescriptlang.org/) (Static Typing)
*   [Zustand](https://zustand-demo.pmnd.rs/) (Global State Management & Persistence)
*   [HLS.js](https://github.com/video-dev/hls.js) (Video Streaming)
*   [Lucide React](https://lucide.dev/) (Iconography)

## 🏗️ Project Architecture (Clean Architecture)

The application follows strict Clean Architecture guidelines:

*   **`src/domain`**: Entities (`Channel`, `Category`, `Country`, `Stream`) and repository interfaces. Contains zero external dependencies.
*   **`src/infrastructure`**: Concrete repository implementations (`*RepositoryImpl.ts`) and data sources fetching external APIs.
*   **`src/application`**: Use Cases orchestrating data retrieval from repositories for the UI.
*   **`src/presentation`**: Next.js Pages, React Components, Custom Hooks, Contexts, and Zustand stores.

## ⚙️ Getting Started

### Prerequisites

*   Node.js (v18.x or newer strongly recommended)
*   npm

### Installation

1. **Clone the repository** (if applicable):
   ```bash
   git clone <repository-url>
   cd iptv-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open the App**:
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 📋 API Reference

This application uses the community-driven [IPTV-org](https://github.com/iptv-org/api) API to fetch metadata:

*   Channels: `https://iptv-org.github.io/api/channels.json`
*   Streams: `https://iptv-org.github.io/api/streams.json`
*   Categories: `https://iptv-org.github.io/api/categories.json`
*   Countries: `https://iptv-org.github.io/api/countries.json`

## 🔮 Future Roadmap (Planned Features)

*   **Picture-in-Picture (PiP):** Allow minimizing the video player into a floating window to browse while watching.
*   **Language Filter:** Filter channels by available languages.
*   **Dark/Light Theme Toggler.**

## 📄 License

This project is open-source and available under the standard MIT License. Data streams are provided strictly by third-party public lists.

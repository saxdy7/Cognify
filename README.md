# Cognify - High-Res Knowledge Hub

Cognify is a "God-level" dashboard for organizing digital resources, built with **Next.js**, **Tailwind CSS**, and **Supabase**. It features a spatial organization system with a premium, dynamic interface..

## 🚀 Key Features

### 🌌 Spatial Dashboard
-   **Fixed Sidebar**: Collapsible navigation with smooth `Framer Motion` animations.
-   **Layout Options**: Switch between **Row-based Grid** (Left-to-Right) and **List View** (Horizontal Cards).
-   **Masonry Support**: option for dynamic height layouts.

### 🔔 Active Notification System
The application features a centralized alert system that captures all critical user actions:
-   **Space Creation**: Success alert when a new container is initialized.
-   **Resource Capture**: Success alert when a new bookmark is added.
-   **Resource Purged**: Warning alert when an item is permanently deleted.
-   **Interactive Inbox**: A dynamic notification tray where users can dismiss items or "Mark all read".

### ⚡ Power Features
-   **Micro-Interactions**: Hover effects, glassmorphism, and fluid transitions.
-   **Keyboard Shortcuts**: Command-click to toggle shortcut status.
-   **Favorites**: Star items to add them to your Curated Collection.

## 🛠 Tech Stack
-   **Framework**: Next.js 14 (App Router)
-   **Styling**: Tailwind CSS + Framer Motion
-   **Icons**: Lucide React
-   **Backend**: Supabase (Auth + Database)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
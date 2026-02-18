# AI Development Guide for AllFit

## 🔰 Overview

This is a mobile-first fitness tracking app built with:

-   Expo Router
-   React Native
-   TypeScript
-   AsyncStorage (local-first storage)

This project is primarily a FRONTEND mobile app.

The backend folder exists but is optional and should NOT be modified
unless explicitly requested.

------------------------------------------------------------------------

## 📁 Important Directories

### app/

All screens and navigation live here. If modifying UI or features, start
here.

### components/

Reusable UI components. Do not rewrite structure unless necessary.

### lib/

Business logic and storage logic. AsyncStorage keys must not be changed.

### hooks/

Custom React hooks.

### constants/

Theme and configuration constants.

------------------------------------------------------------------------

## 🚫 Do NOT Modify

-   AsyncStorage key names
-   Folder structure
-   Navigation structure (Expo Router layout)
-   app.config.ts identifiers
-   Bundle IDs / package names

------------------------------------------------------------------------

## ✅ When Adding Features

-   Follow existing folder structure
-   Use ScreenContainer for screens
-   Use Tailwind (NativeWind) styling
-   Update TypeScript types properly
-   Keep mobile portrait UI (9:16)

------------------------------------------------------------------------

## 🧠 Architecture Rules

-   Local-first data storage
-   No global state managers (Redux, Zustand not allowed)
-   Context + AsyncStorage pattern only
-   Must remain mobile optimized

------------------------------------------------------------------------

## 🛑 Before Changing Code

Always: 1. Check ARCHITECTURE.md 2. Check design.md 3. Follow existing
patterns

Never refactor entire structure without explicit instruction.

------------------------------------------------------------------------

This file exists to prevent destructive AI refactors.

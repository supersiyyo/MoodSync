---
title: Architecture & Tech Stack
type: Architecture
---
# Architecture & Tech Stack

## Technology Stack
- **React Native & Expo:** Used for cross-platform mobile development (iOS and Android), simplifying development, testing, and builds.
- **Firebase:** Manages real-time data, authentication (via Spotify login), and cloud functions.
  - *Firebase Realtime Database:* Handles live session data, active participants, current moods, and room state.
  - *Cloud Firestore:* Manages persistent data such as saved playlists, user profiles, and session history.

## APIs & Integrations
- **Google Gemini API:** Analyzed collective emoji inputs using a **Resilience Cascade** (primary: `gemini-2.5-flash`, backup: `gemini-2.5-flash-lite`) with exponential backoff to ensure high availability.
- **Spotify API:** Acts as the primary integration for music search, recommendations, and real-time playback.
  - *Authentication:* Uses **PKCE-based OAuth** with the **Expo Auth Proxy** for stable cross-environment redirects.
  - *Playback:* Host-driven immediate playback for Spotify Premium users.

**Related Documents:**
- [Features & Limitations](./05-features-and-limitations.md)
- [Prompting Strategy](./Prompting Strategy.md)
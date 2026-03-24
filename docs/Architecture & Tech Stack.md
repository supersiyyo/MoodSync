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
- **Spotify API:** Acts as the primary integration for music search, recommendations, and playlist management. Firebase cloud functions call the Spotify API to generate and update playlists based on the group's mood.
  - *Constraint:* Full music playback within a session is restricted to Hosts with an active Spotify Premium subscription.
- **Apple Music API:** Serves as the alternative integration to handle music playback and playlist creation for users opting out of Spotify. We utilize the Apple Music API specifically because it does not require the user to log into anything, acting as a frictionless secondary music catalog to fetch and queue songs.
- **Google Gemini API:** Analyzes collective emoji inputs, mapping combinations to mood attributes to drive song recommendations across both streaming platforms.

**Related Documents:**
- [Features & Limitations](./05-features-and-limitations.md)
---
title: Architecture & Tech Stack
type: Architecture
---
# Architecture & Tech Stack

## Technology Stack
- **React Native & Expo:** Used for cross-platform mobile development (iOS and Android), simplifying development, testing, and builds.
- **Firebase:** Manages real-time data and session synchronization.
  - *Cloud Firestore:* Handles live session data (via snapshots), active participants, current moods, room state, and manages persistent data such as session history.

## APIs & Integrations
- **iTunes Search API:** Acts as the primary integration for fetching song metadata and 30-second audio previews. It is utilized because it does not require the user to log into anything or maintain active subscriptions, acting as a frictionless catalog to fetch and queue songs contextually.
- **Google Gemini API:** Analyzes collective emoji inputs directly from the client, mapping combinations to music queries, which drive song recommendations for the iTunes search.

**Related Documents:**
- [Features & Limitations](./05-features-and-limitations.md)
- [Prompting Strategy](./Prompting Strategy.md)
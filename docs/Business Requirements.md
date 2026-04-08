---
title: Business Requirements
type: Requirements
---
# Business Requirements

## Business Opportunity
Currently, there is no other application that allows groups to collaboratively create playlists using real-time emoji inputs.

## Success Metrics
MoodSync evaluates success through the following metrics:
- All users can join with unique names and synchronize playback.
- All track previews can be dynamically fetched and queued.
- All emoji inputs are recorded and prompted to the AI.
- Firebase Cloud Firestore correctly stores live session synchronization and history.

## Business Risks
- **Technical Failures:** Server downtime or latency issues could disrupt real-time synchronization between users across Firestore.
- **API Dependencies:** Heavy reliance on the iTunes Search API and Gemini means rate limits or changes to their services could break app functionality if abused.
- **Competition:** Established apps like Spotify could develop similar native features, reducing the need for MoodSync.

## Assumptions & Dependencies
- **Assumptions:** Users have an iOS or Android smartphone with a stable internet connection, and are familiar with emojis as a form of self-expression.
- **Dependencies:**
  - [Google Gemini API](./Architecture & Tech Stack.md) for mapping emoji combinations to song queries.
  - Firebase Cloud Firestore for recording real-time session state and history.
  - iTunes Search API for fetching song metadata and audio previews seamlessly.

**Related Documents:**
- [Architecture & Tech Stack](./03-architecture-and-tech-stack.md)
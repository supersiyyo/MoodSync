---
title: Business Requirements
type: Requirements
---
# Business Requirements

## Business Opportunity
Currently, there is no other application that allows groups to collaboratively create playlists using real-time emoji inputs.

## Success Metrics
MoodSync evaluates success through the following metrics:
- All users can log in with unique information.
- All songs can be skipped with a next song queued up.
- All emoji inputs are recorded and prompted to the AI.
- Firebase correctly stores session information.

## Business Risks
- **Technical Failures:** Server downtime or latency issues could disrupt real-time synchronization between users.
- **API Dependencies:** Heavy reliance on Apple Music and Spotify APIs means rate limits or changes to their services could break app functionality.
- **Competition:** Established apps like Spotify could develop similar native features, reducing the need for MoodSync.

## Assumptions & Dependencies
- **Assumptions:** Users have an iOS or Android smartphone with a stable internet connection, are familiar with emojis as a form of self-expression, and Hosts possess a Spotify subscription for music playback.
- **Dependencies:**
  - [Google Gemini API](./03-architecture-and-tech-stack.md) for mapping emoji combinations to mood attributes.
  - Firebase for recording real-time session data.
  - Spotify/Apple Music APIs for playback and playlist creation.

**Related Documents:**
- [Architecture & Tech Stack](./03-architecture-and-tech-stack.md)
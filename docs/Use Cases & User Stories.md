---
title: Use Cases & User Stories
type: Requirements
---
# Use Cases & User Stories

## User Stories

### Host Options
- **Host (With Spotify):** "As a host, I want to create a room authenticated with my Spotify Premium subscription so that I can control full music playback for my friends."
- **Host (Without Spotify):** "As a host, I want to create a room using Apple Music so that I can host a session without needing a Spotify account or having to log into anything."
- **Host (General):** "As a host, I want to end the session so that the room is closed and all users are exited."

### Joiner & General User Stories
- **Joiner:** "As a joiner, I want to join an existing room using a room code so that I can listen to music in sync with others."
- **General User:** "As a user, I want to submit emoji reactions to tailor the music to my mood/vibe."
- **General User:** "As a user, I want to skip songs that I do not prefer so that I can enjoy music that better fits my mood."
- **General User:** "As a user, I want to save a song to my library (Spotify or Apple Music) so that I can listen to it again later outside of the session."

## Core Use Cases

### UC-1A: Host a Room (With Spotify)
- **Actor:** Host (Secondary: Firebase, Spotify API)
- **Precondition:** User is authenticated with an active Spotify Premium subscription.
- **Flow:** User decides to host -> Prompts for room name & settings -> Spotify authentication verified -> Room created.
- **Postcondition:** Session ID generated and stored in Firebase.

### UC-1B: Host a Room (Without Spotify / Apple Music)
- **Actor:** Host (Secondary: Firebase, Apple Music API)
- **Precondition:** User opts to use Apple Music, which does not require any login authentication.
- **Flow:** User decides to host -> Prompts for room name & settings -> Room created without authentication -> Session ID generated.
- **Postcondition:** Session ID generated and stored in Firebase.

### UC-2: Join a Room
- **Actor:** Joiner (Secondary: Firebase)
- **Precondition:** An active room must exist.
- **Flow:** User selects "Join" -> Enters room code -> Authenticated into room.
- **Alternative Flow:** Invalid code reprompts the user to enter the code again.

### UC-3A: Submit Emoji Reaction (With Spotify)
- **Actor:** Host, Joiner, or Solo User (Secondary: MoodSync AI, Spotify API)
- **Precondition:** User is either in a room or a solo listener with Spotify configured.
- **Flow:** User opens emoji panel and selects mood -> AI analyzes inputs from all users -> Spotify API queues matching songs.
- **Postcondition:** Emoji reactions recorded, AI generates prompt, song fetched via Spotify.

### UC-3B: Submit Emoji Reaction (Without Spotify / Apple Music)
- **Actor:** Host, Joiner, or Solo User (Secondary: MoodSync AI, Apple Music API)
- **Precondition:** User is either in a room or a solo listener using the Apple Music integration, requiring no login.
- **Flow:** User opens emoji panel and selects mood -> AI analyzes inputs from all users -> Apple Music API queues matching songs.
- **Postcondition:** Emoji reactions recorded, AI generates prompt, song fetched via Apple Music.

**Related Documents:**
- [User Roles](./04-user-roles.md)
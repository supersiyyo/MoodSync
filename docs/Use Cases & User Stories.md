---
title: Use Cases & User Stories
type: Requirements
---
# Use Cases & User Stories

## User Stories

### Host Options
- **Host:** "As a host, I want to create a room effortlessly without logging in to any external services so that my friends can join and we can start picking vibes immediately."
- **Host:** "As a host, I want to be able to leave the room and have the session properly ended."

### Joiner & General User Stories
- **Joiner:** "As a joiner, I want to join an existing room using a room code so that I can listen to music in sync with others."
- **General User:** "As a user, I want to submit emoji reactions to tailor the music to my mood/vibe."
- **General User:** "As a user, I want to toggle playback modes and optionally skip tracks so that I have control over what I'm listening to."

## Core Use Cases

### UC-1: Host a Room
- **Actor:** Host (Secondary: Firebase Cloud Firestore)
- **Flow:** User selects "Host" path -> Explores to Host Settings -> Prompts for user name & room name -> Room created without authentication -> Session ID generated.
- **Postcondition:** Session ID generated and stored in Firestore.

### UC-2: Join a Room
- **Actor:** Joiner (Secondary: Firebase Cloud Firestore)
- **Precondition:** An active room must exist.
- **Flow:** User selects "Join" path -> Enters room code & their name -> Authenticated into room.
- **Alternative Flow:** Invalid code or empty name reprompts the user to enter valid information.

### UC-3: Submit Emoji Reaction
- **Actor:** Host or Joiner (Secondary: Google Gemini API, iTunes Search API)
- **Precondition:** User is securely in a room.
- **Flow:** User opens emoji panel and selects mood -> AI directly analyzes inputs to form an intent -> System searches iTunes for the matching song preview.
- **Postcondition:** Emoji reactions recorded to Firestore history, AI metadata saved, song preview queued globally.

**Related Documents:**
- [User Roles](./04-user-roles.md)
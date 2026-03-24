---
title: User Flow - Host Session
type: User Flow
---
# User Flow: Host a Session

## Objective
To outline the screen-by-screen progression of a user opening the application, creating a new session as a Host, and initiating the first song playback using emoji inputs.

## The Flow

1. **App Launch:** The user opens the MoodSync application.
2. **Landing Screen:** The user taps the "Sync" button, which navigates them to the role selection screen (Host vs. Join).
3. **Role Selection:** The user selects "Host".
4. **Host Settings Configuration:** - The user is prompted to input their **Name** and the desired **Room Name**.
   - The user is presented with an **Explicit Content** toggle (Default state: *Yes*).
   - The user taps the large "Start" button at the bottom of the screen.
5. **Active Session Room:** The user is routed to the main room UI.
   - *Top/Header UI:* Displays the Room Code, Room Name, a "History" button, an "Only Host" toggle, and a "Leave" button.
   - *Main UI:* Displays an Emoji button with the helper text, *"Tap below to set the vibe!"*
6. **Vibe Input:** The user taps the Emoji button, which opens an extensive list of system or custom VAST emojis.
7. **Submission:** The user selects their desired emojis and taps "Play Vibe".
8. **AI Processing (Backend):** The AI takes the emoji submission, interprets the underlying mood, and determines the appropriate song match.
9. **Playback State:** The AI processes and plays the chosen song. The song's metadata/album art is displayed in the center of the screen, while the user's submitted emojis rest at the bottom of the UI.

**Related Documents:**
- [Use Cases & User Stories](../02_Requirements/06-use-cases.md)
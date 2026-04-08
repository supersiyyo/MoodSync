---
title: User Flow - Joiner Session
type: User Flow
---
# User Flow: Join a Session

## Objective
To outline the screen-by-screen progression of a user opening the application, entering an existing room via a code, and submitting their emoji reactions to influence the group's playlist.

## The Flow

1. **App Launch:** The user opens the MoodSync application.
2. **Landing Screen:** The user taps the "Sync" button, which navigates them to the `/explore` path for role selection.
3. **Role Selection (Explore Screen):** The user selects the "Join" path.
4. **Room Entry Configuration:** - The user is prompted to input their **Name** and the **Room Code** (provided by the Host).
   - The user taps the large "JOIN" button.
5. **System Validation:** - *Happy Path:* Firebase Firestore verifies the Room Code exists and allows the user into the session.
   - *Alternative Path:* If the code is invalid, the UI displays an error message ("Room not found") and reprompts the user.
6. **Active Session Room:** The user is routed to the main room UI, syncing instantly with the Host's active playback state via Firestore snapshots.
   - *Top/Header UI:* Displays the Room elements and a "Leave" button. 
   - *Main UI:* Displays the currently playing song preview and interpretation.
7. **Vibe Input:** The user uses the Emoji selector at the bottom.
8. **Submission:** The user submits their selected emojis.
9. **AI Processing (Client/Firebase):** - The AI processes the Joiner's emojis to form a new intent and queries iTunes API.
   - This globally updates the `currentTrack` in the room, interrupting current playback to transition to the new vibe. The vibe is logged in the History Drawer.
10. **Playback State Update:** Both the Host and the Joiner immediately hear the newly selected 30-second preview and see the updated Album Art and AI interpretation.

**Related Documents:**
- [User Flow: Host a Session](./01-host-session-flow.md)
- [Use Cases & User Stories](../02_Requirements/06-use-cases.md)
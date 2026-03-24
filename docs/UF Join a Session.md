---
title: User Flow - Joiner Session
type: User Flow
---
# User Flow: Join a Session

## Objective
To outline the screen-by-screen progression of a user opening the application, entering an existing room via a code, and submitting their emoji reactions to influence the group's playlist.

## The Flow

1. **App Launch:** The user opens the MoodSync application.
2. **Landing Screen:** The user taps the "Sync" button, which navigates them to the role selection screen (Host vs. Join).
3. **Role Selection:** The user selects "Join".
4. **Room Entry Configuration:** - The user is prompted to input their **Name** and the **Room Code** (provided by the Host).
   - The user taps the large "Enter Room" button.
5. **System Validation (Backend):** - *Happy Path:* Firebase verifies the Room Code is active and authenticates the user into the session.
   - *Alternative Path:* If the code is invalid or the session has ended, the UI displays an error message ("Room not found") and reprompts the user to try again.
6. **Active Session Room:** The user is routed to the main room UI, syncing with the Host's playback state.
   - *Top/Header UI:* Displays the Room Name, the Host's Name, a "Participants" counter, and a "Leave" button. 
   - *Main UI:* Displays the currently playing song (if the Host has started the music) and an Emoji button with the helper text, *"Tap below to set the vibe!"*
7. **Vibe Input:** The user taps the Emoji button, opening the system or custom VAST emoji list.
8. **Submission:** The user selects their desired emojis and taps "Submit Vibe".
9. **AI Processing & Aggregation (Backend):** - The system registers the Joiner's emojis and recalculates the room's *average* group mood. 
   - The AI generates a new prompt based on this updated average, and the music streaming API (Spotify/Apple Music) updates the upcoming queue.
10. **Playback State Update:** The Joiner's UI returns to the main room view. Their selected emojis are displayed at the bottom of the screen, and the central UI continues to display the currently playing track synced from the Host.

**Related Documents:**
- [User Flow: Host a Session](./01-host-session-flow.md)
- [Use Cases & User Stories](../02_Requirements/06-use-cases.md)
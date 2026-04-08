---
title: User Flow - Host Session
type: User Flow
---
# User Flow: Host a Session

## Objective
To outline the screen-by-screen progression of a user opening the application, creating a new session as a Host, and initiating the first song playback using emoji inputs.

## The Flow

1. **App Launch:** The user opens the MoodSync application.
2. **Landing Screen:** The user taps the "Sync" button (or explores other ambient elements), which navigates them to the `/explore` path for role selection.
3. **Role Selection (Explore Screen):** The user selects the "Host" path.
4. **Host Settings Configuration:** - The user is prompted to input their **Name** and the desired **Room Name**.
   - The user is presented with an **Explicit Content** toggle (Default state: *Yes*).
   - The user taps the large "START" button at the bottom of the screen.
5. **Active Session Room:** The user is routed to the main room UI.
   - *Top/Header UI:* Displays the Room Code, Room Name, a "History" button (also accessible via swiping), a "Client/Host" playback toggle, and a "Leave" cross button.
   - *Main UI:* Displays an Emoji button interface at the bottom.
6. **Vibe Input:** The user chooses from the Emoji list to build their vibe.
7. **Submission:** The user taps to submit the emojis.
8. **AI Processing:** The AI processes the emoji submission locally and searches the iTunes Search API for a matching track.
9. **Playback State:** The app fetches the 30-second audio preview, plays it, updates the track display with the album art and interpretation text, and synchronizes this state to all clients over Firestore. The vibes are also saved to the Session's Past Vibes history drawer.

**Related Documents:**
- [Use Cases & User Stories](../02_Requirements/06-use-cases.md)
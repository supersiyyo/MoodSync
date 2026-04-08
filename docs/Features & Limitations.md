---
title: Features & Limitations
type: Specification
---
# Features & Limitations

## Major Features
- **Group Sessions:** Create or join a room with a code, see everyone's emojis, and watch group moods update in real-time.
- **Emoji Picker:** Replaces standard text boxes, offering an array of emojis for users to express their mood.
- **Vibe Queue:** Dynamically generates and queues song previews based on interpreted group moods.
- **Playback Controls:** Hosts can toggle playback modes, and queue syncs across all joined users in the room.
- **End-of-Session Stats / Past Vibes:** Displays insights and persistent history of emojis and songs played during a session via the History Drawer.
- **Extra Features:** Individual song countdown meters, host polling, and a reaction system.

## Scope of Initial Release & Limitations
The initial release will contain all major session features with the following strict limitations:
- **Audio Previews Only:** Because MoodSync leverages the public iTunes Search API without user authentication, playback is restricted to the 30-second audio previews available for songs. Full native playback via an external app is not currently supported in-session.
- **Catalog Restrictions:** Song recommendations and playback are limited to the iTunes catalog. Tracks unavailable within their library will not be surfaced, and other services are excluded from the initial release.

**Related Documents:**
- [MoodSync Project Overview](./01-project-overview.md)
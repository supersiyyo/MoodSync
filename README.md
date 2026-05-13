# 🎵 MoodSync AI

MoodSync is a collaborative, AI-powered DJ platform that translates your emotional "vibes" (emojis) into perfectly sequenced music sets. It uses advanced AI as a "Sonic Psychologist" to analyze collective moods and orchestrate seamless transitions via Spotify.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory and populate it with your API keys:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_meas_id

# AI Engine
EXPO_PUBLIC_AI_API_KEY=your_gemini_key

# Spotify Integration
EXPO_PUBLIC_SPOTIFY_CLIENT_ID=your_spotify_id
```

### 3. Spotify Dashboard Setup
To enable playback, you MUST register your redirect URI in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard):

1.  Find your **Redirect URI** in the app logs when you start Expo (it usually looks like `exp://192.168.x.x:8081`).
2.  Add this exact URI to your Spotify App settings under "Redirect URIs".
3.  Click **Save**.

### 4. Run the App
```bash
# Clear cache and start
npx expo start -c
```

---

## 🧠 Core Features

- **Sonic Psychologist AI**: Analyzes emoji patterns and playback history to maintain a consistent emotional flow.
- **Collaborative Queue**: Multi-user Firestore-backed queue where guests "paint" moods and the Host bridge pushes them to Spotify.
- **Ethereal Input**: A soothing, particle-based emoji selector that visualizes your "energy" as you type.
- **Auto-Self-Healing Playback**: Automatically wakes up inactive Spotify sessions and refreshes expired tokens in the background.

## 🛠️ Troubleshooting

### "Linked but not playing"
- Ensure your Spotify app is open in the background.
- Check if your Spotify account is Premium (required for SDK playback control).
- Try the **Unlink** button on the Host screen and re-connect to clear any "Ghost Sessions."

### "Redirect URI Mismatch"
- Ensure the URI shown in the terminal matches exactly what is saved in your Spotify Dashboard. Every time your local IP changes, you may need to update this.

---

## 🏗️ Project Structure
- `app/`: Expo Router file-based navigation.
- `components/`: UI components (EmojiSelector, TrackDisplay, etc.).
- `services/`: Core logic (AI Engine, Spotify API, Firebase).
- `assets/`: Icons and splash screens.

---
*Built with React Native, Expo, Firebase, and Gemini AI.*

# 500 Score Keeper

A score keeper app for the 500 card game. Runs locally without any backend—all data is stored in your browser's localStorage.

## Features

- **Start a new game** – Enter team names and start scoring
- **Existing teams** – Listed on the home screen; tap a team to view games or start a new one
- **Full scoring** – Supports all bid types: Spades, Clubs, Diamonds, Hearts, No Trumps, Misère, Open Misère
- **Round history** – Track each round with bid details and points
- **Game results** – See who won when a team reaches 500 points

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Build for production

```bash
npm run build
```

The built files are in the `dist/` folder. You can deploy these to any static host (e.g. Vercel, Netlify) or package them for the App Store / Google Play using tools like Capacitor or Cordova.

## App Store deployment

To package for mobile app stores:

1. Add [Capacitor](https://capacitorjs.com/) or a similar tool to wrap the web app
2. Run `npm run build`
3. Sync the `dist` folder to your native project
4. Build and submit through Xcode (iOS) or Android Studio (Google Play)

## 500 scoring rules (Australian)

Based on standard Australian 500 rules. First team to reach 500 points wins.

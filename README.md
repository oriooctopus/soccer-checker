# YouTube Soccer Highlights Agent

A Playwright-based agent that searches YouTube for soccer highlights without spoilers.

## Features

- Searches YouTube directly (no API required, avoiding geo-blocking)
- Filters out videos with scores in titles
- Prioritizes preferred channels (CBS Sports Golazo, Peacock Sports, etc.)
- Returns spoiler-free highlight videos

## Installation

```bash
npm install
npx playwright install
```

## Usage

### Basic Search
```javascript
const YouTubeSearchAgent = require('./youtube-agent');

const agent = new YouTubeSearchAgent();

// Search for team highlights
const results = await agent.searchSoccerHighlights('Arsenal');

// Search for specific match
const results = await agent.searchSoccerHighlights('Arsenal', 'Chelsea', 'Premier League');
```

### Run Example
```bash
node example.js
```

## API

### `searchSoccerHighlights(team1, team2, league)`
- `team1`: Primary team name (required)
- `team2`: Opponent team name (optional)
- `league`: League/competition name (optional)

Returns array of video objects with:
- `title`: Video title
- `channel`: Channel name
- `url`: YouTube URL
- `duration`: Video duration
- `isPreferred`: Boolean indicating if from preferred channel

### `searchHighlights(query, maxResults)`
- `query`: Search query string
- `maxResults`: Maximum number of results (default: 20)

## Preferred Channels

- CBS Sports Golazo
- Peacock Sports
- ESPN FC
- Sky Sports Football
- COPA90
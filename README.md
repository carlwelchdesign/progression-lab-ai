# Progression Lab AI

**Progression Lab AI** is an AI-assisted harmony exploration tool that generates chord continuations, full progressions, and musical structure ideas based on a few starting chords.

The app also visualizes suggested voicings on **piano and guitar**, making it useful for musicians, producers, and songwriters.

## Features

* AI-generated chord continuation suggestions
* Full chord progression ideas
* Song structure suggestions (verse / chorus / bridge)
* Piano voicing visualization
* Guitar chord diagrams
* Support for musical modes and scales
* Genre-aware harmony generation

## Tech Stack

* **Next.js**
* **TypeScript**
* **OpenAI API**
* **piano-chart**
* **svguitar**

## Example Workflow

1. Enter seed chords
2. Choose a mode or scale
3. Select a genre and mood
4. Generate harmonic ideas

The system returns:

* next chord suggestions
* complete progression ideas
* song structure guidance
* playable voicings for piano and guitar

## Running Locally

```bash
git clone https://github.com/carlwelchdesign/progression-lab-ai
cd progression-lab-ai
make install
make dev
```

Create a `.env.local` file:

```
OPENAI_API_KEY=your_key_here
```

Then visit:

```
http://localhost:3000
```

## Command Summary
| Command           | Purpose                 |
| ----------------- | ----------------------- |
| `make install`    | Install dependencies    |
| `make dev`        | Run local dev server    |
| `make build`      | Build production bundle |
| `make start`      | Run production server   |
| `make docker-dev` | Run with Docker         |
| `make clean`      | Clean build files       |


## Future Improvements

* MIDI playback of generated chords
* Audio preview of voicings
* Voice leading optimization
* Progression export to MIDI / DAW
* Save and share progressions

## Architecture Overview

Progression Lab AI is built as a modern full-stack TypeScript application using the Next.js App Router. The architecture is intentionally simple and modular, separating UI, API integration, and visualization components.

### High Level Flow

1. User enters seed chords and musical parameters (mode, genre, mood).
2. The frontend sends a request to the API route `/api/chord-suggestions`.
3. The API route calls the OpenAI Responses API with a strict JSON schema.
4. The AI returns structured harmony suggestions.
5. The UI renders the results and visualizes the voicings on piano and guitar.

### System Diagram

```
User Input (React UI)
        │
        ▼
Next.js Page (app/page.tsx)
        │
        ▼
API Route
/api/chord-suggestions
        │
        ▼
OpenAI Responses API
(JSON schema structured output)
        │
        ▼
Parsed Harmony Data
        │
        ▼
UI Components
├─ ChordSuggestions
├─ PianoChordDiagram
└─ GuitarChordDiagram
```

### Key Components

**Frontend**

* `app/page.tsx`
  Main UI for entering chords and displaying results.

* `components/PianoChordDiagram.tsx`
  Renders piano voicings using the `piano-chart` library.

* `components/GuitarChordDiagram.tsx`
  Renders guitar chord diagrams using `svguitar`.

* `components/ChordSuggestions.tsx`
  Displays generated chord ideas and explanations.

**Backend**

* `app/api/chord-suggestions/route.ts`
  Next.js API route responsible for calling the OpenAI API and validating responses against a JSON schema.

### AI Integration

The application uses the **OpenAI Responses API** with a strict JSON schema to ensure consistent structured outputs.

The schema guarantees the AI returns:

* chord suggestions
* playable piano voicings
* guitar chord diagrams
* progression ideas
* song structure suggestions

This approach avoids brittle prompt parsing and makes the AI responses fully type-safe.

### Visualization Libraries

* **piano-chart** – interactive piano keyboard visualization
* **svguitar** – SVG-based guitar chord diagrams

### Tech Stack

* Next.js (App Router)
* TypeScript
* OpenAI API
* Yarn
* Docker
* Makefile-based developer tooling

## Author

Carl Welch
Senior Product Engineer

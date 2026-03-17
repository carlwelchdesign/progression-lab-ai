# Progression Lab AI

**Progression Lab AI** is an AI-assisted harmony exploration tool that generates chord continuations, full progressions, and musical structure ideas based on a few starting chords.

The app also visualizes suggested voicings on **piano and guitar**, making it useful for musicians, producers, and songwriters.

<img width="1220" height="560" alt="image" src="https://github.com/user-attachments/assets/504bbeda-646c-4620-bd18-158be6b9ff3c" />

## Features

* AI-generated chord continuation suggestions
* Full chord progression ideas
* Song structure suggestions (verse / chorus / bridge)
* Piano voicing visualization
* Guitar chord diagrams
* Support for musical modes and scales
* Genre-aware harmony generation
* Audio playback of chord voicings using Tone.js

<img width="1196" height="1199" alt="image" src="https://github.com/user-attachments/assets/939b31a5-1d79-407e-94b6-764e708cb45e" />
<img width="1215" height="1254" alt="image" src="https://github.com/user-attachments/assets/5bf1697b-b886-439a-bbe0-724fee98e8f9" />

## Tech Stack

* **Next.js**
* **React**
* **TypeScript**
* **OpenAI API**
* **Tone.js** — Web audio synthesis and playback
* **piano-chart** — Interactive piano keyboard visualization
* **svguitar** — Guitar chord diagram rendering
* **Material UI** — Component library and theming

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
OPENAI_MODEL=gpt-5.4
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/progression_lab
AUTH_SECRET=replace_with_a_long_random_string
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

* Advanced voice leading optimization
* Progression export to MIDI / DAW
* Save and share progressions
* Chord progression templates
* Custom tuning support

## Authentication

The app now includes a simple cookie-based auth system:

* `POST /api/auth/register`
* `POST /api/auth/login`
* `POST /api/auth/logout`
* `GET /api/auth/me`

Progression CRUD routes are user-scoped and require authentication.

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

## Design Decisions

Several architectural decisions were made to keep the system predictable, maintainable, and useful for real musicians.

### Structured AI Output

Instead of parsing free-form text from the AI model, the application uses the OpenAI **Responses API with a strict JSON schema**.

This guarantees that responses always match the expected structure.

Benefits:

* Eliminates fragile text parsing
* Ensures type-safe responses
* Makes UI rendering deterministic
* Simplifies error handling

Example schema fields returned by the AI:

* `nextChordSuggestions`
* `pianoVoicing`
* `guitarVoicing`
* `progressionIdeas`
* `structureSuggestions`

Using structured outputs allows the AI to behave more like a typed API than a chatbot.

---

### Musical Voicing Visualization

Chord suggestions are accompanied by **instrument-specific visualizations**.

This makes the system practical for musicians instead of purely theoretical.

Two visualization libraries are used:

* `piano-chart` for keyboard diagrams
* `svguitar` for guitar chord diagrams

The AI returns structured voicings that map directly into these libraries.

Example:

```json id="czn5r4"
"pianoVoicing": {
  "leftHand": ["F2", "C3"],
  "rightHand": ["A3", "E4", "G4", "C5"]
}
```

---

### Separation of Concerns

The application separates responsibilities into three layers:

**UI Layer**

Handles user interaction and rendering.

**API Layer**

Handles communication with the OpenAI API and schema validation.

**Visualization Layer**

Handles rendering instrument diagrams.

This keeps the AI integration isolated from UI components.

---

### Deterministic Rendering

Because the AI output follows a strict schema, the UI can safely assume:

* all required fields exist
* types match expectations
* optional values are explicit (`null`)

This eliminates many runtime edge cases.

---

### Developer Experience

Developer tooling is intentionally simple.

The project includes:

* `Makefile` commands for common workflows
* Docker support for reproducible environments
* Yarn for dependency management
* TypeScript for strong typing across the stack

This keeps onboarding fast and commands consistent.

---

### Future Extensions

The current architecture allows for several natural extensions:

* MIDI playback of generated chords
* Voice-leading optimization between suggestions
* Export to MIDI / DAW formats
* Saving and sharing progressions
* Training the model on genre-specific harmonic datasets

## Author

**Carl Welch:** Senior Product Engineer

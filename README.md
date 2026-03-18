# Progression Lab AI

Progression Lab AI is an AI-assisted harmony exploration tool for generating chord ideas, progression options, and arrangement structure from a few starting chords.

It includes playable voicings, piano and guitar visualizations, account-based progression saving, and public progression sharing.

<img width="1220" height="560" alt="image" src="https://github.com/user-attachments/assets/504bbeda-646c-4620-bd18-158be6b9ff3c" />

## Features

* AI-generated next chord suggestions
* Full progression ideas with mood/feel guidance
* Song structure suggestions (verse/chorus/bridge)
* Playable audio for individual chords and full progressions (Tone.js)
* Piano voicing diagrams
* Guitar chord diagrams
* User accounts (register/login/logout)
* Save, list, and delete personal progressions
* Public sharing via share links
* Load saved/shared progressions back into the main lab

<img width="1196" height="1199" alt="image" src="https://github.com/user-attachments/assets/939b31a5-1d79-407e-94b6-764e708cb45e" />
<img width="1215" height="1254" alt="image" src="https://github.com/user-attachments/assets/5bf1697b-b886-439a-bbe0-724fee98e8f9" />

## Tech Stack

* [Next.js 15 (App Router)](https://nextjs.org/docs/app)
* [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* [Material UI](https://mui.com/)
* [OpenAI API](https://platform.openai.com/docs)
* [Prisma ORM](https://www.prisma.io/docs) + [PostgreSQL](https://www.postgresql.org/docs/)
* [Tone.js](https://tonejs.github.io/)
* [piano-chart](https://www.npmjs.com/package/piano-chart)
* [svguitar](https://www.npmjs.com/package/svguitar)

## Local Development

### 1) Clone and install

```bash
git clone git@github.com:carlwelchdesign/progression-lab.git
cd progression-lab
make install
```

### 2) Configure environment

```bash
cp .env.local.example .env.local
```

Required values in `.env.local`:

```dotenv
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/progression_lab
AUTH_SECRET=replace_with_a_long_random_string
```

Generate an auth secret with:

```bash
openssl rand -base64 32
```

### 3) Start local Postgres (Docker)

```bash
make docker-up
```

### 4) Apply schema and run app

```bash
yarn db:push
make dev
```

Open `http://localhost:3000`.

## API Overview

### AI route

* `POST /api/chord-suggestions`

### Auth routes

* `POST /api/auth/register`
* `POST /api/auth/login`
* `POST /api/auth/logout`
* `GET /api/auth/me`

### Progression routes (authenticated)

* `GET /api/progressions`
* `POST /api/progressions`
* `GET /api/progressions/[id]`
* `PUT /api/progressions/[id]`
* `DELETE /api/progressions/[id]`

### Shared route (public)

* `GET /api/shared/[shareId]`

## Data Model (Prisma)

```ts
type User = {
	id: string;
	email: string;
	name: string | null;
	passwordHash: string | null;
	createdAt: Date;
	updatedAt: Date;
};

type Progression = {
	id: string;
	shareId: string;
	userId: string;
	title: string;
	chords: unknown; // Prisma Json
	pianoVoicings: unknown | null; // Prisma Json
	feel: string | null;
	scale: string | null;
	notes: string | null;
	tags: string[];
	isPublic: boolean;
	createdAt: Date;
	updatedAt: Date;
};
```

## TODOs

* Add edit flow for saved progressions
* Add password reset and email verification
* Add pagination and filtering for My Progressions
* Add migration files under `prisma/migrations` for production deploys
* Add richer playback controls (tempo, loop, stop)
* Add export options (MIDI / DAW-friendly formats)

## Author

Carl Welch

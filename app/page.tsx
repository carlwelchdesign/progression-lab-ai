'use client';

import { useState } from 'react';

import GuitarChordDiagram from '../components/GuitarChordDiagram';
import PianoChordDiagram from '../components/PianoChordDiagram';
import type {
  Adventurousness,
  ChordSuggestionResponse,
  InstrumentPreference
} from '../lib/types';

const MODE_OPTIONS = [
  { value: 'ionian', label: 'Ionian (Major)' },
  { value: 'dorian', label: 'Dorian' },
  { value: 'phrygian', label: 'Phrygian' },
  { value: 'lydian', label: 'Lydian' },
  { value: 'mixolydian', label: 'Mixolydian' },
  { value: 'aeolian', label: 'Aeolian (Natural Minor)' },
  { value: 'locrian', label: 'Locrian' },
  { value: 'major pentatonic', label: 'Major Pentatonic' },
  { value: 'minor pentatonic', label: 'Minor Pentatonic' },
  { value: 'harmonic minor', label: 'Harmonic Minor' },
  { value: 'melodic minor', label: 'Melodic Minor' },
  { value: 'blues', label: 'Blues' },
  { value: 'whole tone', label: 'Whole Tone' },
  { value: 'diminished', label: 'Diminished' },
  { value: 'chromatic', label: 'Chromatic' },
  { value: 'custom', label: 'Custom' },
];

const GENRE_OPTIONS = [
  { value: 'house', label: 'House' },
  { value: 'piano house', label: 'Piano House' },
  { value: 'deep house', label: 'Deep House' },
  { value: 'disco house', label: 'Disco House' },
  { value: 'tech house', label: 'Tech House' },
  { value: 'funk / disco', label: 'Funk / Disco' },
  { value: 'pop', label: 'Pop' },
  { value: 'indie pop', label: 'Indie Pop' },
  { value: 'r&b / neo soul', label: 'R&B / Neo Soul' },
  { value: 'jazz', label: 'Jazz' },
  { value: 'lo-fi', label: 'Lo-fi' },
  { value: 'ambient', label: 'Ambient' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'edm', label: 'EDM' },
  { value: 'afro house', label: 'Afro House' },
  { value: 'progressive house', label: 'Progressive House' },
  { value: 'hip-hop', label: 'Hip-Hop' },
  { value: 'rock', label: 'Rock' },
  { value: 'folk', label: 'Folk' },
  { value: 'custom', label: 'Custom' },
];

export default function HomePage() {
  const [seedChords, setSeedChords] = useState('Fmaj7, F#m7');
  const [mood, setMood] = useState('dreamy, emotional, uplifting');
  const [mode, setMode] = useState('lydian');
  const [customMode, setCustomMode] = useState('');
  const [genre, setGenre] = useState('piano house');
  const [customGenre, setCustomGenre] = useState('');
  const [instrument, setInstrument] = useState<InstrumentPreference>('both');
  const [adventurousness, setAdventurousness] =
    useState<Adventurousness>('balanced');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<ChordSuggestionResponse | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    const resolvedMode = mode === 'custom' ? customMode.trim() : mode;
    const resolvedGenre = genre === 'custom' ? customGenre.trim() : genre;

    if (!resolvedMode) {
      setError('Please enter a custom mode or scale.');
      setLoading(false);
      return;
    }

    if (!resolvedGenre) {
      setError('Please enter a custom genre.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/chord-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seedChords: seedChords
            .split(',')
            .map((chord) => chord.trim())
            .filter(Boolean),
          mood,
          mode: resolvedMode,
          genre: resolvedGenre,
          instrument,
          adventurousness,
        }),
      });

      if (!response.ok) {
        throw new Error('Request failed');
      }

      const json = (await response.json()) as ChordSuggestionResponse;
      setData(json);
    } catch (err) {
      console.error(err);
      setError('Could not generate suggestions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <div className="hero">
        <h1>ProgressionLab</h1>
        <p>
          Enter a few chords, a mood, and a mode. Get back progression ideas,
          structure suggestions, and simple guitar/piano diagrams.
        </p>
      </div>

      <section className="panel">
        <div className="form-grid">
          <label>
            Seed chords
            <input
              value={seedChords}
              onChange={(e) => setSeedChords(e.target.value)}
              placeholder="Fmaj7, F#m7"
            />
          </label>

          <label>
            Mood
            <input
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              placeholder="dreamy, dark, hopeful"
            />
          </label>

          <label>
            Mode / scale
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              {MODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {mode === 'custom' ? (
            <label>
              Custom mode / scale
              <input
                value={customMode}
                onChange={(e) => setCustomMode(e.target.value)}
                placeholder="Hungarian minor, altered scale, etc."
              />
            </label>
          ) : null}
          <label>
            Genre
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            >
              {GENRE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {genre === 'custom' ? (
            <label>
              Custom genre
              <input
                value={customGenre}
                onChange={(e) => setCustomGenre(e.target.value)}
                placeholder="UK garage, synthwave, bossa nova, etc."
              />
            </label>
          ) : null}

          <label>
            Instrument
            <select
              value={instrument}
              onChange={(e) =>
                setInstrument(e.target.value as InstrumentPreference)
              }
            >
              <option value="both">Both</option>
              <option value="guitar">Guitar</option>
              <option value="piano">Piano</option>
            </select>
          </label>

          <label>
            Adventurousness
            <select
              value={adventurousness}
              onChange={(e) =>
                setAdventurousness(e.target.value as Adventurousness)
              }
            >
              <option value="safe">Safe</option>
              <option value="balanced">Balanced</option>
              <option value="surprising">Surprising</option>
            </select>
          </label>
        </div>

        <button className="primary-button" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Ideas'}
        </button>

        {error ? <p className="error-text">{error}</p> : null}
      </section>

      {data ? (
        <>
          <section className="panel">
            <h2>Next chord suggestions</h2>
            <div className="cards">
              {data.nextChordSuggestions.map((item) => (
                <div
                  key={`${item.chord}-${item.functionExplanation}`}
                  className="card"
                >
                  <h3>{item.chord}</h3>
                  <p>{item.functionExplanation}</p>
                  {item.romanNumeral ? (
                    <p>
                      <strong>Roman numeral:</strong> {item.romanNumeral}
                    </p>
                  ) : null}
                  <p>
                    <strong>Tension:</strong> {item.tensionLevel}/5
                  </p>
                  <p>
                    <strong>Confidence:</strong> {item.confidence}/5
                  </p>
                  {item.voicingHint ? (
                    <p>
                      <strong>Voicing hint:</strong> {item.voicingHint}
                    </p>
                  ) : null}
                  {item.pianoVoicing ? (
                    <div>
                      <p>
                        <strong>Left hand:</strong> {item.pianoVoicing.leftHand.join(', ')}
                      </p>
                      <p>
                        <strong>Right hand:</strong> {item.pianoVoicing.rightHand.join(', ')}
                      </p>
                    </div>
                  ) : null}

                  <div className="diagram-row">
                    {item.guitarVoicing && (
                      <GuitarChordDiagram
                        title={item.guitarVoicing.title}
                        position={
                          typeof item.guitarVoicing.position === 'number' &&
                            item.guitarVoicing.position >= 1
                            ? item.guitarVoicing.position
                            : 1
                        }
                        fingers={item.guitarVoicing.fingers.map((finger) =>
                          finger.finger
                            ? [finger.string, finger.fret, finger.finger]
                            : [finger.string, finger.fret]
                        )}
                        barres={item.guitarVoicing.barres.map((barre) => ({
                          fromString: barre.fromString,
                          toString: barre.toString,
                          fret: barre.fret,
                          text: barre.text ?? undefined,
                        }))}
                      />
                    )}
                    {item.pianoVoicing ? (
                      <div style={{ width: '700px' }}>
                        <PianoChordDiagram
                          leftHand={item.pianoVoicing.leftHand}
                          rightHand={item.pianoVoicing.rightHand}
                        />
                      </div>

                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2>Progression ideas</h2>
            <div className="cards">
              {data.progressionIdeas.map((idea) => (
                <div key={idea.label} className="card">
                  <h3>{idea.label}</h3>
                  <p className="progression-line">{idea.chords.join(' → ')}</p>
                  <p>{idea.feel}</p>
                  {idea.performanceTip ? <p>{idea.performanceTip}</p> : null}
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2>Structure suggestions</h2>
            <div className="cards">
              {data.structureSuggestions.map((section) => (
                <div key={`${section.section}-${section.bars}`} className="card">
                  <h3>
                    {section.section} · {section.bars} bars
                  </h3>
                  <p>{section.harmonicIdea}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
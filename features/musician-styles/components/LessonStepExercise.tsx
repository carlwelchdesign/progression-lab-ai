import { useEffect, useMemo, useRef } from 'react';
import { Instrument } from 'piano-chart';

import { normalizeMidiNoteName } from '../services/midiService';
import type { ExerciseStep } from '../types';

type MidiConnectionState = 'unsupported' | 'idle' | 'connecting' | 'connected' | 'denied';

type LessonStepExerciseProps = {
  step: ExerciseStep;
  isMatched: boolean;
  playedNotes: string[];
  midiStatus: MidiConnectionState;
};

function getMidiStatusLabel(state: MidiConnectionState): string {
  if (state === 'unsupported') {
    return 'Web MIDI not supported in this browser';
  }

  if (state === 'connecting') {
    return 'Connecting MIDI device...';
  }

  if (state === 'connected') {
    return 'MIDI connected';
  }

  if (state === 'denied') {
    return 'MIDI permission denied or no input found';
  }

  return 'Connect a MIDI keyboard to complete this step';
}

export function LessonStepExercise({
  step,
  isMatched,
  playedNotes,
  midiStatus,
}: LessonStepExerciseProps) {
  const pianoRef = useRef<HTMLDivElement | null>(null);
  const targetNotes = useMemo(
    () => step.exercise.targetNotes.map((note) => normalizeMidiNoteName(note)),
    [step.exercise.targetNotes],
  );

  useEffect(() => {
    if (!pianoRef.current) {
      return;
    }

    pianoRef.current.innerHTML = '';

    const piano = new Instrument(pianoRef.current, {
      startOctave: 2,
      endOctave: 6,
      showNoteNames: 'always',
      keyPressStyle: 'vivid',
      vividKeyPressColor: '#2563eb',
    });

    piano.create();
    targetNotes.forEach((note) => {
      piano.keyDown(note);
    });

    return () => {
      piano.destroy();
    };
  }, [targetNotes]);

  return (
    <article className="space-y-2">
      <h3 className="text-xl font-semibold">Try It</h3>
      <p>{step.exercise.prompt}</p>
      <p className="text-sm text-gray-600">Target notes: {targetNotes.join(', ')}</p>
      <div className="rounded border bg-white p-3">
        <div ref={pianoRef} />
      </div>
      <div
        className={`rounded border p-2 text-sm ${isMatched ? 'border-green-500 bg-green-50' : ''}`}
      >
        {isMatched ? 'MIDI match detected' : 'Waiting for MIDI input'}
      </div>
      <p className="text-xs text-gray-600">{getMidiStatusLabel(midiStatus)}</p>
      {playedNotes.length > 0 ? (
        <p className="text-xs text-gray-600">Detected notes: {playedNotes.join(', ')}</p>
      ) : null}
    </article>
  );
}

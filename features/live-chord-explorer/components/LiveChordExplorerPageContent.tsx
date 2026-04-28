'use client';

import { Box, Paper, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMidiInput } from '../hooks/useMidiInput';
import { useActiveNotes } from '../hooks/useActiveNotes';
import { detectChord } from '../lib/detectChord';
import { inferKeyCenter } from '../lib/inferKeyCenter';
import { generateChordSuggestions } from '../lib/generateChordSuggestions';
import PianoKeyboard from './PianoKeyboard';
import ChordIntelligencePanel from './ChordIntelligencePanel';
import MidiStatusIndicator from './MidiStatusIndicator';
import SuggestionRow from './SuggestionRow';
import SuggestionDetailPanel from './SuggestionDetailPanel';
import ChordHistoryBar from './ChordHistoryBar';
import CircleOfFifthsCanvas from './CircleOfFifthsCanvas';
import { getActiveInsight } from '../lib/generateHarmonicInsights';
import type { ChordSuggestion, DetectedChord, SuggestionCategory } from '../types';

const MAX_CHORD_HISTORY = 8;
const ANCHOR_COMMIT_DELAY_MS = 150;

type CategoryFilter = SuggestionCategory | 'all';

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all: 'Best',
  diatonic: 'Diatonic',
  resolution: 'Resolution',
  tension: 'Tension',
  color: 'Color',
  jazzy: 'Jazz',
};

const CATEGORY_ORDER: CategoryFilter[] = [
  'all',
  'diatonic',
  'resolution',
  'tension',
  'color',
  'jazzy',
];

export default function LiveChordExplorerPageContent() {
  const { status, inputs } = useMidiInput();
  const { activeNotes, pitchClasses, lowestMidiNote } = useActiveNotes(inputs);
  const [manualKeyCenter, setManualKeyCenter] = useState<string | null>(null);
  const [chordHistory, setChordHistory] = useState<string[]>([]);
  const [harmonicAnchor, setHarmonicAnchor] = useState<DetectedChord>(null);
  const [isAnchorLocked, setIsAnchorLocked] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<ChordSuggestion | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const liveDetectedChord = useMemo(
    () => detectChord(pitchClasses, lowestMidiNote ?? undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pitchClasses.join(','), lowestMidiNote],
  );

  // Debounced anchor commit — only fires once the chord is stable for ANCHOR_COMMIT_DELAY_MS.
  // Releasing keys (liveDetectedChord → null) cancels the pending timer.
  useEffect(() => {
    if (!liveDetectedChord || isAnchorLocked) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      setHarmonicAnchor(liveDetectedChord); // eslint-disable-line react-hooks/exhaustive-deps
      setChordHistory((prev) => {
        if (prev[prev.length - 1] === liveDetectedChord.name) return prev;
        const next = [...prev, liveDetectedChord.name];
        return next.length > MAX_CHORD_HISTORY ? next.slice(-MAX_CHORD_HISTORY) : next;
      });
    }, ANCHOR_COMMIT_DELAY_MS);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveDetectedChord?.name, isAnchorLocked]);

  const inferredKey = useMemo(() => {
    if (manualKeyCenter) return { key: manualKeyCenter, mode: 'major' as const, confidence: 1 };
    return inferKeyCenter(chordHistory);
  }, [chordHistory, manualKeyCenter]);

  const suggestions = useMemo(
    () => generateChordSuggestions(harmonicAnchor, inferredKey.key),
    [harmonicAnchor, inferredKey.key],
  );

  const activeInsight = useMemo(
    () =>
      getActiveInsight(
        harmonicAnchor,
        selectedSuggestion,
        liveDetectedChord,
        inferredKey.key,
        suggestions,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [harmonicAnchor?.name, selectedSuggestion?.name, liveDetectedChord?.name, inferredKey.key],
  );

  const filteredSuggestions = useMemo(() => {
    if (activeCategory === 'all') return suggestions.slice(0, 14);
    return suggestions.filter((s) => s.category === activeCategory).slice(0, 10);
  }, [suggestions, activeCategory]);

  // Auto-select first suggestion whenever the harmonic anchor changes
  useEffect(() => {
    setSelectedSuggestion(filteredSuggestions[0] ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [harmonicAnchor?.name]);

  // Keep selection valid when the category filter changes
  useEffect(() => {
    setSelectedSuggestion((prev) => {
      if (!prev) return filteredSuggestions[0] ?? null;
      const stillVisible = filteredSuggestions.find((s) => s.name === prev.name);
      return stillVisible ?? filteredSuggestions[0] ?? null;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, suggestions]);

  // Auto-highlight the suggestion that matches what the user is currently playing
  useEffect(() => {
    if (!liveDetectedChord) return;
    const match = filteredSuggestions.find((s) => s.name === liveDetectedChord.name);
    if (match) setSelectedSuggestion(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveDetectedChord?.name]);

  const activeNoteNames = useMemo(
    () => activeNotes.map((n) => n.noteNameWithOctave),
    [activeNotes],
  );

  const handleClearAnchor = useCallback(() => {
    setHarmonicAnchor(null);
    setIsAnchorLocked(false);
    setManualKeyCenter(null);
    setChordHistory([]);
    setSelectedSuggestion(null);
  }, []);

  const handleToggleLock = useCallback(() => setIsAnchorLocked((prev) => !prev), []);

  const handleListKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!filteredSuggestions.length) return;
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      setSelectedSuggestion((prev) => {
        const currentIndex = prev ? filteredSuggestions.findIndex((s) => s.name === prev.name) : -1;
        const nextIndex =
          e.key === 'ArrowDown'
            ? Math.min(currentIndex + 1, filteredSuggestions.length - 1)
            : Math.max(currentIndex - 1, 0);
        return filteredSuggestions[nextIndex];
      });
    },
    [filteredSuggestions],
  );

  const isNoMidi = status === 'unavailable' || status === 'denied';

  return (
    <Box
      sx={{
        // Fill the viewport below the fixed AppBar (AppWrapper adds pt:9 = 72px on md+)
        height: { xs: 'auto', md: 'calc(100vh - 72px)' },
        display: 'flex',
        flexDirection: 'column',
        overflow: { xs: 'auto', md: 'hidden' },
        px: { xs: 2, md: 3 },
        pt: { xs: 2, md: 1.5 },
        pb: { xs: 2, md: 1 },
        gap: 1.5,
      }}
    >
      {/* ── Compact header ── */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
        sx={{ flexShrink: 0 }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}
          >
            Live Chord Explorer
          </Typography>
          {inferredKey.key && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Key of {inferredKey.key} {inferredKey.mode}
            </Typography>
          )}
        </Box>
        <MidiStatusIndicator status={status} />
      </Stack>

      {/* ── No-MIDI fallback ── */}
      {isNoMidi && (
        <Paper
          variant="outlined"
          sx={{
            p: 4,
            textAlign: 'center',
            borderStyle: 'dashed',
            borderColor: 'divider',
            background: 'transparent',
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary' }}>
            {status === 'denied'
              ? 'MIDI access was denied'
              : 'Web MIDI is not available in this browser'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
            {status === 'denied'
              ? 'Please reload the page and allow MIDI access when prompted.'
              : 'Try Chrome or Edge on a desktop. Safari and Firefox do not support the Web MIDI API.'}
          </Typography>
        </Paper>
      )}

      {/* ── Main workspace (12-column cockpit) ── */}
      {!isNoMidi && (
        <Box
          sx={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(12, minmax(0, 1fr))' },
            gap: 2,
            overflow: 'hidden',
            minHeight: 0,
          }}
        >
          {/* ── LEFT: Piano + Anchor + Inspector ── */}
          <Box
            sx={{
              gridColumn: { xs: '1 / -1', md: 'span 7' },
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            {/* Hero piano */}
            <Paper
              variant="outlined"
              sx={{
                px: { xs: 1, md: 0.75 },
                pt: { xs: 1.25, md: 1 },
                pb: { xs: 0.75, md: 0.75 },
                background: 'rgba(255,255,255,0.01)',
                borderColor: 'divider',
                flexShrink: 0,
              }}
            >
              {status === 'connecting' && activeNotes.length === 0 && (
                <Typography
                  variant="caption"
                  sx={{ display: 'block', textAlign: 'center', color: 'text.disabled', mb: 1 }}
                >
                  Connect a MIDI keyboard to begin
                </Typography>
              )}
              <PianoKeyboard
                activeNotes={activeNoteNames}
                startOctave={2}
                endOctave={7}
                height={{ xs: 118, md: 150 }}
              />
            </Paper>

            {/* Harmonic anchor (compact variant) */}
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 1.5, md: 2 },
                height: { xs: 'auto', md: 206 },
                borderColor: 'divider',
                background: 'rgba(255,255,255,0.01)',
                flexShrink: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <ChordIntelligencePanel
                  harmonicAnchor={harmonicAnchor}
                  liveDetectedChord={liveDetectedChord}
                  keyCenter={inferredKey.key}
                  isAnchorLocked={isAnchorLocked}
                  compact
                  onSetKeyCenter={setManualKeyCenter}
                  onClearAnchor={handleClearAnchor}
                  onToggleLock={handleToggleLock}
                />
              </Box>
              <Box
                sx={{
                  mt: 1,
                  height: 22,
                  overflow: 'hidden',
                  visibility: chordHistory.length > 1 ? 'visible' : 'hidden',
                }}
              >
                {chordHistory.length > 1 ? (
                  <ChordHistoryBar
                    history={chordHistory}
                    currentAnchor={harmonicAnchor?.name ?? null}
                  />
                ) : null}
              </Box>
            </Paper>

            {/* Circle of Fifths — fills remaining left-panel height */}
            <CircleOfFifthsCanvas
              activeNotes={activeNotes}
              liveDetectedChord={liveDetectedChord}
              harmonicAnchor={harmonicAnchor}
              selectedSuggestion={selectedSuggestion}
              suggestions={suggestions}
              keyCenter={inferredKey.key}
              insight={activeInsight}
            />
          </Box>

          {/* ── RIGHT: Suggestion browser ── */}
          <Box
            sx={{
              gridColumn: { xs: '1 / -1', md: 'span 5' },
              display: 'flex',
              flexDirection: 'column',
              minHeight: { xs: 400, md: 0 },
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            {harmonicAnchor ? (
              <>
                {/* Selected suggestion detail */}
                <Box
                  sx={{
                    flexShrink: 0,
                    height: { xs: 'auto', md: 360 },
                    minHeight: { xs: 0, md: 0 },
                    overflow: 'hidden',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <SuggestionDetailPanel
                    suggestion={selectedSuggestion}
                    harmonicAnchor={harmonicAnchor}
                  />
                </Box>

                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{
                    flexShrink: 0,
                    px: 1.5,
                    pt: 1,
                    pb: 0.75,
                  }}
                >
                  <Typography
                    variant="overline"
                    sx={{
                      color: 'text.disabled',
                      fontSize: '0.6rem',
                      letterSpacing: '0.1em',
                      lineHeight: 1,
                    }}
                  >
                    Chord options
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.disabled', fontSize: '0.65rem' }}
                  >
                    {filteredSuggestions.length} shown
                  </Typography>
                </Stack>

                {/* Category filter tabs */}
                <Tabs
                  value={activeCategory}
                  onChange={(_, v: CategoryFilter) => setActiveCategory(v)}
                  variant="scrollable"
                  scrollButtons={false}
                  sx={{
                    flexShrink: 0,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    minHeight: 34,
                    '& .MuiTab-root': {
                      minHeight: 34,
                      py: 0,
                      fontSize: '0.7rem',
                      minWidth: 'unset',
                      px: 1.25,
                      letterSpacing: '0.02em',
                    },
                    '& .MuiTabs-indicator': { height: 2 },
                  }}
                >
                  {CATEGORY_ORDER.map((cat) => (
                    <Tab key={cat} value={cat} label={CATEGORY_LABELS[cat]} />
                  ))}
                </Tabs>

                {/* Compact suggestion list — keyboard-navigable, scrollable */}
                <Box
                  tabIndex={0}
                  onKeyDown={handleListKeyDown}
                  sx={{
                    flex: 1,
                    overflow: 'auto',
                    minHeight: 0,
                    outline: 'none',
                    '&:focus-visible': {
                      outline: '2px solid',
                      outlineColor: 'primary.main',
                      outlineOffset: -2,
                    },
                  }}
                >
                  {filteredSuggestions.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center', color: 'text.disabled' }}>
                      <Typography variant="caption">No suggestions in this category</Typography>
                    </Box>
                  ) : (
                    filteredSuggestions.map((s) => (
                      <SuggestionRow
                        key={`${s.category}-${s.name}`}
                        suggestion={s}
                        isSelected={selectedSuggestion?.name === s.name}
                        isBeingPlayed={liveDetectedChord?.name === s.name}
                        onClick={() => setSelectedSuggestion(s)}
                      />
                    ))
                  )}
                </Box>
              </>
            ) : (
              /* Empty state when no anchor has been captured yet */
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 3,
                  textAlign: 'center',
                  color: 'text.disabled',
                }}
              >
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Harmonic suggestions appear here
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.6 }}>
                    Play and hold a chord to get started
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}

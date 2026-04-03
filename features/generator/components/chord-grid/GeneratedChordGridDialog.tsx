'use client';

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import { alpha, useTheme } from '@mui/material/styles';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { playChordPattern, stopAllAudio } from '../../../../domain/audio/audio';
import { CHORD_OPTIONS as _CHORD_OPTIONS } from '../../../../lib/formOptions';
import PlaybackSettingsButton from '../playback/PlaybackSettingsButton';
import SequencerTrack from './SequencerTrack';
import SaveArrangementDialog from '../../../arrangements/components/SaveArrangementDialog';
import TransportBar from './TransportBar';
import ChordPadGrid from './ChordPadGrid';
import VocalTrackLane from './VocalTrackLane';
import MobileClipControls from './MobileClipControls';
import PadEditPanel from './PadEditPanel';
import CircleOfFifthsAccordion from './CircleOfFifthsAccordion';
import { useAuth } from '../../../../components/providers/AuthProvider';
import { useAuthModal } from '../../../../components/providers/AuthModalProvider';
import { stopGlobalPlayback } from '../../hooks/usePlaybackToggle';
import { useSequencerEngine } from '../../hooks/useSequencerEngine';
import { useArrangementTimeline } from '../../hooks/useArrangementTimeline';
import { usePadEdit } from '../../hooks/usePadEdit';
import { usePadInteraction } from '../../hooks/usePadInteraction';
import { useChordGridKeyboard } from '../../hooks/useChordGridKeyboard';
import { useVocalTrack } from '../../hooks/useVocalTrack';
import { trackClientAnalyticsEvent } from '../../../../lib/observability/clientAnalytics';
import { LOOP_LENGTH_OPTIONS, RECORDING_LEAD_IN_BARS, STEPS_PER_BEAT } from './chordGridTypes';
import { generateId, getBeatsPerBar } from './chordGridUtils';
import type { GeneratedChordGridDialogProps, RecordingMode } from './chordGridTypes';
import type { ArrangementPlaybackSnapshot, VocalFeatureEntitlements } from '../../../../lib/types';

export default function GeneratedChordGridDialog({
  open,
  onClose,
  tempoBpm,
  settings,
  onSettingsChange,
  onTempoBpmChange,
  chords,
  pendingLoad = null,
  onSaveSuccess,
  vocalEntitlements,
}: GeneratedChordGridDialogProps) {
  const { t } = useTranslation('generator');
  const { isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();
  const theme = useTheme();
  const { appColors } = theme.palette;
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDesktopKeyboardUi = useMediaQuery('(hover: hover) and (pointer: fine)');

  const {
    playbackStyle,
    attack,
    decay,
    padVelocity,
    humanize,
    gate,
    inversionRegister,
    instrument,
    octaveShift,
    padPattern,
    timeSignature,
    padLatchMode,
    metronomeEnabled,
    metronomeVolume,
    metronomeSource,
    metronomeDrumPath,
  } = settings;

  // ── Dialog-level state ──────────────────────────────────────────────────────
  const [isLoopEnabled, setIsLoopEnabled] = useState(true);
  const [loopLengthBars, setLoopLengthBars] = useState<(typeof LOOP_LENGTH_OPTIONS)[number]>(1);
  const [recordingMode, setRecordingMode] = useState<RecordingMode>('continuous');
  const [singleShotCursorStep, setSingleShotCursorStep] = useState<number | null>(null);
  const [trackScrollRequestKey, setTrackScrollRequestKey] = useState(0);
  const [saveArrangementDialogOpen, setSaveArrangementDialogOpen] = useState(false);
  const [showVocalUpgradePrompt, setShowVocalUpgradePrompt] = useState(false);

  const beatsPerBar = useMemo(() => getBeatsPerBar(timeSignature), [timeSignature]);
  const stepsPerBar = beatsPerBar * STEPS_PER_BEAT;
  const totalSteps = stepsPerBar * loopLengthBars;

  const resolvedVocalEntitlements: VocalFeatureEntitlements = vocalEntitlements ?? {
    canUseVocalTrackRecording: true,
    maxVocalTakesPerArrangement: 1,
  };

  const vocal$ = useVocalTrack({
    tempoBpm,
    totalSteps,
  });

  const isVocalFeatureEnabled = resolvedVocalEntitlements.canUseVocalTrackRecording;

  const vocalTakeLimitReached =
    resolvedVocalEntitlements.maxVocalTakesPerArrangement !== null &&
    vocal$.takes.length >= resolvedVocalEntitlements.maxVocalTakesPerArrangement;

  // ── Audio playback helper (passed down as callback — DIP) ───────────────────
  const playEntry = (
    entry: { key: string; leftHand: string[]; rightHand: string[] },
    options?: {
      stopBefore?: boolean;
      loop?: boolean;
      useCurrentPadPattern?: boolean;
      velocity?: number;
    },
  ) => {
    if (options?.stopBefore !== false) {
      stopGlobalPlayback();
    }

    void playChordPattern({
      leftHand: entry.leftHand,
      rightHand: entry.rightHand,
      padPattern: options?.useCurrentPadPattern === false ? 'single' : padPattern,
      timeSignature,
      loop: options?.loop ?? false,
      tempoBpm,
      playbackStyle,
      attack,
      decay,
      velocity: options?.velocity ?? padVelocity,
      humanize,
      gate,
      inversionRegister,
      instrument,
      octaveShift,
    });
  };

  // ── Hooks ───────────────────────────────────────────────────────────────────
  const timeline$ = useArrangementTimeline({
    totalSteps,
    stepsPerBar,
    loopLengthBars,
    padVelocity,
  });

  const engine$ = useSequencerEngine({
    open,
    tempoBpm,
    beatsPerBar,
    stepsPerBar,
    totalSteps,
    isLoopEnabled,
    recordingMode,
    metronomeEnabled,
    metronomeVolume,
    metronomeSource,
    metronomeDrumPath,
    timeSignature,
    padVelocity,
    eventsByStepRef: timeline$.eventsByStepRef,
    onPlayEntry: playEntry,
    onCountInBegin: () => setTrackScrollRequestKey((k) => k + 1),
    onLoopRestart: () => {
      if (!isVocalFeatureEnabled) {
        return;
      }

      void vocal$.startVocalPlayback(0);
    },
    onStop: () => {
      vocal$.stopVocalPlayback();
      vocal$.stopVocalRecording();
    },
  });

  const edit$ = usePadEdit({ chords, open });

  const interaction$ = usePadInteraction({
    open,
    isSequencerPlaying: engine$.isSequencerPlaying,
    isRecording: engine$.isRecording,
    padLatchMode,
    onPlayEntry: playEntry,
  });

  // ── Cross-hook helpers built at the composition root ────────────────────────

  /** Insert a chord at a precise step only when not playing/counting-in. */
  const insertManualEventAtStep = (
    entry: Parameters<typeof timeline$.insertArrangementEvent>[0],
    stepIndex: number,
    options?: { durationSteps?: number },
  ) => {
    if (engine$.isSequencerPlaying || engine$.isCountInActive) {
      return false;
    }

    timeline$.insertArrangementEvent(entry, stepIndex, options);
    return true;
  };

  /** Full pad-press handler — orchestrates all concerns. */
  const onPadPress = (entry: (typeof edit$.editableChords)[number]) => {
    if (interaction$.mobileTimelineInsertPadKey) {
      interaction$.setMobileTimelineInsertPadKey(null);
    }

    if (!engine$.hasInitializedAudio) {
      engine$.setHasInitializedAudio(true);
    }

    if (edit$.isEditMode) {
      edit$.setEditingPadKey(entry.key);
    } else {
      edit$.setCofFocusPadKey((prev) => (prev === entry.key ? null : entry.key));
    }

    interaction$.triggerPad(entry);

    if (recordingMode === 'single-shot') {
      if (singleShotCursorStep !== null) {
        insertManualEventAtStep(entry, singleShotCursorStep, { durationSteps: 1 });
      }

      return;
    }

    if (engine$.isRecording) {
      const stepIndex = Math.min(engine$.currentStepRef.current, Math.max(0, totalSteps - 1));
      timeline$.insertArrangementEvent(entry, stepIndex);
    }
  };

  const clearRecordedEvents = () => {
    timeline$.clearArrangementEvents();
    engine$.resetStep();
  };

  const handleLaneClickStep = (stepIndex: number) => {
    if (interaction$.mobileTimelineInsertPadKey) {
      const entry = edit$.editableChords.find(
        (c) => c.key === interaction$.mobileTimelineInsertPadKey,
      );
      interaction$.setMobileTimelineInsertPadKey(null);
      if (!entry) return;
      if (!engine$.hasInitializedAudio) engine$.setHasInitializedAudio(true);
      interaction$.triggerPad(entry);
      insertManualEventAtStep(entry, stepIndex, { durationSteps: 1 });
      return;
    }

    if (recordingMode !== 'single-shot' || engine$.isSequencerPlaying || engine$.isCountInActive) {
      return;
    }

    setSingleShotCursorStep(stepIndex);
  };

  // ── Keyboard shortcuts hook ─────────────────────────────────────────────────
  const { hasDetectedHardwareKeyboardInput } = useChordGridKeyboard({
    open,
    saveArrangementDialogOpen,
    isDesktopKeyboardUi,
    selectedStepIndex: timeline$.selectedStepIndex,
    setSelectedStepIndex: timeline$.setSelectedStepIndex,
    padHotkeyMap: edit$.padHotkeyMap,
    onPlayToggle: engine$.handleSequencerPlayToggle,
    onRecordToggle: engine$.handleRecordToggle,
    onDeleteClip: timeline$.deleteSelectedClip,
    onNudgeClip: timeline$.nudgeSelectedClip,
    onPadPress,
  });

  const showKeyboardHints = isDesktopKeyboardUi || hasDetectedHardwareKeyboardInput;

  // ── Pending arrangement load (seeds timeline + engine from saved data) ───────
  useEffect(() => {
    if (!pendingLoad) {
      return;
    }

    const clampedBars = Math.max(
      1,
      Math.min(
        8,
        LOOP_LENGTH_OPTIONS.includes(
          pendingLoad.loopLengthBars as (typeof LOOP_LENGTH_OPTIONS)[number],
        )
          ? (pendingLoad.loopLengthBars as (typeof LOOP_LENGTH_OPTIONS)[number])
          : 1,
      ),
    ) as (typeof LOOP_LENGTH_OPTIONS)[number];

    timeline$.setArrangementEvents(
      pendingLoad.events.map((event) => ({ ...event, id: event.id ?? generateId() })),
    );
    timeline$.setSelectedStepIndex(null);
    setLoopLengthBars(clampedBars);
    engine$.resetEngineState();
    setSingleShotCursorStep(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingLoad?.key]);

  // ── Close cleanup ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      setSingleShotCursorStep(null);
      setRecordingMode('continuous');
      timeline$.setSelectedStepIndex(null);
      // Engine and pad-edit/interaction hooks handle their own state on open change.
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived values for render ────────────────────────────────────────────────
  const playbackSnapshot = useMemo<ArrangementPlaybackSnapshot>(
    () => ({ ...settings, tempoBpm }),
    [settings, tempoBpm],
  );

  const editingEntry = edit$.editingPadKey
    ? edit$.editableChords.find((e) => e.key === edit$.editingPadKey)
    : undefined;

  const previewEntry =
    edit$.editableChords.find((e) => e.key === interaction$.activePadKey) ??
    (edit$.editableChords.length > 0
      ? { leftHand: edit$.editableChords[0].leftHand, rightHand: edit$.editableChords[0].rightHand }
      : undefined);

  const selectedStepEventCount =
    timeline$.selectedStepIndex === null
      ? 0
      : (timeline$.eventsByStep.get(timeline$.selectedStepIndex)?.length ?? 0);

  const showRecordingLeadIn = engine$.isCountInActive || engine$.isRecording;
  const showMicPermissionHelp = vocal$.permissionStatus === 'denied';
  const canRetryMicPermission = vocal$.permissionStatus !== 'unsupported';
  const microphonePermissionHelpVariant = useMemo<'chrome-mac' | 'safari-mac' | 'generic'>(() => {
    if (typeof navigator === 'undefined') {
      return 'generic';
    }

    const userAgent = navigator.userAgent;
    const isMac = /Macintosh|Mac OS X/i.test(userAgent);
    const isChrome = /Chrome|Chromium/i.test(userAgent) && !/Edg|OPR|Brave/i.test(userAgent);
    const isSafari =
      /Safari/i.test(userAgent) && !/Chrome|Chromium|CriOS|Edg|OPR|Brave/i.test(userAgent);

    if (isMac && isChrome) {
      return 'chrome-mac';
    }

    if (isMac && isSafari) {
      return 'safari-mac';
    }

    return 'generic';
  }, []);

  const handleVocalRecordToggle = () => {
    if (!isVocalFeatureEnabled) {
      return;
    }

    if (vocalTakeLimitReached) {
      setShowVocalUpgradePrompt(true);
      trackClientAnalyticsEvent({
        name: 'vocal_take_limit_hit',
        properties: {
          limit: resolvedVocalEntitlements.maxVocalTakesPerArrangement,
          takeCount: vocal$.takes.length,
        },
      });
      trackClientAnalyticsEvent({
        name: 'vocal_paywall_opened',
        properties: { source: 'arranger_record_button' },
      });
      return;
    }

    if (!engine$.hasInitializedAudio) {
      engine$.setHasInitializedAudio(true);
    }

    if (vocal$.isVocalRecording) {
      vocal$.stopVocalRecording();
      return;
    }

    if (!engine$.isSequencerPlaying) {
      engine$.startSequencer();
    }

    trackClientAnalyticsEvent({
      name: 'vocal_record_started',
      properties: {
        takeCount: vocal$.takes.length,
      },
    });
    void vocal$.startVocalRecording(engine$.currentStepRef.current);
  };

  useEffect(() => {
    if (!isVocalFeatureEnabled) {
      vocal$.stopVocalPlayback();
      return;
    }

    if (!engine$.isSequencerPlaying) {
      vocal$.stopVocalPlayback();
      return;
    }

    void vocal$.startVocalPlayback(engine$.currentStepRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine$.isSequencerPlaying, isVocalFeatureEnabled]);

  useEffect(() => {
    if (!isVocalFeatureEnabled || !engine$.isSequencerPlaying) {
      return;
    }

    void vocal$.startVocalPlayback(engine$.currentStepRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vocal$.takes.length, isVocalFeatureEnabled, engine$.isSequencerPlaying]);

  return (
    <Dialog
      dir="ltr"
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      fullScreen={isMobile}
      sx={{ '& .MuiDialog-container': { justifyContent: 'center', alignItems: 'center' } }}
      slotProps={{
        paper: {
          dir: 'ltr',
          style: { direction: 'ltr' },
          sx: {
            width: '100%',
            maxWidth: isMobile ? '100%' : 800,
            paddingTop: 2,
            borderRadius: isMobile ? 0 : 2,
            color: 'common.white',
            background: appColors.surface.chordPlaygroundDialogGradient,
            border: isMobile
              ? 'none'
              : `1px solid ${appColors.surface.chordPlaygroundDialogBorder}`,
          },
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5">{t('ui.chordGrid.title')}</Typography>
          <IconButton
            aria-label={t('ui.chordGrid.closeAriaLabel')}
            onClick={onClose}
            size="small"
            sx={{ color: appColors.accent.chordCloseIcon }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <TransportBar
          isSequencerPlaying={engine$.isSequencerPlaying}
          isRecording={engine$.isRecording}
          isCountInActive={engine$.isCountInActive}
          hasInitializedAudio={engine$.hasInitializedAudio}
          recordingMode={recordingMode}
          isLoopEnabled={isLoopEnabled}
          metronomeEnabled={metronomeEnabled}
          isBeatPulseVisible={engine$.isBeatPulseVisible}
          isDownbeatPulse={engine$.isDownbeatPulse}
          currentBeatInBar={engine$.currentBeatInBar}
          beatsPerBar={beatsPerBar}
          currentStep={engine$.currentStep}
          totalSteps={totalSteps}
          loopLengthBars={loopLengthBars}
          arrangementEventsCount={timeline$.arrangementEvents.length}
          singleShotCursorStep={singleShotCursorStep}
          showKeyboardHints={showKeyboardHints}
          isDesktopKeyboardUi={isDesktopKeyboardUi}
          onPlayToggle={engine$.handleSequencerPlayToggle}
          onRecordToggle={engine$.handleRecordToggle}
          onLoopToggle={() => setIsLoopEnabled((prev) => !prev)}
          onMetronomeToggle={() => onSettingsChange.onMetronomeEnabledChange(!metronomeEnabled)}
          onClearRecording={clearRecordedEvents}
          onLoopLengthChange={(bars) => {
            setLoopLengthBars(bars);
            engine$.resetStep();
          }}
          onRecordingModeChange={(mode) => {
            setRecordingMode(mode);
            if (mode === 'single-shot' && engine$.isRecording) {
              engine$.handleRecordToggle();
            }
          }}
          onSingleShotCursorStepChange={setSingleShotCursorStep}
          isVocalRecording={vocal$.isVocalRecording}
          showVocalTrackControls={isVocalFeatureEnabled}
          canUseVocalTrackRecording={resolvedVocalEntitlements.canUseVocalTrackRecording}
          isVocalTakeLimitReached={vocalTakeLimitReached}
          onVocalRecordToggle={handleVocalRecordToggle}
        />

        <SequencerTrack
          currentStep={engine$.currentStep}
          totalSteps={totalSteps}
          stepsPerBar={stepsPerBar}
          beatsPerBar={beatsPerBar}
          tempoBpm={tempoBpm}
          isPlaying={engine$.isSequencerPlaying || engine$.isCountInActive}
          loopLengthBars={loopLengthBars}
          leadInBars={showRecordingLeadIn ? RECORDING_LEAD_IN_BARS : 0}
          scrollToStep={showRecordingLeadIn ? stepsPerBar * RECORDING_LEAD_IN_BARS : 0}
          scrollRequestKey={trackScrollRequestKey}
          events={timeline$.arrangementEvents}
          insertionCursorStep={recordingMode === 'single-shot' ? singleShotCursorStep : null}
          onInsertionCursorMove={setSingleShotCursorStep}
          selectedStepIndex={timeline$.selectedStepIndex}
          onClipClick={(sourceStepIndex) => {
            timeline$.setSelectedStepIndex((prev) =>
              prev === sourceStepIndex ? null : sourceStepIndex,
            );
          }}
          onClipMove={timeline$.moveClipStep}
          onLaneClickStep={handleLaneClickStep}
          onPadDropAtStep={(padKey, stepIndex) => {
            const entry = edit$.editableChords.find((c) => c.key === padKey);
            if (!entry) return;
            if (!engine$.hasInitializedAudio) engine$.setHasInitializedAudio(true);
            interaction$.triggerPad(entry);
            insertManualEventAtStep(entry, stepIndex, { durationSteps: 1 });
            interaction$.setMobileTimelineInsertPadKey(null);
          }}
          emptyTimelineHint={t('ui.chordGrid.dragOrRecordHint')}
        />

        {isVocalFeatureEnabled ? (
          <VocalTrackLane
            takes={vocal$.takes}
            currentStep={engine$.currentStep}
            totalSteps={totalSteps}
            stepsPerBar={stepsPerBar}
            beatsPerBar={beatsPerBar}
            tempoBpm={tempoBpm}
            loopLengthBars={loopLengthBars}
            leadInBars={showRecordingLeadIn ? RECORDING_LEAD_IN_BARS : 0}
            scrollToStep={showRecordingLeadIn ? stepsPerBar * RECORDING_LEAD_IN_BARS : 0}
            scrollRequestKey={trackScrollRequestKey}
            isPlaying={engine$.isSequencerPlaying || engine$.isCountInActive}
            isRecording={vocal$.isVocalRecording}
            selectedTakeId={vocal$.selectedTakeId}
            onSelectTake={vocal$.setSelectedTakeId}
            onDeleteTake={vocal$.deleteTake}
            onToggleMuteTake={vocal$.toggleMuteTake}
            onTakeGainChange={vocal$.setTakeGain}
          />
        ) : null}

        {isVocalFeatureEnabled && showVocalUpgradePrompt ? (
          <Alert
            severity="info"
            action={
              <Button
                size="small"
                variant="contained"
                onClick={() => {
                  if (!isAuthenticated) {
                    openAuthModal({ mode: 'login', reason: 'generic' });
                    return;
                  }

                  trackClientAnalyticsEvent({
                    name: 'vocal_upgrade_checkout_started',
                    properties: { source: 'arranger_upgrade_prompt' },
                  });
                  window.location.assign('/pricing');
                }}
              >
                {t('ui.chordGrid.upgradeAction', { defaultValue: 'Upgrade' })}
              </Button>
            }
            sx={{ mb: 1.5 }}
            onClose={() => setShowVocalUpgradePrompt(false)}
          >
            {t('ui.chordGrid.vocalTakeLimitMessage', {
              defaultValue: 'Multi-take vocal layering is available on paid plans.',
            })}
          </Alert>
        ) : null}

        {isVocalFeatureEnabled && vocal$.errorMessage ? (
          <Alert
            severity="warning"
            sx={{ mb: 1.5 }}
            action={
              canRetryMicPermission ? (
                <Button
                  size="small"
                  color="warning"
                  variant="outlined"
                  onClick={handleVocalRecordToggle}
                >
                  {t('ui.chordGrid.retryMicrophoneAccess', {
                    defaultValue: 'Allow microphone',
                  })}
                </Button>
              ) : undefined
            }
          >
            <Typography variant="body2">{vocal$.errorMessage}</Typography>
            {showMicPermissionHelp ? (
              <Typography variant="caption" component="div" sx={{ mt: 0.75 }}>
                {microphonePermissionHelpVariant === 'chrome-mac'
                  ? t('ui.chordGrid.microphonePermissionHelpChromeMac', {
                      defaultValue:
                        'On Chrome (macOS), click the sliders icon in the address bar, set Microphone to Allow for this site, then press "Allow microphone".',
                    })
                  : microphonePermissionHelpVariant === 'safari-mac'
                    ? t('ui.chordGrid.microphonePermissionHelpSafariMac', {
                        defaultValue:
                          'On Safari (macOS), open Safari > Settings for This Website and allow Microphone, then press "Allow microphone".',
                      })
                    : t('ui.chordGrid.microphonePermissionHelp', {
                        defaultValue:
                          'Use your browser site controls near the address bar to set Microphone to Allow, then press "Allow microphone".',
                      })}
              </Typography>
            ) : null}
          </Alert>
        ) : null}

        {isMobile && interaction$.mobileTimelineInsertPadKey ? (
          <Box
            sx={{
              mb: 1.5,
              p: 1.25,
              borderRadius: 1.5,
              bgcolor: appColors.surface.translucentPanel,
              border: `1px solid ${appColors.surface.translucentPanelBorder}`,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
              {t('ui.chordGrid.mobileDragInsertHint', {
                chord:
                  edit$.editableChords.find(
                    (c) => c.key === interaction$.mobileTimelineInsertPadKey,
                  )?.chord ?? interaction$.mobileTimelineInsertPadKey,
              })}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={() => interaction$.setMobileTimelineInsertPadKey(null)}
              sx={{ textTransform: 'none' }}
            >
              {t('ui.buttons.cancel')}
            </Button>
          </Box>
        ) : null}

        {recordingMode === 'single-shot' ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.25 }}>
            {t('ui.chordGrid.singleShotHint')}
          </Typography>
        ) : null}

        {timeline$.selectedStepIndex !== null && isMobile ? (
          <MobileClipControls
            selectedStepIndex={timeline$.selectedStepIndex}
            selectedStepEventCount={selectedStepEventCount}
            totalSteps={totalSteps}
            onNudgeLeft={() => timeline$.nudgeSelectedClip(-1)}
            onNudgeRight={() => timeline$.nudgeSelectedClip(1)}
            onDeleteClip={timeline$.deleteSelectedClip}
          />
        ) : null}

        {edit$.isEditMode ? (
          <PadEditPanel
            editingPadKey={edit$.editingPadKey}
            editingChord={editingEntry?.chord ?? ''}
            editableChordOptions={edit$.editableChordOptions}
            onPadChordChange={edit$.onPadChordChange}
            onSaveEditing={edit$.handleSaveEditing}
          />
        ) : null}

        <ChordPadGrid
          padHotkeyBindings={edit$.padHotkeyBindings}
          activePadKey={interaction$.activePadKey}
          editingPadKey={edit$.editingPadKey}
          cofHighlightedKeys={edit$.cofHighlightedKeys}
          isMobile={isMobile}
          showKeyboardHints={showKeyboardHints}
          onPadPress={onPadPress}
          onMobilePointerDown={(entry, event) => {
            interaction$.armMobileTimelineInsert(entry, event, onPadPress);
          }}
        />

        <CircleOfFifthsAccordion
          expanded={edit$.isSuggestionAccordionExpanded}
          onExpandedChange={edit$.setIsSuggestionAccordionExpanded}
          suggestionMode={edit$.cofSuggestionMode}
          onSuggestionModeChange={edit$.setCofSuggestionMode}
        />

        {edit$.editableChords.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('ui.chordGrid.noPianoVoicings')}
          </Typography>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <PlaybackSettingsButton
            settings={settings}
            onChange={onSettingsChange}
            tempoBpm={tempoBpm}
            onTempoBpmChange={onTempoBpmChange}
            previewVoicing={previewEntry}
            position="modal"
          />
          <Button
            size="small"
            variant="outlined"
            onClick={edit$.handleStartEditing}
            disabled={edit$.isEditMode}
            sx={(t) => ({
              borderWidth: 1.5,
              color: t.palette.primary.main,
              borderColor: alpha(t.palette.primary.main, 0.9),
              backgroundColor: 'transparent',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                borderColor: t.palette.primary.main,
                backgroundColor: alpha(t.palette.primary.main, 0.08),
                borderWidth: 1.5,
              },
              '&.Mui-disabled': {
                borderColor: alpha(t.palette.primary.main, 0.35),
                color: alpha(t.palette.primary.main, 0.45),
              },
            })}
          >
            {t('ui.buttons.edit')}
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            size="small"
            variant="contained"
            onClick={() => {
              engine$.stopSequencer();
              if (!isAuthenticated) {
                openAuthModal({
                  mode: 'login',
                  reason: 'save-arrangement',
                  onSuccess: () => setSaveArrangementDialogOpen(true),
                });
                return;
              }

              setSaveArrangementDialogOpen(true);
            }}
            startIcon={<SaveIcon fontSize="small" />}
            disabled={timeline$.arrangementEvents.length === 0}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {t('ui.buttons.saveArrangement')}
          </Button>
        </Box>
      </DialogActions>

      <SaveArrangementDialog
        open={saveArrangementDialogOpen}
        onClose={() => setSaveArrangementDialogOpen(false)}
        onSuccess={onSaveSuccess}
        timeline={timeline$.timeline}
        playbackSnapshot={playbackSnapshot}
        vocalTakeCount={vocal$.takes.length}
        sourceChords={edit$.editableChords}
      />
    </Dialog>
  );
}

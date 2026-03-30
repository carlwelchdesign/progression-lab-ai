type BeginPlaybackSessionParams = {
  startAudio: () => Promise<void>;
  stopAllAudio: () => void;
};

export const beginPlaybackSession = async ({
  startAudio,
  stopAllAudio,
}: BeginPlaybackSessionParams): Promise<void> => {
  await startAudio();
  stopAllAudio();
};

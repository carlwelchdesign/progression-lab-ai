type StartPartPlaybackParams<TPart> = {
  part: TPart;
  setActivePart: (part: TPart) => void;
  startPart: (part: TPart) => void;
  startTransport: () => void;
};

export const startPartPlayback = <TPart>({
  part,
  setActivePart,
  startPart,
  startTransport,
}: StartPartPlaybackParams<TPart>): void => {
  setActivePart(part);
  startPart(part);
  startTransport();
};

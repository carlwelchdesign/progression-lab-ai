export const PAD_DRAG_MIME_TYPE = 'application/x-ai-musician-pad';
const PAD_DRAG_PREFIX = 'pad:';

export const createPadDragPayload = (padKey: string): string => `${PAD_DRAG_PREFIX}${padKey}`;

export const parsePadDragPayload = (payload: string): string | null => {
  if (!payload.startsWith(PAD_DRAG_PREFIX)) {
    return null;
  }

  const padKey = payload.slice(PAD_DRAG_PREFIX.length).trim();
  return padKey.length > 0 ? padKey : null;
};

export const readPadKeyFromDataTransfer = (dataTransfer: DataTransfer): string | null => {
  const customPayload = dataTransfer.getData(PAD_DRAG_MIME_TYPE);
  const parsedCustom = parsePadDragPayload(customPayload);
  if (parsedCustom) {
    return parsedCustom;
  }

  const plainPayload = dataTransfer.getData('text/plain');
  return parsePadDragPayload(plainPayload);
};

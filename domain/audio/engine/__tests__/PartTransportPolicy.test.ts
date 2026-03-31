import { startPartPlayback } from '../PartTransportPolicy';

describe('PartTransportPolicy', () => {
  it('attaches part, starts part, then starts transport', () => {
    const part = { id: 'part-1' };
    const setActivePart = jest.fn();
    const startPart = jest.fn();
    const startTransport = jest.fn();

    startPartPlayback({
      part,
      setActivePart,
      startPart,
      startTransport,
    });

    expect(setActivePart).toHaveBeenCalledWith(part);
    expect(startPart).toHaveBeenCalledWith(part);
    expect(startTransport).toHaveBeenCalledTimes(1);

    expect(setActivePart.mock.invocationCallOrder[0]).toBeLessThan(
      startPart.mock.invocationCallOrder[0],
    );
    expect(startPart.mock.invocationCallOrder[0]).toBeLessThan(
      startTransport.mock.invocationCallOrder[0],
    );
  });
});

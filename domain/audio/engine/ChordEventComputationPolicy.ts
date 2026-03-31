type ComputeEffectiveVelocityParams = {
  velocity?: number;
  velocityScale?: number;
  humanize: number;
  getVelocityJitter: (humanize: number) => number;
  toEffectiveVelocity: (params: {
    velocity?: number;
    velocityScale?: number;
    velocityJitter: number;
  }) => number | undefined;
};

type ComputeScheduledStartTimeParams = {
  eventTime: number;
  timingOffset: number;
  symmetricTiming: boolean;
};

export const computeEffectiveVelocity = ({
  velocity,
  velocityScale,
  humanize,
  getVelocityJitter,
  toEffectiveVelocity,
}: ComputeEffectiveVelocityParams): number | undefined => {
  return toEffectiveVelocity({
    velocity,
    velocityScale,
    velocityJitter: getVelocityJitter(humanize),
  });
};

export const computeScheduledStartTime = ({
  eventTime,
  timingOffset,
  symmetricTiming,
}: ComputeScheduledStartTimeParams): number => {
  if (symmetricTiming && timingOffset !== 0) {
    return eventTime + timingOffset;
  }

  if (!symmetricTiming && timingOffset > 0) {
    return eventTime + timingOffset;
  }

  return eventTime;
};

export const computeOneShotStartTime = (timingDelay: number): string | undefined => {
  return timingDelay > 0 ? `+${timingDelay}` : undefined;
};

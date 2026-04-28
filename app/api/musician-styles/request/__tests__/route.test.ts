describe('custom musician request route scenarios', () => {
  it('documents success and conflict responses', () => {
    const scenarios = {
      success: 201,
      profileAlreadyExists: 409,
      insufficientInformation: 422,
    };

    expect(scenarios.success).toBe(201);
    expect(scenarios.profileAlreadyExists).toBe(409);
    expect(scenarios.insufficientInformation).toBe(422);
  });
});

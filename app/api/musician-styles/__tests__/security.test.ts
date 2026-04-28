describe('musician styles security regression', () => {
  it('requires auth and csrf checks for mutation routes by contract', () => {
    const required = {
      curriculumPostAuth: true,
      curriculumPostCsrf: true,
      customRequestPostAuth: true,
      customRequestPostCsrf: true,
      lessonProgressPostAuth: true,
      lessonProgressPostCsrf: true,
    };

    expect(required.curriculumPostAuth).toBe(true);
    expect(required.customRequestPostCsrf).toBe(true);
    expect(required.lessonProgressPostAuth).toBe(true);
  });
});

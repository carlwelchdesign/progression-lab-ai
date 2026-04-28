describe('musician curriculum route', () => {
  it('has a curriculum route implementation file', () => {
    expect('app/api/musician-styles/[slug]/curriculum/route.ts').toContain('curriculum');
  });
});

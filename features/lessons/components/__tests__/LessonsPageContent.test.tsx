import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import LessonsPageContent from '../LessonsPageContent';
import { LESSONS_BY_SKILL } from '../../data/lessonContent';

const theme = createTheme();

// next/navigation mock
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/lessons',
  useSearchParams: () => new URLSearchParams(),
}));

// i18next mock
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
}));

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('LessonsPageContent', () => {
  it('renders the three skill level tabs', () => {
    renderWithTheme(<LessonsPageContent />);
    expect(screen.getByRole('tab', { name: /beginner/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /intermediate/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /advanced/i })).toBeInTheDocument();
  });

  it('shows beginner lesson cards by default', () => {
    renderWithTheme(<LessonsPageContent />);
    for (const lesson of LESSONS_BY_SKILL.beginner) {
      expect(screen.getByText(lesson.title)).toBeInTheDocument();
    }
  });

  it('does not show intermediate lessons on initial render', () => {
    renderWithTheme(<LessonsPageContent />);
    for (const lesson of LESSONS_BY_SKILL.intermediate) {
      expect(screen.queryByText(lesson.title)).not.toBeInTheDocument();
    }
  });

  it('shows intermediate lessons after clicking the Intermediate tab', () => {
    renderWithTheme(<LessonsPageContent />);
    fireEvent.click(screen.getByRole('tab', { name: /intermediate/i }));
    for (const lesson of LESSONS_BY_SKILL.intermediate) {
      expect(screen.getByText(lesson.title)).toBeInTheDocument();
    }
  });

  it('shows advanced lessons after clicking the Advanced tab', () => {
    renderWithTheme(<LessonsPageContent />);
    fireEvent.click(screen.getByRole('tab', { name: /advanced/i }));
    for (const lesson of LESSONS_BY_SKILL.advanced) {
      expect(screen.getByText(lesson.title)).toBeInTheDocument();
    }
  });

  it('opens the lesson dialog when a lesson card is clicked', () => {
    renderWithTheme(<LessonsPageContent />);
    const firstBeginnerLesson = LESSONS_BY_SKILL.beginner[0];
    fireEvent.click(screen.getByText(firstBeginnerLesson.title));
    // Dialog title should now be visible
    expect(screen.getAllByText(firstBeginnerLesson.title).length).toBeGreaterThan(1);
  });
});

import { MusicianStylePage } from '../../../features/musician-styles/components/MusicianStylePage';

type StylesSlugPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function StylesSlugPage({ params }: StylesSlugPageProps) {
  const { slug } = await params;

  return (
    <main className="mx-auto max-w-6xl p-6">
      <MusicianStylePage slug={slug} />
    </main>
  );
}

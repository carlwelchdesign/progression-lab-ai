import MusicianStylePage from '../../../features/musician-styles/components/MusicianStylePage';

export default async function StyleSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <MusicianStylePage slug={slug} />;
}

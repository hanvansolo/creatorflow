import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function RacePreviewPage({ params }: PageProps) {
  const { slug } = await params;

  // Redirect to main race page which now includes the preview
  redirect(`/calendar/${slug}`);
}

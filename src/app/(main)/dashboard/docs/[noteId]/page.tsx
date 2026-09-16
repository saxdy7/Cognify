import { NotePage } from '@/modules/docs/NotePage';

export default async function Page({ params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = await params;
  return <NotePage noteId={noteId} />;
}

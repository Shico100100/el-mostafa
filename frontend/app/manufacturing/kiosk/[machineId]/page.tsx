import KioskClientPage from './client';

export function generateStaticParams(): { machineId: string }[] {
  return [{ machineId: 'placeholder' }];
}

export default async function Page({ params }: { params: Promise<{ machineId: string }> }) {
  const { machineId } = await params;
  return <KioskClientPage machineId={machineId} />;
}

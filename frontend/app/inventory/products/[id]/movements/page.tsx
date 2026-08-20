import MovementsClientPage from './client';

export function generateStaticParams(): { id: string }[] {
  return [{ id: 'placeholder' }];
}

export default function Page() {
  return <MovementsClientPage />;
}

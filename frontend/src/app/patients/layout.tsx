import { AppHeader } from '@/components/app-header';

export default function PatientsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppHeader />
      <main
        id="main"
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6"
      >
        {children}
      </main>
    </>
  );
}

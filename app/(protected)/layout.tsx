import { Sidebar } from '@/src/presentation/components/sidebar/Sidebar';

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="w-full min-h-screen flex">
      <Sidebar />
      <div className="w-full max-w-4xl mx-auto">{children}</div>
    </div>
  );
}

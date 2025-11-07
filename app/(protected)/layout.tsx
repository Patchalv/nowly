import { Sidebar } from '@/src/presentation/components/sidebar/Sidebar';

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="w-full h-full overflow-hidden flex">
      <Sidebar />
      <div className="w-full max-w-4xl mx-auto h-full overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

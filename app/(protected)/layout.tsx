import { MobileBottomBar } from '@/src/presentation/components/menus/mobile-bottom-bar/MobileBottomBar';
import { Sidebar } from '@/src/presentation/components/menus/sidebar/Sidebar';

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="w-full h-screen sm:h-full overflow-hidden flex flex-col sm:flex-row">
      <Sidebar />
      <div className="w-full max-w-4xl mx-auto h-full overflow-y-auto pb-16 sm:pb-0 flex-1 min-h-0">
        {children}
      </div>
      <MobileBottomBar />
    </div>
  );
}

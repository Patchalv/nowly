import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication - Nowly',
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

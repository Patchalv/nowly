import { usePathname } from 'next/navigation';

// src/presentation/hooks/useNavigationStyles.ts
export const useNavigationStyles = () => {
  const pathname = usePathname();

  const isActive = (route: string) => pathname === route;

  const getIconClasses = (route: string) => {
    const baseClasses = 'size-9 p-1 rounded-md';
    const activeClasses = 'text-accent-foreground bg-primary-foreground';
    const inactiveClasses =
      'text-primary-foreground hover:text-accent-foreground hover:bg-primary-foreground';

    return `${baseClasses} ${isActive(route) ? activeClasses : inactiveClasses}`;
  };

  const iconStrokeWidth = 1.5;

  return { isActive, getIconClasses, iconStrokeWidth };
};

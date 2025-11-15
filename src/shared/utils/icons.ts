import type { LucideIcon } from 'lucide-react';
import {
  Briefcase,
  Home,
  Heart,
  Calendar,
  CheckCircle,
  Star,
  Tag,
  Folder,
  Book,
  Coffee,
  ShoppingBag,
  Dumbbell,
  Music,
  Camera,
  Gift,
  Lightbulb,
  Target,
  TrendingUp,
  Users,
  Settings,
} from 'lucide-react';
import {
  CATEGORY_ICON_OPTIONS,
  DEFAULT_CATEGORY_ICON,
} from '@/src/config/constants';

/**
 * Map of icon names to their corresponding lucide-react components
 */
const ICON_MAP: Record<(typeof CATEGORY_ICON_OPTIONS)[number], LucideIcon> = {
  Briefcase,
  Home,
  Heart,
  Calendar,
  CheckCircle,
  Star,
  Tag,
  Folder,
  Book,
  Coffee,
  ShoppingBag,
  Dumbbell,
  Music,
  Camera,
  Gift,
  Lightbulb,
  Target,
  TrendingUp,
  Users,
  Settings,
};

/**
 * Get the lucide-react icon component for a given icon name
 * @param iconName - The name of the icon (e.g., 'Briefcase', 'Home')
 * @returns The corresponding LucideIcon component, or the default icon if not found
 */
export function getIconComponent(
  iconName: string | null | undefined
): LucideIcon {
  if (!iconName) {
    return ICON_MAP[DEFAULT_CATEGORY_ICON];
  }

  const Icon = ICON_MAP[iconName as (typeof CATEGORY_ICON_OPTIONS)[number]];
  return Icon || ICON_MAP[DEFAULT_CATEGORY_ICON];
}

/**
 * Check if an icon name is valid
 * @param iconName - The icon name to validate
 * @returns True if the icon name is in the allowed list
 */
export function isValidIconName(
  iconName: string | null | undefined
): iconName is (typeof CATEGORY_ICON_OPTIONS)[number] {
  if (!iconName) return false;
  return CATEGORY_ICON_OPTIONS.includes(
    iconName as (typeof CATEGORY_ICON_OPTIONS)[number]
  );
}

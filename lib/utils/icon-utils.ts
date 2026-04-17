import type { LucideIcon } from 'lucide-react';
import {
  Menu,
  Home,
  Settings,
  User,
  Trash,
  Edit,
  Plus,
  X,
  Check,
  Bell,
  MessageSquare,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export type IconName =
  | 'menu'
  | 'house'
  | 'settings'
  | 'user'
  | 'trash'
  | 'edit'
  | 'plus'
  | 'x'
  | 'check'
  | 'bell'
  | 'message'
  | 'search'
  | 'filter'
  | 'chevron-down'
  | 'chevron-up'
  | 'chevron-left'
  | 'chevron-right';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  className?: string;
}

export const ICON_SIZES = [16, 20, 24, 32] as const;
export const DEFAULT_ICON_SIZE = 24;

const iconMap: Record<IconName, LucideIcon> = {
  menu: Menu,
  house: Home,
  settings: Settings,
  user: User,
  trash: Trash,
  edit: Edit,
  plus: Plus,
  x: X,
  check: Check,
  bell: Bell,
  message: MessageSquare,
  search: Search,
  filter: Filter,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
};

export function getIcon(name: IconName): LucideIcon {
  return iconMap[name];
}

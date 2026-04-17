'use client';

import type { IconProps } from '@/lib/utils/icon-utils';
import { getIcon, DEFAULT_ICON_SIZE, ICON_SIZES } from '@/lib/utils/icon-utils';

export function Icon({ name, size = DEFAULT_ICON_SIZE, color, className = '' }: IconProps) {
  const LucideIcon = getIcon(name);
  
  if (!LucideIcon) {
    return null;
  }

  // Validate size is in allowed ICON_SIZES array
  const validatedSize = ICON_SIZES.includes(size as any) ? size : DEFAULT_ICON_SIZE;

  return (
    <LucideIcon
      size={validatedSize}
      color={color}
      className={className}
      aria-label={name}
      role="img"
    />
  );
}

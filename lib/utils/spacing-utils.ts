export interface SpacingScale {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

// Cache for computed styles to avoid repeated getComputedStyle calls
let cachedSpacingScale: SpacingScale | null = null;

export function getSpacing(): SpacingScale {
  if (typeof window === 'undefined') {
    // Return default values for SSR
    return {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      '2xl': 48,
    };
  }

  // Return cached values if available
  if (cachedSpacingScale) {
    return cachedSpacingScale;
  }

  const styles = getComputedStyle(document.documentElement);
  
  cachedSpacingScale = {
    xs: parseInt(styles.getPropertyValue('--spacing-xs').trim(), 10) || 4,
    sm: parseInt(styles.getPropertyValue('--spacing-sm').trim(), 10) || 8,
    md: parseInt(styles.getPropertyValue('--spacing-md').trim(), 10) || 16,
    lg: parseInt(styles.getPropertyValue('--spacing-lg').trim(), 10) || 24,
    xl: parseInt(styles.getPropertyValue('--spacing-xl').trim(), 10) || 32,
    '2xl': parseInt(styles.getPropertyValue('--spacing-2xl').trim(), 10) || 48,
  };
  
  return cachedSpacingScale;
}

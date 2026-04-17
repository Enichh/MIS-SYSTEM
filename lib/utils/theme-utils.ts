export interface ThemeColors {
  primary: string;
  background: string;
  text: string;
  border: string;
  success: string;
  error: string;
  warning: string;
}

// Cache for computed styles to avoid repeated getComputedStyle calls
let cachedThemeColors: ThemeColors | null = null;

export function getThemeColor(): ThemeColors {
  if (typeof window === 'undefined') {
    // Return default values for SSR
    return {
      primary: 'oklch(0.55 0.22 264)',
      background: 'oklch(0.98 0.01 240)',
      text: 'oklch(0.2 0.02 240)',
      border: 'oklch(0.85 0.02 240)',
      success: 'oklch(0.6 0.18 142)',
      error: 'oklch(0.55 0.22 25)',
      warning: 'oklch(0.7 0.15 65)',
    };
  }

  // Return cached values if available
  if (cachedThemeColors) {
    return cachedThemeColors;
  }

  const styles = getComputedStyle(document.documentElement);
  
  cachedThemeColors = {
    primary: styles.getPropertyValue('--color-primary').trim() || 'oklch(0.55 0.22 264)',
    background: styles.getPropertyValue('--color-background').trim() || 'oklch(0.98 0.01 240)',
    text: styles.getPropertyValue('--color-text').trim() || 'oklch(0.2 0.02 240)',
    border: styles.getPropertyValue('--color-border').trim() || 'oklch(0.85 0.02 240)',
    success: styles.getPropertyValue('--color-success').trim() || 'oklch(0.6 0.18 142)',
    error: styles.getPropertyValue('--color-error').trim() || 'oklch(0.55 0.22 25)',
    warning: styles.getPropertyValue('--color-warning').trim() || 'oklch(0.7 0.15 65)',
  };
  
  return cachedThemeColors;
}

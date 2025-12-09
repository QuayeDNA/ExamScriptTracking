/**
 * Design System Exports
 * Central export for all design system utilities and constants
 */

// Theme and colors
export {
  useThemeColors,
  getBadgeColors,
  getButtonColors,
  Theme,
  DesignColors,
  StatusColors,
  BorderRadius,
  Spacing,
  Typography,
  Shadows,
} from "./design-system";

// Re-export from old theme for backward compatibility
export { Colors, Fonts } from "./theme";

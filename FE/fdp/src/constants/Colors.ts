interface ColorsScheme {
  tint: string;
  text: string;
  background: string;
  tabIconDefault: string;
  tabIconSelected: string;
}

interface Colors {
  light: ColorsScheme;
  dark: ColorsScheme;
}

export const Colors: Colors = {
  light: {
    tint: '#2f95dc', // Blue tint for active elements
    text: '#000000', // Black text for light mode
    background: '#ffffff', // White background
    tabIconDefault: '#ccc', // Gray for inactive icons
    tabIconSelected: '#2f95dc', // Blue for active icons
  },
  dark: {
    tint: '#2f95dc', // Same blue tint for consistency
    text: '#ffffff', // White text for dark mode
    background: '#000000', // Black background
    tabIconDefault: '#666', // Darker gray for inactive icons
    tabIconSelected: '#2f95dc', // Blue for active icons
  },
};
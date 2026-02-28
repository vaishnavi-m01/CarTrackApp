export const COLORS = {
  primary: '#667eea',
  primaryDark: '#764ba2',
  secondary: '#f093fb',
  secondaryDark: '#f5576c',
  success: '#10ac84',
  warning: '#ff9f43',
  danger: '#ff4757',
  info: '#43e97b',
  infoDark: '#38f9d7',

  white: '#FFFFFF',
  black: '#000000',
  gray: '#666666',
  lightGray: '#999999',
  extraLightGray: '#f5f5f5',
  border: '#eeeeee',

  text: '#333333',
  textLight: '#666666',
  textExtraLight: '#999999',

  background: '#f5f5f5',
  cardBackground: '#FFFFFF',
  defaultProfileImage: require('../assets/person.png'),
};

export const SIZES = {
  base: 8,
  font: 14,
  radius: 15,
  padding: 20,

  // Font sizes
  h1: 28,
  h2: 24,
  h3: 20,
  h4: 18,
  h5: 16,
  body1: 16,
  body2: 14,
  body3: 12,
  body4: 10,
};

export const SHADOWS = {
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 4,
  },
  dark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 6,
  },
};

export default { COLORS, SIZES, SHADOWS };

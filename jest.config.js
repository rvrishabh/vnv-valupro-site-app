module.exports = {
  preset: 'react-native',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  // pnpm nests packages under node_modules/.pnpm/<pkg>/node_modules/<pkg>, so
  // `.pnpm` itself must not be ignored for the react-native allowlist to apply.
  transformIgnorePatterns: [
    'node_modules/(?!(\\.pnpm|(jest-)?react-native|@react-native|@react-navigation)/)',
  ],
};

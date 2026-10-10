// The Airbnb rules for React and TypeScript, with Prettier owning the formatting.
module.exports = {
  root: true,
  extends: ['airbnb', 'airbnb-typescript', 'airbnb/hooks', 'prettier'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  // The rules that read types take them from the project, which names this
  // file too.
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {jsx: true},
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  env: {node: true, es2022: true},
  settings: {
    'import/resolver': {node: {extensions: ['.ts', '.tsx', '.d.ts', '.js', '.jsx']}},
  },
  rules: {
    // The base rule does not know types from values; this one does. A type
    // may be used above its declaration, which is always safe.
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': [
      'error',
      {functions: true, classes: true, variables: true, enums: true, typedefs: false},
    ],
    // React 17+ needs no React in scope for JSX; the build uses the automatic runtime.
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off',
    // Defaults as default parameters: React is retiring defaultProps on functions.
    'react/require-default-props': ['error', {functions: 'defaultArguments'}],
  },
  overrides: [
    {
      // Bit twiddling is the job here: font bitmaps, checksums, colour bytes.
      files: ['src/fonts/**', 'src/output/**', 'src/color.ts', 'src/canvas.ts'],
      rules: {'no-bitwise': 'off'},
    },
    {
      files: ['scripts/**', 'test/**', '*.config.*', '*.cjs'],
      rules: {
        'import/no-extraneous-dependencies': ['error', {devDependencies: true}],
        'import/extensions': 'off',
        'no-console': 'off',
      },
    },
  ],
};

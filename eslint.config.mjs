import antfu from '@antfu/eslint-config';

export default antfu(
  {
    vue: true,
    typescript: true,
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/*.md',
      '**/pnpm-lock.yaml',
      '**/src-tauri/**',
    ],
  },
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      'no-console': 'warn',
      'antfu/top-level-function': 'off',
    },
  },
);

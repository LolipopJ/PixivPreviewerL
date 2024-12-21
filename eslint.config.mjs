import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      'no-unused-vars': 'warn',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-undef': 'warn',
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jquery,
      },
    },
  },
  eslintPluginPrettierRecommended
)

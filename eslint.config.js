import { defineConfig, globalIgnores} from 'eslint/config'

import tsConfig from 'eslint-config-lavy/ts'

export default defineConfig([
  ...tsConfig,
  {
    files: ['src/**/*.{ts}'],
    rules: {
      // You can add project-specific rules here.
    }
  },
  globalIgnores(["examples/**", "playground/**"]),
])
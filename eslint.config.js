import { defineConfig } from 'eslint/config'

import tsConfig from 'eslint-config-lavy/ts'

export default defineConfig([
  { ignores: ['example/**'] },
  ...tsConfig,
  {
    files: ['**/*.{ts}'],
    rules: {
      // 你可以在这里添加项目特定的规则
    }
  }
])
/// <reference types="vitest" />
import * as path from 'path'
import { defineConfig, coverageConfigDefaults } from 'vitest/config'

export default defineConfig({
  test: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
    coverage: {
      exclude: [
        '*.?(c|m)[jt]s?(x)',
        ...coverageConfigDefaults.exclude,
      ],
    },
  },
})
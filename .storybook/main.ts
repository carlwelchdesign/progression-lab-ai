import type { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
  "stories": [
    "../components/Introduction.mdx",
    "../components/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../components/**/*.mdx",
    "../features/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../features/**/*.mdx"
  ],
  "addons": [
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs"
  ],
  "framework": "@storybook/nextjs-vite",
  "staticDirs": [
    "../public"
  ]
};
export default config;
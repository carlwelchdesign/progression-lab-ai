import type { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
  "stories": [
    "../components/__stories__/Introduction.mdx",
    "../components/**/__stories__/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../components/**/__stories__/*.mdx",
    "../features/**/__stories__/*.stories.@(js|jsx|mjs|ts|tsx)"
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
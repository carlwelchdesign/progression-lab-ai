import { addons } from 'storybook/manager-api';
import { themes, create } from 'storybook/theming';

const customTheme = create({
  base: 'dark',
  brand: {
    title: 'ProgressionLab.AI',
    url: '/',
    image: '/icon.png',
  },
});

addons.setConfig({
  theme: customTheme,
});

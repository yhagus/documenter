import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Documenter',
  description: 'personal documenter in case I forgot syntax of some things.',
  themeConfig: {
    sidebar: [
      {
        text: 'Database Setup (App & Migrator)',
        link: '/database/database-setup.md',
      },
      {
        text: 'Framework',
        items: [
          {
            text: 'Backend',
            items: [
              {
                text: 'Laravel',
                link: '/frameworks/laravel',
              },
              {
                text: 'Nest JS',
                link: '/frameworks/nest',
              },
            ],
          },
          {
            text: 'Frontend',
            items: [
              {
                text: 'Nuxt',
                link: '/framework/nuxt',
              },
            ],
          },
        ],
      },
    ],
  },
});

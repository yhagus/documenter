import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Documenter',
  description: 'personal documenter in case I forgot syntax of some things.',
  ignoreDeadLinks: true,
  themeConfig: {
    sidebar: [
      {
        text: 'CI/CD Workflow',
        items: [
          {
            text: 'Laravel',
            items: [
              {
                text: 'Build Stage',
                link: '/ci-cd/laravel/build-stage.md'
              },
            ],
          },
          {
            text: 'Nuxt',
            items: [
              {
                text: 'Build Stage',
                link: '/ci-cd/nuxt/build-stage.md'
              },
            ],
          },
        ],
      },
      {
        text: 'Database Setup (App & Migrator)',
        link: '/database/database-setup.md',
      },
      {
        text: 'Docker',
        items: [],
      },
      // {
      //   text: 'Framework',
      //   items: [
      //     {
      //       text: 'Backend',
      //       items: [
      //         {
      //           text: 'Laravel',
      //           link: '/frameworks/laravel',
      //         },
      //         {
      //           text: 'Nest JS',
      //           link: '/frameworks/nest',
      //         },
      //       ],
      //     },
      //     {
      //       text: 'Frontend',
      //       items: [
      //         {
      //           text: 'Nuxt',
      //           link: '/framework/nuxt',
      //         },
      //       ],
      //     },
      //   ],
      // },
      {
        text: 'Installer',
        items: [
          {
            text: 'MinIO',
            link: '/installer/minio-RELEASE2025-04-08T15-41-24Z/install.md',
          },
          {
            text: 'PostgreSQL@16',
            link: '/installer/postgresql-16/install.md',
          },
          {
            text: 'pgAdmin Web 4',
            link: '/installer/pgadmin-4/install.md',
          },
        ],
      },
    ],
  },
});

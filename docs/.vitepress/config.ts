import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'rancher-mcp',
  description: 'TypeScript MCP server for Rancher workflows.',
  base: '/rancher-mcp/',
  lang: 'en-US',
  head: [
    ['link', { rel: 'icon', href: '/favicon.png' }],
    ['meta', { name: 'theme-color', content: '#0f172a' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:image', content: '/logo-wordmark.png' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],
  themeConfig: {
    logo: '/logo-mark.png',
    nav: [
      { text: 'Guide', link: '/guide' },
      { text: 'Clients', link: '/clients' },
      { text: 'API', link: '/api' },
    ],
    sidebar: [
      {
        text: 'Docs',
        items: [
          { text: 'Guide', link: '/guide' },
          { text: 'Clients', link: '/clients' },
          { text: 'API', link: '/api' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Jasonrve/rancher-mcp' },
    ],
  },
});

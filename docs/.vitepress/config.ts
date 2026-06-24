import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'rancher-mcp',
  description: 'TypeScript MCP server for Rancher workflows.',
  base: '/rancher-mcp/',
  lang: 'en-US',
  themeConfig: {
    logo: '/logo.svg',
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

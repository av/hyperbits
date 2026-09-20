// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import startlightThemeFlexoki from 'starlight-theme-flexoki';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @typedef {{ label: string; link: string }} SidebarLinkItem */
/** @typedef {{ label: string; items: SidebarLinkItem[] }} SidebarGroupItem */

function getBitsSidebar() {
    const bitsDir = path.resolve(__dirname, './src/content/docs/bits');
    if (!fs.existsSync(bitsDir)) return [];

    const files = fs.readdirSync(bitsDir).filter((f) => f.endsWith('.mdx'));
    /** @type {Record<string, SidebarLinkItem[]>} */
    const categories = {};

    files.forEach((file) => {
        const content = fs.readFileSync(path.join(bitsDir, file), 'utf-8');
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

        if (frontmatterMatch) {
            const frontmatter = frontmatterMatch[1];
            const titleMatch = frontmatter.match(/title:\s*(.*)/);
            const categoryMatch = frontmatter.match(/category:\s*(.*)/);

            const rawTitle = titleMatch ? titleMatch[1].trim() : file;
            const title = rawTitle.replace(/^["']|["']$/g, '');
            const rawCategory = categoryMatch ? categoryMatch[1].trim() : 'Uncategorized';
            const category = rawCategory.replace(/^["']|["']$/g, '');
            const link = `/docs/bits/${file.replace('.mdx', '')}`;

            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push({ label: title, link });
        }
    });

    const orderedCategories = [
        'Full Compositions',
        'Staggered Motion',
        'Text Animations',
        'Background Effects',
        'Particles',
        '3D Scenes',
    ];
    /** @type {(SidebarLinkItem | SidebarGroupItem)[]} */
    const sidebarItems = [{ label: 'Introduction', link: '/docs/bits-catalog' }];

    orderedCategories.forEach((cat) => {
        if (categories[cat]) {
            sidebarItems.push({
                label: cat,
                items: categories[cat],
            });
            delete categories[cat];
        }
    });

    Object.keys(categories).forEach((cat) => {
        sidebarItems.push({
            label: cat,
            items: categories[cat],
        });
    });

    return sidebarItems;
}

export default defineConfig({
    vite: {
        resolve: {
            dedupe: [
                'react',
                'react-dom',
                '@codemirror/state',
                '@codemirror/view',
                '@codemirror/lang-html',
            ],
            alias: {
                '@': path.resolve(__dirname, './src'),
                '@components': path.resolve(__dirname, './src/components'),
                '@showcases': path.resolve(__dirname, './src/components/showcases'),
                '@lib': path.resolve(__dirname, './src/lib'),
            },
        },
        optimizeDeps: {
            include: [
                'react',
                'react-dom',
                '@uiw/react-codemirror',
                '@codemirror/state',
                '@codemirror/view',
                '@codemirror/lang-html',
                '@codemirror/theme-one-dark',
            ],
        },
        plugins: [tailwindcss()],
    },
    integrations: [
        react(),
        starlight({
            plugins: [
                startlightThemeFlexoki({
                    accentColor: 'orange',
                }),
            ],
            title: 'Hyperbits',
            description: 'Animation bits for HyperFrames video compositions.',
            logo: {
                src: './src/components/Logo.astro',
                replacesTitle: false,
            },
            disable404Route: true,
            head: [
                {
                    tag: 'script',
                    attrs: {
                        src: '/vendor/hyperframes-player.global.js',
                        defer: true,
                    },
                },
            ],
            social: [
                {
                    icon: 'github',
                    label: 'GitHub',
                    href: 'https://github.com/av/hyperbits',
                },
            ],
            sidebar: [
                {
                    label: 'Getting Started',
                    link: '/docs/getting-started',
                },
                {
                    label: 'CLI',
                    link: '/docs/cli',
                },
                {
                    label: 'MCP',
                    link: '/docs/mcp',
                },
                {
                    label: 'Reference',
                    collapsed: true,
                    items: [
                        { label: 'interpolate', link: '/docs/reference/interpolate' },
                        { label: 'stagger', link: '/docs/reference/stagger' },
                        { label: 'color', link: '/docs/reference/color' },
                        { label: 'gradient', link: '/docs/reference/gradient' },
                        { label: 'random', link: '/docs/reference/random' },
                        { label: 'particles', link: '/docs/reference/particles' },
                        { label: 'viewport', link: '/docs/reference/viewport' },
                        { label: 'text', link: '/docs/reference/text' },
                        { label: 'counter', link: '/docs/reference/counter' },
                        { label: 'code', link: '/docs/reference/code' },
                        { label: 'scene3d', link: '/docs/reference/scene3d' },
                    ],
                },
                {
                    label: 'Bits',
                    items: getBitsSidebar(),
                },
            ],
            customCss: ['./src/styles/starlight-tailwind.css'],
        }),
    ],
});

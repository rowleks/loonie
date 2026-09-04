import type { MetadataRoute } from 'next'

/**
 * PWA manifest — the cleaner view is the primary install target (PRD §8:
 * mobile-first, PWA-installable). Full offline/push stays a Phase 3 decision.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Loonie Cleaning Services',
    short_name: 'Loonie',
    description: 'Jobs and scheduling for Loonie Cleaning Services staff.',
    start_url: '/jobs',
    display: 'standalone',
    background_color: '#f8fafa',
    theme_color: '#28937d',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  }
}

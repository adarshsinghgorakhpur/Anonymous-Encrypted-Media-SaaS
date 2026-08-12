import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://xcrypt.app';
  const lastModified = new Date();

  const routes = [
    '',
    '/upload',
    '/pricing',
    '/login',
    '/privacy',
    '/terms',
    '/dashboard',
    '/dashboard/uploads',
    '/dashboard/gallery',
    '/dashboard/vault',
    '/dashboard/referral',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : route === '/upload' ? 0.9 : 0.7,
  }));
}

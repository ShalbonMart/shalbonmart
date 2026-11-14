import { unzipSync } from 'fflate';
import { readCatalog } from './_catalog.js';

const MIME = {
  html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', js: 'text/javascript; charset=utf-8',
  mjs: 'text/javascript; charset=utf-8', json: 'application/json', svg: 'image/svg+xml', png: 'image/png',
  jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif',
  ico: 'image/x-icon', woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', txt: 'text/plain', map: 'application/json',
};
const cache = new Map();

async function load(slug) {
  const p = (await readCatalog()).find((x) => x.previewSlug === slug && x.previewZip);
  if (!p) return null;
  if (cache.has(p.previewZip)) return cache.get(p.previewZip);
  const files = unzipSync(new Uint8Array(await (await fetch(p.previewZip)).arrayBuffer()));
  const names = Object.keys(files).filter((n) => !n.endsWith('/') && !n.startsWith('__MACOSX'));
  // ZIPs often contain one top-level folder; strip it so index.html is at the root.
  const top = names[0]?.split('/')[0];
  const root = names.length && names.every((n) => n.includes('/') && n.split('/')[0] === top) ? top + '/' : '';
  const map = {};
  names.forEach((n) => (map[n.slice(root.length)] = files[n]));
  if (cache.size > 5) cache.clear();
  cache.set(p.previewZip, map);
  return map;
}

export default async function handler(req, res) {
  try {
    let path = req.query.path || '';
    if (Array.isArray(path)) path = path.join('/');
    path = decodeURIComponent(path);
    if (!path || path.endsWith('/')) path += 'index.html';
    const map = await load(String(req.query.slug || ''));
    const data = map && (map[path] || map[path + '/index.html']);
    if (!data) return res.status(404).send('Preview not found');
    const ext = path.split('.').pop().toLowerCase();
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Uploaded templates run in an isolated origin so they can never touch the main site.
    res.setHeader('Content-Security-Policy', 'sandbox allow-scripts allow-forms allow-popups');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.status(200).send(Buffer.from(data));
  } catch (e) {
    res.status(500).send('Preview error');
  }
}

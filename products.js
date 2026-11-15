import { readCatalog } from './_catalog.js';

export default async function handler(req, res) {
  try {
    const all = await readCatalog();
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');
    res.json({
      products: all
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        .map((p) => ({
          id: p.id,
          cat: p.cat,
          title: p.title,
          desc: p.desc,
          price: p.price,
          tag: p.tag,
          image: p.image,
          gallery: p.gallery,
          demoUrl: p.demoUrl || '',
          previewUrl: p.previewSlug && p.previewZip ? `/preview/${p.previewSlug}/` : p.demoUrl || '',
        })),
    });
  } catch (e) {
    res.status(503).json({ error: 'store unavailable' });
  }
}
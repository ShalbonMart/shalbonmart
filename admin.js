import { handleUpload } from '@vercel/blob/client';
import { readCatalog, writeCatalog } from './_catalog.js';

const ok = (p) => !!p && !!process.env.ADMIN_PASSWORD && p === process.env.ADMIN_PASSWORD;

export default async function handler(req, res) {
  const op = req.query.op;
  try {
    // Browser uploads files straight to Blob; we only hand out a token to the admin.
    if (op === 'upload') {
      const json = await handleUpload({
        body: req.body,
        request: req,
        onBeforeGenerateToken: async (_path, payload) => {
          if (!ok(payload)) throw new Error('unauthorized');
          return { addRandomSuffix: true, maximumSizeInBytes: 300 * 1024 * 1024 };
        },
        onUploadCompleted: async () => {},
      });
      return res.json(json);
    }
    if (!ok(req.headers['x-admin-password'])) return res.status(401).json({ error: 'unauthorized' });
    if (op === 'check') return res.json({ ok: true });
    if (op === 'list') return res.json({ products: await readCatalog() });
    if (op === 'save' && req.method === 'POST') {
      await writeCatalog(Array.isArray(req.body?.products) ? req.body.products : []);
      return res.json({ ok: true });
    }
    res.status(400).json({ error: 'bad request' });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
}

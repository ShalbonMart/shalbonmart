import { list, put } from '@vercel/blob';

// The whole product catalog lives in one public JSON blob.
// Private fields (file, previewZip) are never sent to the browser by /api/products.
export async function readCatalog() {
  const { blobs } = await list({ prefix: 'catalog.json', limit: 1 });
  if (!blobs.length) return [];
  const r = await fetch(blobs[0].url + '?t=' + Date.now());
  return (await r.json()).products || [];
}

export async function writeCatalog(products) {
  await put('catalog.json', JSON.stringify({ products }), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
}

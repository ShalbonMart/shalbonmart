// Vercel adds the visitor's country code to every request.
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'private, max-age=3600');
  res.json({ country: req.headers['x-vercel-ip-country'] || '' });
}

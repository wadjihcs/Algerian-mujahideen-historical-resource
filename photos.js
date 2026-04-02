// ── photos.js ── Wikipedia photo fetching service

const cache = {};

/**
 * Fetches a portrait/event photo from Wikipedia REST API.
 * Tries multiple slugs across English and French Wikipedia.
 * Returns the image URL or null.
 */
export async function fetchPhoto(slug, alts) {
  if (cache[slug]) return cache[slug];

  const slugs = [slug, ...(alts || [])];

  for (const s of slugs) {
    for (const lang of ['en', 'fr']) {
      try {
        const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(s)}`;
        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();
          const imageUrl = data.originalimage?.source || data.thumbnail?.source;

          if (imageUrl && !imageUrl.includes('logo') && !imageUrl.includes('icon')) {
            cache[slug] = imageUrl;
            return imageUrl;
          }
        }
      } catch (err) {
        // Silently continue to next slug/language
      }
    }
  }

  return null;
}

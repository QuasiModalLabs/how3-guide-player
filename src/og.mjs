// Page description tags. The live site adds link-preview (Open Graph) tags with its own address and image.
export const OG_TITLE = 'Step-by-step guides';
export const OG_DESCRIPTION = 'Ask in your own words. Watch a short video of every step on the official website. Unofficial demo. Not affiliated with any government website it shows.';

const attr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
export function ogTags() {
  return [
    `<meta name="description" content="${attr(OG_DESCRIPTION)}">`,
    '<meta name="robots" content="noindex">',
  ].join('\n');
}

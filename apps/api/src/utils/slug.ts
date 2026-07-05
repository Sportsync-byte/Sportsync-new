export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'player';
}

export async function uniquePlayerSlug(
  venueId: string,
  base: string,
  exists: (venueId: string, slug: string) => Promise<boolean>
): Promise<string> {
  let slug = slugify(base);
  let n = 0;
  while (await exists(venueId, slug)) {
    n += 1;
    slug = `${slugify(base)}-${n}`;
  }
  return slug;
}

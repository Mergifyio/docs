/**
 * Slugify text into a URL/anchor-safe id: lowercase, runs of non-alphanumerics
 * collapsed to a single dash, leading/trailing dashes trimmed. Shared by the
 * API and CLI references so their deep-link anchors follow one convention.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

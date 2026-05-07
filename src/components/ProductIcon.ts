export const PRODUCT_ICON_NAMES = [
  'merge-queue',
  'ci-insights',
  'test-insights',
  'merge-protections',
  'stacks',
] as const;

export type ProductIconName = (typeof PRODUCT_ICON_NAMES)[number];

const PRODUCT_ICON_PREFIX = 'mergify:';

export function parseProductIcon(icon: string | undefined): ProductIconName | null {
  if (!icon?.startsWith(PRODUCT_ICON_PREFIX)) return null;
  const suffix = icon.slice(PRODUCT_ICON_PREFIX.length);
  return (PRODUCT_ICON_NAMES as readonly string[]).includes(suffix)
    ? (suffix as ProductIconName)
    : null;
}

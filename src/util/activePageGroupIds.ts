import navItems, { type NavItem } from '../content/navItems';
import { removeLeadingSlash, removeTrailingSlash } from '../util';

/**
 * Return the IDs of the navigation groups that are ancestors of the
 * navItem matching `currentPath`. Used to expand the sidebar to the
 * current page on initial load, even when localStorage has no entry.
 */
export function getActivePageGroupIds(currentPath: string): string[] {
  const target = removeLeadingSlash(removeTrailingSlash(currentPath));

  const matchesPath = (itemPath: string): boolean => {
    const normalized = removeLeadingSlash(removeTrailingSlash(itemPath));
    if (normalized === '') return target === '';
    return target === normalized || target.endsWith(`/${normalized}`);
  };

  const findPath = (items: NavItem[], ancestorIds: string[]): string[] | null => {
    for (const item of items) {
      const nextAncestorIds = item.id ? [...ancestorIds, item.id] : ancestorIds;
      if (!item.children && item.path && matchesPath(item.path)) {
        return ancestorIds;
      }
      if (item.children) {
        // Prefer a leaf match deeper in the tree (e.g. an explicit overview
        // child) before falling back to the group's own path. This keeps the
        // returned ancestor list as specific as possible.
        const found = findPath(item.children, nextAncestorIds);
        if (found) return found;
        if (item.path && matchesPath(item.path)) {
          return nextAncestorIds;
        }
      }
    }
    return null;
  };

  return findPath(navItems, []) ?? [];
}

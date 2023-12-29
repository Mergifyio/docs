import { NavItem } from '~/content/navItems';

export const flattenNavItems = (items: NavItem[]): NavItem[] =>
	items?.flatMap((item: NavItem) =>
		item.children ? [item, ...flattenNavItems(item.children)] : item
	) ?? [];

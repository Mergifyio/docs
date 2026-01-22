import type { NavItem } from './navItems';

const enterpriseNavItems: NavItem[] = [
  { title: 'Overview', path: '/enterprise', icon: 'fa6-solid:house' },
  { title: 'Architecture', path: '/enterprise/architecture', icon: 'mdi:architecture' },
  { title: 'Requirements', path: '/enterprise/requirements', icon: 'fa6-solid:clipboard-list' },
  { title: 'Installation', path: '/enterprise/installation', icon: 'fa6-solid:screwdriver-wrench' },
  {
    title: 'Advanced Features',
    path: '/enterprise/advanced-features',
    icon: 'bi:rocket',
  },
  { title: 'Troubleshooting', path: '/enterprise/troubleshooting', icon: 'fa6-solid:life-ring' },
  { title: 'Maintenance', path: '/enterprise/maintenance', icon: 'fa6-solid:toolbox' },
];

export default enterpriseNavItems;

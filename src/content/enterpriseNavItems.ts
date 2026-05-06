import type { NavItem } from './navItems';

const enterpriseNavItems: NavItem[] = [
  { title: 'Overview', path: '/enterprise', icon: 'lucide:house' },
  { title: 'Architecture', path: '/enterprise/architecture', icon: 'lucide:layout-grid' },
  { title: 'Requirements', path: '/enterprise/requirements', icon: 'lucide:clipboard-list' },
  { title: 'Installation', path: '/enterprise/installation', icon: 'lucide:wrench' },
  {
    title: 'Advanced Features',
    path: '/enterprise/advanced-features',
    icon: 'lucide:rocket',
  },
  { title: 'Troubleshooting', path: '/enterprise/troubleshooting', icon: 'lucide:life-buoy' },
  { title: 'Maintenance', path: '/enterprise/maintenance', icon: 'lucide:toolbox' },
];

export default enterpriseNavItems;

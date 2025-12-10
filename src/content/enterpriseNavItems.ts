import { BsRocket } from 'react-icons/bs';
import {
  FaClipboardList,
  FaHouse,
  FaLifeRing,
  FaScrewdriverWrench,
  FaToolbox,
} from 'react-icons/fa6';
import { MdOutlineArchitecture } from 'react-icons/md';
import type { NavItem } from './navItems';

const enterpriseNavItems: NavItem[] = [
  { title: 'Overview', path: '/enterprise', icon: FaHouse },
  { title: 'Architecture', path: '/enterprise/architecture', icon: MdOutlineArchitecture },
  { title: 'Requirements', path: '/enterprise/requirements', icon: FaClipboardList },
  { title: 'Installation', path: '/enterprise/installation', icon: FaScrewdriverWrench },
  {
    title: 'Advanced Features',
    path: '/enterprise/advanced-features',
    icon: BsRocket,
  },
  { title: 'Troubleshooting', path: '/enterprise/troubleshooting', icon: FaLifeRing },
  { title: 'Maintenance', path: '/enterprise/maintenance', icon: FaToolbox },
];

export default enterpriseNavItems;

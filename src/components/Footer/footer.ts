export interface Link {
  text: string;
  href: string;
  internal?: boolean;
}

export interface Category {
  title: string;
  links: Link[];
}

export const companyCategory: Category = {
  title: 'Company',
  links: [
    {
      text: 'About Us',
      href: 'https://mergify.com/about',
    },
    {
      text: 'Careers',
      href: 'https://careers.mergify.com',
    },
    {
      text: 'Customers',
      href: 'https://mergify.com/customers',
    },
  ],
};

export const productCategory: Category = {
  title: 'Products',
  links: [
    {
      text: 'CI Insights',
      href: 'https://mergify.com/product/ci-insights',
    },
    {
      text: 'Merge Queue',
      href: 'https://mergify.com/product/merge-queue',
    },
    {
      text: 'Merge Protections',
      href: 'https://mergify.com/product/merge-protections',
    },
    {
      text: 'Workflow Automation',
      href: 'https://mergify.com/product/workflow-automation',
    },
    {
      text: 'Pricing',
      href: 'https://mergify.com/pricing',
    },
  ],
};

export const communityCategory: Category = {
  title: 'Community',
  links: [
    {
      text: 'Documentation',
      href: '/',
    },
    {
      text: 'Blog',
      href: 'https://mergify.com/blog',
    },
    {
      text: 'Slack',
      href: 'https://slack.mergify.com',
    },
    {
      text: 'Discussions',
      href: 'https://github.com/Mergifyio/mergify/discussions',
    },
  ],
};

export const helpCategory: Category = {
  title: 'Help',
  links: [
    {
      text: 'Service Status',
      href: 'https://status.mergify.com/',
    },
    {
      text: 'Changelog',
      href: '/changelog/',
    },
    {
      text: 'Terms of Service',
      href: 'https://mergify.com/tos',
    },
    {
      text: 'Support',
      href: '/support/',
    },
    {
      text: 'Privacy Policy',
      href: 'https://mergify.com/privacy',
    },
  ],
};

export const defaultConfig = [companyCategory, productCategory, communityCategory, helpCategory];

export interface SocialLink {
  label: string;
  href: string;
  viewBox: string;
  path: string;
}

export const socialLinks: SocialLink[] = [
  {
    label: 'X (Twitter)',
    href: 'https://twitter.com/mergifyio',
    viewBox: '0 0 512 512',
    path: 'M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8l164.9-188.5L26.8 48h145.6l100.5 132.9L389.2 48zm-24.8 373.8h39.1L151.1 88h-42l255.3 333.8z',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/mergify/',
    viewBox: '0 0 448 512',
    path: 'M100.3 448H7.4V148.9h92.9zM53.8 108.1C24.1 108.1 0 83.5 0 53.8a53.8 53.8 0 0 1 107.6 0c0 29.7-24.1 54.3-53.8 54.3zM447.9 448h-92.7V302.4c0-34.7-.7-79.2-48.3-79.2-48.3 0-55.7 37.7-55.7 76.7V448h-92.8V148.9h89.1v40.8h1.3c12.4-23.5 42.7-48.3 87.9-48.3 94 0 111.3 61.9 111.3 142.3V448z',
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@mergifyio',
    viewBox: '0 0 576 512',
    path: 'M549.7 124.1c-6.3-23.7-24.8-42.3-48.3-48.6C458.8 64 288 64 288 64S117.2 64 74.6 75.5c-23.5 6.3-42 24.9-48.3 48.6C14.9 167 14.9 256.4 14.9 256.4s0 89.4 11.4 132.3c6.3 23.7 24.8 41.5 48.3 47.8C117.2 448 288 448 288 448s170.8 0 213.4-11.5c23.5-6.3 42-24.2 48.3-47.8 11.4-42.9 11.4-132.3 11.4-132.3s0-89.4-11.4-132.3zM232.2 337.6V175.2l142.7 81.2-142.7 81.2z',
  },
  {
    label: 'Slack',
    href: 'https://slack.mergify.com',
    viewBox: '0 0 24 24',
    path: 'M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z',
  },
  {
    label: 'GitHub',
    href: 'https://github.com/mergifyio',
    viewBox: '0 0 20 20',
    path: 'M10 0c5.523 0 10 4.59 10 10.253 0 4.529-2.862 8.371-6.833 9.728-.507.101-.687-.219-.687-.492 0-.338.012-1.442.012-2.814 0-.956-.32-1.58-.679-1.898 2.227-.254 4.567-1.121 4.567-5.059 0-1.12-.388-2.034-1.03-2.752.104-.259.447-1.302-.098-2.714 0 0-.838-.275-2.747 1.051A9.396 9.396 0 0 0 10 4.958a9.375 9.375 0 0 0-2.503.345C5.586 3.977 4.746 4.252 4.746 4.252c-.543 1.412-.2 2.455-.097 2.714-.639.718-1.03 1.632-1.03 2.752 0 3.928 2.335 4.808 4.556 5.067-.286.256-.545.708-.635 1.371-.57.262-2.018.715-2.91-.852 0 0-.529-.985-1.533-1.057 0 0-.975-.013-.068.623 0 0 .655.315 1.11 1.5 0 0 .587 1.83 3.369 1.21.005.857.014 1.665.014 1.909 0 .271-.184.588-.683.493C2.865 18.627 0 14.783 0 10.253 0 4.59 4.478 0 10 0',
  },
];

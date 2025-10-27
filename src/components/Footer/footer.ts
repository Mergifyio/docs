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
      href: 'https://mergify.com/about-us',
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
      href: 'https://docs.mergify.com',
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
      href: 'https://docs.mergify.com/changelog/',
    },
    {
      text: 'Terms of Service',
      href: 'https://mergify.com/tos',
    },
    {
      text: 'Support',
      href: 'mailto:support@mergify.com',
    },
    {
      text: 'Privacy Policy',
      href: 'https://mergify.com/privacy',
    },
  ],
};

export const defaultConfig = [companyCategory, productCategory, communityCategory, helpCategory];

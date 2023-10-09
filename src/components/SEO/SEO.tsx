import React from 'react';

import { Helmet } from 'react-helmet';

import { useSiteMetadata } from '../../utils/useSiteMetadata';

interface Props {
  title: string;
  description: string;
  pathname: string;
  children: React.ReactNode
}

export default function SEO({
  title, description, pathname, children,
}: Props) {
  const {
    title: defaultTitle, description: defaultDescription, image, siteUrl,
  } = useSiteMetadata();

  const seo = {
    title: title || defaultTitle,
    description: description || defaultDescription,
    image: `${siteUrl}${image}`,
    url: `${siteUrl}${pathname || ''}`,
  };

  return (
    <Helmet>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta name="image" content={seo.image} />
      <meta name="og:image" content={`${siteUrl}/og-images${pathname || ''}.png`} />
      {children}
    </Helmet>
  );
}

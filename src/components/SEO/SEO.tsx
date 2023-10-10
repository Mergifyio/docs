import React from 'react';

import { Helmet } from 'react-helmet';

import { useSiteMetadata } from '../../utils/useSiteMetadata';

interface Props {
  shortTitle: string;
  longTitle: string;
  description: string;
  pathname: string;
  children: React.ReactNode;
}

export default function SEO({
  shortTitle, longTitle, description, pathname, children,
}: Props) {
  const {
    title: defaultTitle,
    description: defaultDescription,
    image,
    siteUrl,
  } = useSiteMetadata();

  const seo = {
    shortTitle: shortTitle || defaultTitle,
    longTitle: longTitle || defaultTitle,
    description: description || defaultDescription,
    image: `${siteUrl}${image}`,
    url: `${siteUrl}${pathname || ''}`,
  };

  return (
    <Helmet>
      <title>{seo.shortTitle}</title>
      <meta name="description" content={seo.description} />
      <meta name="image" content={seo.image} />

      {/* Open Graph metadata for shearability on socials */}
      <meta property="og:title" content={seo.longTitle} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:url" content={seo.url} />
      <meta property="og:image" content={`${siteUrl}/og-images${pathname || ''}.png`} />
      <meta property="og:type" content="article" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      {children}
    </Helmet>
  );
}

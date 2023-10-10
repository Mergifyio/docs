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
  const isHomepage = pathname === '/';
  const previewImage = isHomepage
    ? `${siteUrl}/og-images/home.png`
    : `${siteUrl}/og-images${pathname || ''}.png`;

  return (
    <Helmet>
      <title>{seo.shortTitle}</title>
      <meta name="description" content={seo.description} />
      <meta name="image" content={seo.image} />

      {/* Open Graph metadata for shearability on socials */}
      <meta property="og:title" content={seo.longTitle} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:url" content={seo.url} />
      <meta
        property="og:image"
        content={previewImage}
      />
      <meta property="og:type" content="article" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter specific tags for sharing */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@mergifyio" />
      <meta name="twitter:title" content={seo.longTitle} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={previewImage} />

      {children}
    </Helmet>
  );
}

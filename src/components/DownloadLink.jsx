import React from 'react';

import { PrimaryLink, useLinkProps } from './RelativeLink';

// eslint-disable-next-line react/prop-types
export default function DownloadLink({ path, children }) {
  const linkProps = useLinkProps(path);
  return (
    <PrimaryLink
      {...linkProps}
      to={undefined}
      href={linkProps.to}
      download
      target="_blank"
    >
      {children}
    </PrimaryLink>
  );
}

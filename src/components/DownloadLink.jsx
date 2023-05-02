import {PrimaryLink, useLinkProps} from './RelativeLink'
import React from 'react'

export default function DownloadLink({path, children}) {
  const linkProps = useLinkProps(path);
  return (
    <PrimaryLink
      {...linkProps}
      to={undefined}
      href={linkProps.to}
      download
      target='_blank'
    >
      {children}
    </PrimaryLink>
  )
}
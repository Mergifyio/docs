import React from 'react';

// TODO: Migrate to tsx to enforce `alt` property via props

export function Screenshot(props) {
  const imgStyle = {
    margin: 'auto',
    marginBottom: '1em',
  };

  return (
    // eslint-disable-next-line jsx-a11y/alt-text
    <img style={imgStyle} {...props} />
  );
}

export function IntegrationLogo(props) {
  const imgStyle = {
    float: 'right',
    marginLeft: '1em',
    marginBottom: '1em',
    maxWidth: '256px',
    maxHeight: '256px',
  };

  return (
    // eslint-disable-next-line jsx-a11y/alt-text
    <img style={imgStyle} {...props} />
  );
}

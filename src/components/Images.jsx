import React from 'react';

export function Screenshot(props) {

  const imgStyle = {
    margin: 'auto',
    marginBottom: '1em',
  };

  return (
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
    <img style={imgStyle} {...props} />
  );
}

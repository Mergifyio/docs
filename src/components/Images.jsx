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

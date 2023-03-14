import React from 'react';

export function Screenshot(props) {

  const imgStyle = {
    margin: 'auto',
  };

  return (
    <img style={imgStyle} {...props} />
  );
}

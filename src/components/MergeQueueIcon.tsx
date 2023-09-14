import React from 'react';

import { ReactComponent as Icon } from '../assets/merge-queue-icon.svg';

interface Props {
  width?: React.CSSProperties['width'];
  style?: React.CSSProperties;
}

export default function MergeQueueIcon({ width = 20, style }: Props) {
  return (
    <div style={{ width, ...style }}>
      <Icon />
    </div>
  );
}

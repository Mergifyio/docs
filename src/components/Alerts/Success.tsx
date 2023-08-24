import React from 'react';

import { BaseAlert } from './BaseAlert';

interface Props {
  children: React.ReactNode;
  title?: string;
}

export function Success({ children, title = 'Success' }: Props) {
  return (
    <BaseAlert title={title} status="success">
      {children}
    </BaseAlert>
  );
}

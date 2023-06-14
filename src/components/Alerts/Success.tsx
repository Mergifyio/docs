import React from 'react';

import { BaseAlert } from './BaseAlert';

interface Props {
  children: React.ReactNode;
}

export function Success({ children }: Props) {
  return (
    <BaseAlert title="Success" status="success">
      {children}
    </BaseAlert>
  );
}

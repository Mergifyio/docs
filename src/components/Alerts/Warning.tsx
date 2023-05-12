import React from 'react';
import { BaseAlert } from './BaseAlert';

interface Props {
  children: React.ReactNode;
}

export const Warning = ({children}: Props) => {
  return (
   <BaseAlert title='Warning' status='warning'>
    {children}
   </BaseAlert>
  );
};

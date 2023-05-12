import React from 'react';
import { BaseAlert } from './BaseAlert';

interface Props {
  children: React.ReactNode;
}

export const Danger = ({children}: Props) => {
  return (
   <BaseAlert title='Heads-up!' status='error'>
    {children}
   </BaseAlert>
  );
};

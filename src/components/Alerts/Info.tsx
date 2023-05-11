import React from 'react';
import { BaseAlert } from './BaseAlert';

interface Props {
  children: React.ReactNode;
}

export const Info = ({children}: Props) => {
  return (
   <BaseAlert title='Note' status='info'>
    {children}
   </BaseAlert>
  );
};

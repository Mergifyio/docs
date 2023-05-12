import React from 'react';
import {Alert, AlertDescription, AlertIcon, AlertProps, AlertTitle, Box} from '@chakra-ui/react';

interface Props {
  children: React.ReactNode;
  title: string;
  alertProps?: AlertProps;
  status: AlertProps['status']
}

export const BaseAlert = ({children, title, alertProps, status}: Props) => {
  return (
    <Alert
      variant='left-accent'
      status={status}
      {...alertProps}
    >
      <AlertIcon />
      <Box>
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>
          {children}
        </AlertDescription>
      </Box>
    </Alert>
  );
};

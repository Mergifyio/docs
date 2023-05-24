import {ColorHues} from '@chakra-ui/react';
import {mix} from 'polished';

const body = "'Source Sans Pro', sans-serif";
export const fonts = {
  body,
  heading: body,
  mono: "'Source Code Pro', monospace"
};

export const components = {
  Heading: {
    baseStyle: {
      fontWeight: 'semibold'
    }
  }
};

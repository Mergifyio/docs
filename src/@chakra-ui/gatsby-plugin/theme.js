import { extendTheme } from '@chakra-ui/react';

import { components, fonts } from '../../chakra-helpers/helpers';

const blue = {
  50: '#ddeef8',
  100: '#badff3',
  200: '#98ccec',
  300: '#75bce6',
  400: '#54ace0',
  500: '#1f79ac',
  600: '#196189',
  700: '#144767',
  800: '#0a2534',
  900: '#000000',
};

const theme = extendTheme({
  config: {
    initialColorMode: 'system',
  },
  styles: {
    global: {
      strong: {
        fontWeight: 'strong',
      },
    },
  },
  semanticTokens: {
    fontWeights: {
      strong: {
        default: 'semibold',
        _dark: 'bold',
      },
    },
    colors: {
      bg: {
        default: 'white',
        _dark: 'blue.800',
      },
      primary: {
        default: 'blue.500',
        _dark: 'blue.500',
      },
      secondary: {
        default: 'pink.600',
        _dark: 'pink.300',
      },
      tertiary: {
        default: 'teal.600',
        _dark: 'teal.300',
      },
    },
  },
  components: {
    ...components,
    Table: {
      baseStyle: {
        table: {
          borderCollapse: 'separate',
          borderSpacing: 0,
          borderWidth: '1px',
          rounded: 'md',
        },
        th: {
          fontWeight: 'normal',
        },
      },
    },
  },
  fonts,
  colors: {
    blue,
  },
});

export default theme;

// Shut down a warning, we don't need baseTheme but chakra expect it to be exported
export const baseTheme = {};

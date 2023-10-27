import {
  Box,
  Button,
  Heading,
  ListItem,
  OrderedList,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  UnorderedList,
} from '@chakra-ui/react';
import React, {
  Fragment,
} from 'react';

import {
  MarkdownCodeBlock,
} from '../chakra-helpers/CodeBlock';

import {
  MultiCodeBlock,
} from '../chakra-helpers/MultiCodeBlock';

import Blockquote from './Blockquote';
import CodeColumns from './CodeColumns';
import ExpansionPanel, {
  ExpansionPanelList,
  ExpansionPanelListItem,
} from './ExpansionPanel';

import InlineCode from './InlineCode';
import RelativeLink, { ButtonLink } from './RelativeLink';

const LIST_SPACING = 4;

const NESTED_LIST_STYLES = {
  [['ul', 'ol']]: {
    mt: 3,
    fontSize: 'md',
    lineHeight: 'normal',
  },
};

export const components = {
  h1: (props) => <Heading as="h1" size="2xl" {...props} />,
  h2: (props) => <Heading as="h2" size="xl" {...props}><a href={`#${props.id}`}>{props.children}</a></Heading>,
  h3: (props) => <Heading as="h3" size="lg" {...props}><a href={`#${props.id}`}>{props.children}</a></Heading>,
  h4: (props) => <Heading as="h4" size="md" {...props}><a href={`#${props.id}`}>{props.children}</a></Heading>,
  h5: (props) => <Heading as="h5" size="sm" {...props}><a href={`#${props.id}`}>{props.children}</a></Heading>,
  h6: (props) => <Heading as="h6" size="xs" {...props}><a href={`#${props.id}`}>{props.children}</a></Heading>,
  ul: (props) => (
    <UnorderedList
      spacing={LIST_SPACING}
      sx={{
        ...NESTED_LIST_STYLES,
        ul: {
          listStyleType: 'circle',
        },
      }}
      {...props}
    />
  ),
  ol: (props) => (
    <OrderedList spacing={LIST_SPACING} sx={NESTED_LIST_STYLES} {...props} />
  ),
  li: (props) => (
    <ListItem
      sx={{
        '>': {
          ':not(:last-child)': {
            mb: 3,
          },
        },
      }}
      {...props}
    />
  ),
  p: Text,
  a: RelativeLink,
  pre: MarkdownCodeBlock,
  table: (props) => (
    <Box
      rounded="md"
      borderWidth={1}
      overflow="auto"
      sx={{ table: { borderWidth: 0 } }}
    >
      <Table {...props} />
    </Box>
  ),
  thead: Thead,
  tbody: Tbody,
  tr: Tr,
  th: Th,
  td: (props) => (
    <Td
      sx={{
        fontSize: 'md',
      }}
      {...props}
    />
  ),
  blockquote: Blockquote,
  undefined: Fragment, // because remark-a11y-emoji adds <undefined> around stuff
};

export const mdxComponents = {
  ...components,
  inlineCode: InlineCode,
  code: InlineCode,
  Button, // TODO: consider making pages import this from @chakra-ui/react
  ExpansionPanel,
  ExpansionPanelList,
  ExpansionPanelListItem,
  MultiCodeBlock,
  CodeColumns,
  ButtonLink,
};

import { VStack, Text } from '@chakra-ui/react';
import Fuse from 'fuse.js';
import { Link } from 'gatsby';
import React from 'react';

import { getHighlightedMatches } from './searchPage';
import { Page } from './types';

interface Props extends Fuse.FuseResult<Page> {}

export default function Preview({ item: { childMdx }, matches }: Props) {
  return (
    <VStack padding={4} justifyContent="flex-start" flex={1} height="100%">
      <Text
        as={Link}
        to={childMdx.fields.slug}
        _hover={{ textDecoration: 'underline' }}
        fontSize="4xl"
        align="center"
        dangerouslySetInnerHTML={{
          __html: getHighlightedMatches(
            matches?.find((match) => match.value === childMdx.frontmatter.title),
            childMdx.frontmatter.title,
          ),
        }}
      />
      <Text
        fontSize="xl"
        align="center"
        marginTop={-2}
        dangerouslySetInnerHTML={{
          __html: getHighlightedMatches(
            matches?.find((match) => match.value === childMdx.frontmatter.description),
            childMdx.frontmatter.description,
          ),
        }}
      />
      <Text
        fontSize="md"
        align="center"
        marginTop={8}
      >
        {childMdx.excerpt}
      </Text>
    </VStack>
  );
}

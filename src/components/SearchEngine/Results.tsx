import {
  Box, VStack, Text, useColorModeValue, HStack, Divider, Show,
} from '@chakra-ui/react';
import Fuse from 'fuse.js';
import { Link } from 'gatsby';
import React, { useEffect, useState } from 'react';

import { BsArrowReturnLeft } from 'react-icons/bs';

import Preview from './PageDetails';
import { getHighlightedMatches } from './searchPage';
import { Page } from './types';

interface PageResultProps extends Fuse.FuseResult<Page> {
  onHover: () => void;
  active: boolean;
}

function PageResult({
  item: { childMdx }, matches, onHover, active,
}: PageResultProps) {
  const activeBackground = useColorModeValue('blue.100', 'blue.700');

  return (
    <HStack
      onMouseOver={onHover}
      justifyContent="space-between"
      width="100%"
      paddingX={4}
      paddingY={2}
      background={active ? activeBackground : 'none'}
      cursor="pointer"
      as={Link}
      to={childMdx.fields.slug}
      _focus={{ outline: 'auto' }}
    >
      <Box>
        <Text
          fontSize="lg"
          dangerouslySetInnerHTML={{
            __html: getHighlightedMatches(
              matches?.find((match) => match.value === childMdx.frontmatter.title),
              childMdx.frontmatter.title,
            ),
          }}
        />
        <Text
          fontSize="sm"
          dangerouslySetInnerHTML={{
            __html: getHighlightedMatches(
              matches?.find((match) => match.value === childMdx.frontmatter.description),
              childMdx.frontmatter.description,
            ),
          }}
          noOfLines={1}
          color="gray.500"
        />
      </Box>
      {active && <BsArrowReturnLeft />}
    </HStack>
  );
}

interface ResultsProps {
  results: Fuse.FuseResult<Page>[];
}

export default function Results({ results }: ResultsProps) {
  const [focusedPage, setFocusedPage] = useState<Fuse.FuseResult<Page> | null>(results[0] ?? null);

  const changeFocusedPage = (page: Fuse.FuseResult<Page>) => () => {
    setFocusedPage(page);
  };

  useEffect(() => {
    setFocusedPage(results[0] ?? null);
  }, [results]);

  return (
    <HStack height="100%">
      <VStack flex={1} alignItems="flex-start" height="100%" overflow="auto">
        {results.map((page) => (
          <PageResult
            active={focusedPage?.item.id === page.item.id}
            onHover={changeFocusedPage(page)}
            {...page}
            key={page.item.id}
          />
        ))}
      </VStack>
      <Divider orientation="vertical" />
      <Show above="md">
        {focusedPage && <Preview key={focusedPage.item.id} {...focusedPage} />}
      </Show>
    </HStack>
  );
}

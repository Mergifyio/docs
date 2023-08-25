import {
  Box, VStack, Text, useColorModeValue, HStack, Divider, Show,
} from '@chakra-ui/react';
import Fuse from 'fuse.js';
import { Link, navigate } from 'gatsby';
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
  item: { childMdx, id }, matches, onHover, active,
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
      id={id}
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

  const handleKeysNavigation = (e: KeyboardEvent) => {
    const getCurrentFocusedIndex = (current: Fuse.FuseResult<Page> | null) => (
      results.findIndex((el) => el.item.id === current?.item.id)
    );

    const scrollToFocusedPage = (page: Fuse.FuseResult<Page> | null) => {
      if (page) {
        const element = document.getElementById(page.item.id);
        const container = element?.parentElement;

        if (element && container) {
          const containerHeight = container.clientHeight;
          const elementTop = element.offsetTop;
          const isHiddenTop = elementTop <= container.scrollTop;
          const isVisibleAtBottom = elementTop + element.clientHeight <= containerHeight;

          if (isHiddenTop || !isVisibleAtBottom) {
            container.scrollTo({
              top: elementTop,
            });
          }
        }
      }
    };

    if (e.key === 'ArrowDown') {
      setFocusedPage((current) => {
        const currentIndex = getCurrentFocusedIndex(current);
        const newFocused = results[Math.min(currentIndex + 1, results.length - 1)];

        scrollToFocusedPage(newFocused);

        return newFocused;
      });
    } else if (e.key === 'ArrowUp') {
      setFocusedPage((current) => {
        const currentIndex = getCurrentFocusedIndex(current);
        const newFocused = results[Math.max(currentIndex - 1, 0)];

        scrollToFocusedPage(newFocused);

        return newFocused;
      });
    } else if (e.key === 'Enter') {
      if (focusedPage) navigate(focusedPage?.item.childMdx.fields.slug);
    }
  };

  useEffect(() => {
    setFocusedPage(results[0] ?? null);
  }, [results]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeysNavigation);

    return () => window.removeEventListener('keydown', handleKeysNavigation);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, focusedPage]);

  return (
    <HStack height="100%" overflow="hidden">
      <VStack flex={1} alignItems="flex-start" height="100%" overflow="auto" position="relative">
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

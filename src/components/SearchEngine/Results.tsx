import {
  Box, VStack, Text, useColorModeValue, HStack, Divider, Show,
} from '@chakra-ui/react';
import { Link, navigate } from 'gatsby';
import React, { useEffect, useState } from 'react';

import { BsArrowReturnLeft } from 'react-icons/bs';

import Preview from './PageDetails';
import { AlgoliaResult } from './types';

interface PageResultProps extends AlgoliaResult {
  onHover: () => void;
  active: boolean;
}

function PageResult({
  objectID, frontmatter, _highlightResult, fields, onHover, active,
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
      to={fields.slug}
      _focus={{ outline: 'auto' }}
      id={objectID}
    >
      <Box>
        <Text
          fontSize="lg"
          noOfLines={1}
          dangerouslySetInnerHTML={{ __html: _highlightResult?.frontmatter?.title?.value ?? '' }}
        />
        <Text
          fontSize="sm"
          noOfLines={1}
          color="gray.500"
          dangerouslySetInnerHTML={{ __html: _highlightResult?.frontmatter?.description?.value ?? '' }}
        />
      </Box>
      {active && <BsArrowReturnLeft />}
    </HStack>
  );
}

interface ResultsProps {
  results: AlgoliaResult[];
}

export default function Results({ results }: ResultsProps) {
  const [focusedPage, setFocusedPage] = useState<AlgoliaResult | null>(results[0] ?? null);

  const changeFocusedPage = (page: AlgoliaResult) => () => {
    setFocusedPage(page);
  };

  const handleKeysNavigation = (e: KeyboardEvent) => {
    const getCurrentFocusedIndex = (current: AlgoliaResult | null) => results
      .findIndex((el) => el.objectID === current?.objectID);

    const scrollToFocusedPage = (page: AlgoliaResult | null) => {
      if (page) {
        const element = document.getElementById(page.objectID);
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
      if (focusedPage) navigate(focusedPage?.fields.slug);
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
    <HStack
      css={{
        em: {
          color: '#003dff',
          fontStyle: 'normal',
          fontWeight: '500',
        },
      }}
      height="100%"
      overflow="hidden"
    >
      <VStack flex={1} alignItems="flex-start" height="100%" overflow="auto" position="relative">
        {results.map((page) => (
          <PageResult
            active={focusedPage?.objectID === page.objectID}
            onHover={changeFocusedPage(page)}
            {...page}
            key={page.objectID}
          />
        ))}
      </VStack>
      <Divider orientation="vertical" />
      <Show above="md">
        {focusedPage && <Preview key={focusedPage.objectID} {...focusedPage} />}
      </Show>
    </HStack>
  );
}

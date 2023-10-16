import {
  VStack, Text, ListItem, theme, Divider, List, useColorModeValue,
} from '@chakra-ui/react';
import { Link } from 'gatsby';
import React from 'react';

import { renderMdxTable } from '../../utils/mdxast';

import { AlgoliaResult } from './types';

type HighlightHeading = NonNullable<NonNullable<AlgoliaResult['_highlightResult']>['tableOfContents']>;

interface TableOfContentsProps {
  tableOfContents: HighlightHeading;
  slug: string;
}

function TableOfContents({ tableOfContents, slug }: TableOfContentsProps) {
  const hoverColor = useColorModeValue('black', 'white');
  const color = useColorModeValue(theme.colors.gray[600], theme.colors.gray[400]);

  function renderHeading(heading: HighlightHeading) {
    return (
      <>
        <ListItem
          textAlign="left"
          fontSize="sm"
          css={{
            color,
          }}
          _hover={{
            color: hoverColor,
          }}
        >
          <Text
            as={Link}
            to={`${slug}${heading.url?.value.replaceAll('<em>', '').replaceAll('</em>', '')}`} // Remove highlight markups
            dangerouslySetInnerHTML={{ __html: heading.title?.value ?? '' }}
          />
        </ListItem>
        {heading.items && (
          <List spacing={2} paddingLeft={4}>
            {heading.items.map((item) => renderHeading(item as any))}
          </List>
        )}
      </>
    );
  }

  return (
    <List spacing={2}>
      {tableOfContents.items?.map((item) => renderHeading(item as any))}
    </List>
  );
}

interface Props extends AlgoliaResult {}

export default function Preview({
  fields, _highlightResult, _snippetResult, tables,
}: Props) {
  return (
    <VStack padding={4} justifyContent="flex-start" alignItems="start" flex={2} height="100%" overflow="auto">
      <Text
        as={Link}
        to={fields.slug}
        _hover={{ textDecoration: 'underline' }}
        fontSize="4xl"
        lineHeight={1.2}
        dangerouslySetInnerHTML={{ __html: _highlightResult?.frontmatter?.title?.value ?? '' }}
      />
      <Text
        fontSize="xl"
        dangerouslySetInnerHTML={{ __html: _highlightResult?.frontmatter?.description?.value ?? '' }}
      />
      <Text
        fontSize="md"
        marginY={2}
        dangerouslySetInnerHTML={{ __html: _snippetResult?.excerpt?.value ?? '' }}
      />
      {_highlightResult?.tables?.filter((el) => el?.data?.matchLevel !== 'none' || (el?.content && el.content.matchLevel !== 'none')).map(
        (table, index) => renderMdxTable({
          data: table?.data?.value,
          node: tables[index].node,
          content: table?.content?.value,
        }),
      )}
      {_highlightResult?.tableOfContents && (
        <>
          <Divider marginY={2} />
          <VStack alignItems="flex-start">
            <Text fontWeight="bold" colorScheme="gray" fontSize="sm">ON THIS PAGE</Text>
            <TableOfContents
              tableOfContents={_highlightResult?.tableOfContents}
              slug={fields.slug}
            />
          </VStack>
        </>
      )}
    </VStack>
  );
}

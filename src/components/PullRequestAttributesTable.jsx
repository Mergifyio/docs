import {
  Table, TableCaption, Tbody, Td, Th, Thead, Tr,
} from '@chakra-ui/react';
import React from 'react';

import ReactMarkdown from 'react-markdown';

import rehypeRaw from 'rehype-raw';

import configSchema from '../../static/mergify-configuration-openapi.json';

import { getValueType, HighlightCode } from './ConfigOptions';

import InlineCode from './InlineCode';

import { mdxComponents } from './mdxComponents';

// eslint-disable-next-line react/prop-types
export default function PullRequestAttributesTable({ staticAttributes }) {
  const attributes = staticAttributes
  ?? configSchema?.definitions?.PullRequestAttribute?.enum ?? [];

  return (
    <Table>
      <TableCaption>Pull Request Attributes</TableCaption>
      <Thead>
        <Tr>
          <Th>Attribute name</Th>
          <Th>Value type</Th>
          <Th>Description</Th>
        </Tr>
      </Thead>
      <Tbody>
        {attributes.map((attr) => {
          const valueType = getValueType(attr);

          return (
            <Tr>
              <Td sx={{ whiteSpace: 'nowrap' }}>
                <InlineCode dangerouslySetInnerHTML={{ __html: attr.key }} />
              </Td>
              <Td lineHeight="7">{valueType}</Td>
              <Td lineHeight="7">
                <ReactMarkdown
                  // Need that rehype-raw plugin to render HTML tags.
                  // It allows <em> tags from algolia to render
                  rehypePlugins={[rehypeRaw]}
                  components={{ ...mdxComponents, code: HighlightCode }}
                >
                  {attr.description}
                </ReactMarkdown>
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
}

import {
  Table, TableCaption, Tbody, Td, Th, Thead, Tr,
} from '@chakra-ui/react';
import React from 'react';

import ReactMarkdown from 'react-markdown';

import configSchema from '../../static/mergify-configuration-openapi.json';

import { getValueType } from './ConfigOptions';

import InlineCode from './InlineCode';

import { mdxComponents } from './Page';

export default function PullRequestAttributesTable() {
  const attributes = configSchema?.definitions?.PullRequestAttribute?.enum ?? [];

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
                <InlineCode>{attr.key}</InlineCode>
              </Td>
              <Td lineHeight="7">{valueType}</Td>
              <Td lineHeight="7">
                <ReactMarkdown components={mdxComponents}>
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

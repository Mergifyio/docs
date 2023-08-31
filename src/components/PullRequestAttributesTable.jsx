import {
  Table, TableCaption, Tbody, Td, Th, Thead, Tr, Link,
} from '@chakra-ui/react';
import React from 'react';

import ReactMarkdown from 'react-markdown';

import configSchema from '../content/mergify-configuration-openapi.json';

import { getTypeLink } from './ConfigOptions';

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
          const dataTypeLink = getTypeLink(attr.$ref);

          return (
            <Tr>
              <Td sx={{ whiteSpace: 'nowrap' }}>
                <InlineCode>{attr.key}</InlineCode>
              </Td>
              <Td>{dataTypeLink ? <Link color="primary" textDecoration="underline" href={dataTypeLink}>{attr.dataType}</Link> : attr.dataType}</Td>
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

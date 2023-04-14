import { Table, TableCaption, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import React from 'react'
import configSchema from '../assets/mergify-schema.json';
import ReactMarkdown from 'react-markdown';
import InlineCode from './InlineCode';

export default function PullRequestAttributesTable() {
  /**
   * TODO: Source json schema from a shared endpoint somewhere
   */
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
        {attributes.map(attr => (
          <Tr>
            <Td fontFamily="mono" fontSize='md' sx={{whiteSpace: 'nowrap', color: "#d63384"}}>
              {attr.key}
            </Td>
            <Td>{attr.dataType}</Td>
            <Td>
              <ReactMarkdown components={{
                code: InlineCode
              }}>
                {attr.description}
              </ReactMarkdown>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  )
}

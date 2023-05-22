import { Table, TableCaption, Thead, Tr, Th, Tbody, Td } from '@chakra-ui/react';
import React from 'react'
import ReactMarkdown from 'react-markdown';
import configSchema from '../content/mergify-configuration-openapi.json';
import InlineCode from './InlineCode';

interface Props {
  /** Action's name to retrieve its options */
  action: string;
}

interface OptionDefinition {
  valueType: string;
  description: string;
  default: string;
  $ref: any; // Not used here
}

export default function ActionOptionsTable({ action }: Props) {
  const options = configSchema.definitions.Actions.properties[action].properties as {[optionKey: string]: OptionDefinition};

  return (
    <Table>
      <TableCaption>Pull Request Attributes</TableCaption>
      <Thead>
        <Tr>
          <Th>Key name</Th>
          <Th>Value type</Th>
          <Th>Default</Th>
          <Th>Description</Th>
        </Tr>
      </Thead>
      <Tbody>
        {Object.entries(options).map(([optionKey, definition]) => (
          <Tr>
            <Td sx={{whiteSpace: 'nowrap'}}>
              <code>{optionKey}</code>
            </Td>
            <Td>{definition.valueType}</Td>
            <Td>
              <ReactMarkdown components={{
                code: InlineCode
              }}>
                {definition.default}
              </ReactMarkdown>
            </Td>
            <Td>
              <ReactMarkdown>
                {definition.description}
              </ReactMarkdown>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  )
}

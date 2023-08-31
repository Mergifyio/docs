import {
  Table, Thead, Tr, Th, Tbody, Td, Link,
} from '@chakra-ui/react';
import React from 'react';
import ReactMarkdown from 'react-markdown';

import configSchema from '../content/mergify-configuration-openapi.json';

import { getTypeLink } from './ConfigOptions';

import InlineCode from './InlineCode';
import { mdxComponents } from './Page';

interface Props {
  /** Action's name to retrieve its options */
  action: keyof typeof configSchema.definitions.Actions.properties;
}

interface OptionDefinition {
  valueType: string;
  description: string;
  default: string | boolean;
  $ref: any;
}

export default function ActionOptionsTable({ action }: Props) {
  const options = configSchema.definitions.Actions
    .properties[action].properties as { [optionKey: string]: OptionDefinition };

  const hasDefaultValue = (definition: OptionDefinition) => (
    definition.default !== undefined && String(definition.default).length > 0
  );

  return (
    <Table>
      <Thead>
        <Tr>
          <Th>Key name</Th>
          <Th>Value type</Th>
          <Th>Default</Th>
          <Th>Description</Th>
        </Tr>
      </Thead>
      <Tbody>
        {Object.entries(options).map(([optionKey, definition]) => {
          const valueTypeLink = getTypeLink(definition.$ref);

          return (
            <Tr>
              <Td sx={{ whiteSpace: 'nowrap' }}>
                <InlineCode>{optionKey}</InlineCode>
              </Td>
              <Td>{valueTypeLink ? <Link color="primary" textDecoration="underline" href={valueTypeLink}>{definition.valueType}</Link> : definition.valueType}</Td>
              <Td lineHeight="7">
                {hasDefaultValue(definition) && (
                  <InlineCode>
                    {String(definition.default)}
                  </InlineCode>
                )}
              </Td>
              <Td lineHeight="7">
                <ReactMarkdown components={mdxComponents as any}>
                  {definition.description}
                </ReactMarkdown>
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
}

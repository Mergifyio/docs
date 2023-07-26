import {
  Table, Thead, Tr, Th, Tbody, Td, Link,
} from '@chakra-ui/react';
import React from 'react';
import ReactMarkdown from 'react-markdown';

import configSchema from '../content/mergify-configuration-openapi.json';
import { getTypeLink } from '../utils/getTypeLink';

import InlineCode from './InlineCode';
import { mdxComponents } from './Page';

interface Props {
  /** Name to retrieve its options */
  name: keyof typeof configSchema.definitions;
}

interface OptionDefinition {
  valueType: string;
  description: string;
  default: string | boolean;
  $ref: any;
}

export default function OptionsTable({ name }: Props) {
  const options = configSchema.definitions[name]
    .properties as { [optionKey: string]: OptionDefinition };

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
          const typeLink = (definition.type === 'array') ? getTypeLink(definition.items.$ref) : undefined;

          return (
            <Tr>
              <Td sx={{ whiteSpace: 'nowrap' }}>
                <InlineCode>{optionKey}</InlineCode>
              </Td>
              <Td>{typeLink ? <>{definition.type} of <Link color="primary" textDecoration="underline" href={typeLink}>{definition.items.valueName}</Link></> : definition.type}</Td>
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

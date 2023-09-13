import {
  Table, Thead, Tr, Th, Tbody, Td, Badge,
} from '@chakra-ui/react';
import React from 'react';
import ReactMarkdown from 'react-markdown';

import configSchema from '../content/mergify-configuration-openapi.json';

import { getValueType } from './ConfigOptions';

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
  deprecated?: boolean;
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
          <Th />
        </Tr>
      </Thead>
      <Tbody>
        {Object.entries(options).map(([optionKey, definition]) => {
          const valueType = getValueType(definition);
          const { deprecated } = definition;

          return (
            <>
              <Tr position="relative">
                <Td sx={{ whiteSpace: 'nowrap' }}>
                  <InlineCode>{optionKey}</InlineCode>
                </Td>
                <Td>{valueType}</Td>
                <Td lineHeight="7">
                  {hasDefaultValue(definition) && (
                    <InlineCode>
                      {String(definition.default)}
                    </InlineCode>
                  )}
                </Td>
                <Td>
                  {deprecated && <Badge colorScheme="orange" top={0} left={0}>deprecated</Badge>}
                </Td>
              </Tr>
              <Tr>
                {/* FIXME: don't hardcode the border color like that */}
                <Td lineHeight="7" colspan="4" style={{ borderBottom: '2px solid #eee' }}>
                  <ReactMarkdown components={mdxComponents as any}>
                    {definition.description}
                  </ReactMarkdown>
                </Td>
              </Tr>
            </>
          );
        })}
      </Tbody>
    </Table>
  );
}

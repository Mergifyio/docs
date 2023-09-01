import {
  Table, Thead, Tr, Th, Tbody, Td,
} from '@chakra-ui/react';
import React from 'react';
import ReactMarkdown from 'react-markdown';

import configSchema from '../content/mergify-configuration-openapi.json';

import { getValueType, OptionDefinition } from './ConfigOptions';

import InlineCode from './InlineCode';
import { mdxComponents } from './Page';

interface Props {
  /** Name to retrieve its options */
  name: keyof typeof configSchema.definitions;
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
        </Tr>
      </Thead>
      <Tbody>
        {Object.entries(options).map(([optionKey, definition]) => {
          const valueType = getValueType(definition);

          return (
            <>
              <Tr>
                <Td>
                  <InlineCode>{optionKey}</InlineCode>
                </Td>
                <Td>
                  {valueType}
                </Td>
                <Td lineHeight="7">
                  {hasDefaultValue(definition) && (
                  <InlineCode>
                    {String(definition.default)}
                  </InlineCode>
                  )}
                </Td>
              </Tr>
              <Tr>
                {/* FIXME: don't hardcode the border color like that */}
                <Td lineHeight="7" colspan="3" style={{ borderBottom: '2px solid #eee' }}>
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

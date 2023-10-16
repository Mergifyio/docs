import {
  Table, Thead, Tr, Th, Tbody, Td, Badge,
} from '@chakra-ui/react';
import * as yaml from 'js-yaml';
import React from 'react';
import ReactMarkdown from 'react-markdown';

import rehypeRaw from 'rehype-raw';

import configSchema from '../../static/mergify-configuration-openapi.json';

import { getValueType, HighlightCode, OptionDefinition } from './ConfigOptions';

import InlineCode from './InlineCode';
import { mdxComponents } from './mdxComponents';

interface Props {
  /** Name to retrieve its options */
  name: keyof typeof configSchema.definitions;
  options?: { [optionKey: string]: OptionDefinition }
}

interface RootProps {
  /** Name to retrieve its options */
  name: keyof typeof configSchema.properties;
}

export function RootOptionsTable({ name }: RootProps) {
  const options = configSchema.properties[name]
    .properties as { [optionKey: string]: OptionDefinition };

  return OptionsTableBase(options);
}

export default function OptionsTable({ name }: Props) {
  const options = configSchema.definitions[name]
    .properties as { [optionKey: string]: OptionDefinition };

  return OptionsTableBase(options);
}

export function OptionsTableBase(options: OptionDefinition) {
  const hasDefaultValue = (definition: OptionDefinition) => (
    definition.default !== undefined
  );

  const shouldHideDefaultColumn = Object.entries(options)
    .every(([, definition]) => !definition.default);
  const shouldHideDeprecatedColumn = Object.entries(options)
    .every(([, definition]) => !definition.deprecated);

  return (
    <Table>
      <Thead>
        <Tr>
          <Th>Key name</Th>
          <Th>Value type</Th>
          {!shouldHideDefaultColumn && <Th>Default</Th>}
          {!shouldHideDeprecatedColumn && <Th />}
        </Tr>
      </Thead>
      <Tbody>
        {Object.entries(options).map(([optionKey, definition]) => {
          const valueType = getValueType(definition);
          const { deprecated } = definition;

          return (
            <>
              <Tr position="relative">
                <Td>
                  <InlineCode>{optionKey}</InlineCode>
                </Td>
                <Td lineHeight="7">
                  {valueType}
                </Td>
                {!shouldHideDefaultColumn && (
                  <Td lineHeight="7">
                    {hasDefaultValue(definition) && (
                      <InlineCode
                        dangerouslySetInnerHTML={{
                          __html: yaml.dump(definition.default, {
                            noCompatMode: true, lineWidth: -1, quotingType: '"', noRefs: true,
                          }),
                        }}
                      />
                    )}
                  </Td>
                )}
                {!shouldHideDeprecatedColumn && (
                  <Td>
                    {deprecated && <Badge colorScheme="orange" top={0} left={0}>deprecated</Badge>}
                  </Td>
                )}
              </Tr>
              {definition.description !== undefined
                && (
                <Tr>
                  {/* FIXME: don't hardcode the border color like that */}
                  <Td lineHeight="7" colSpan={shouldHideDefaultColumn ? '3' : '4'} style={{ borderBottom: '2px solid #eee' }}>
                    <ReactMarkdown
                      rehypePlugins={[rehypeRaw as any]}
                      components={{ ...mdxComponents, code: HighlightCode } as any}
                    >
                      {definition.description}
                    </ReactMarkdown>
                  </Td>
                </Tr>
                )}
            </>
          );
        })}
      </Tbody>
    </Table>
  );
}

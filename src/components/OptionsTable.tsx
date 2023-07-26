import {
  Table, Thead, Tr, Th, Tbody, Td, Link,
} from '@chakra-ui/react';
import React from 'react';
import ReactMarkdown from 'react-markdown';

import configSchema from '../content/mergify-configuration-openapi.json';
import { getTypeLink, getTypeDescription } from '../utils/getTypeLink';

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
        </Tr>
      </Thead>
      <Tbody>
        {Object.entries(options).map(([optionKey, definition]) => {
          let valueType = null;

          if (definition.type === 'array') {
            const typeLink = getTypeLink(definition.items.$ref);
            const typeDescription = (
              <ReactMarkdown components={mdxComponents as any}>
                {getTypeDescription(definition.items.$ref)}
              </ReactMarkdown>
            );

            if (typeLink !== undefined) {
              valueType = (
                <>list of
                  <Link color="primary" textDecoration="underline" href={typeLink}>
                    {typeDescription}
                  </Link>
                </>
              );
            } else valueType = <>list of {typeDescription}</>;
          } else if (definition.$ref !== undefined) {
            const typeLink = getTypeLink(definition.$ref);
            const typeDescription = (
              <ReactMarkdown components={mdxComponents as any}>
                {getTypeDescription(definition.$ref)}
              </ReactMarkdown>
            );

            if (typeLink !== undefined) {
              valueType = (
                <Link color="primary" textDecoration="underline" href={typeLink}>
                  {typeDescription}
                </Link>
              );
            } else valueType = typeDescription;
          } else {
            valueType = definition.type;
          }

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

import {
  Link,
} from '@chakra-ui/react';
import React from 'react';

import ReactMarkdown from 'react-markdown';

import configSchema from '../content/mergify-configuration-openapi.json';

import InlineCode from './InlineCode';
import { mdxComponents } from './Page';

// FIXME: move this to JSON schema?
const valueTypeLinks: { [key: string]: string } = {
  '/definition/TemplateArray': '/configuration/data-types#template',
  '/definition/UserArray': '/configuration/data-types#template',
  '/definition/Template': '/configuration/data-types#template',
  '/definition/LabelArray': '/configuration/data-types#template',
  '/definition/TimestampOrRelativeTimestamp': '/configuration/data-types#timestamp',
  '/definition/TimestampOrTimestampInterval': '/configuration/data-types#timestamp-interval',
  '/definition/RuleCondition': '/configuration/conditions',
  '/definition/Duration': '/configuration/data-types#duration',
  '/definition/PriorityRule': '/merge-queue/priority#how-to-define-priority-rules',
  '/definitions/GitHubActionsWorkflow': '/workflow/actions/github_actions#workflow-action',
  '/definitions/GitHubActionsWorkflowDispatch': '/workflow/actions/github_actions#workflow-action-dispatch',
};

export interface OptionDefinition {
  valueType: string;
  description: string;
  default: string | boolean;
  $ref: any;
}

function getTypeLink(ref: string): string | undefined {
  if (ref) {
    const refPath = ref.split('/').slice(1);
    const refDefinition = refPath.reduce((acc, segment) => (acc as any)[segment], configSchema);
    const refId = refDefinition.$id;

    return valueTypeLinks[refId];
  }

  return undefined;
}

function getTypeDescription(ref: string): string {
  if (ref) {
    const refPath = ref.split('/').slice(1);
    const refDefinition = refPath.reduce((acc, segment) => (acc as any)[segment], configSchema);
    return refDefinition.description;
  }

  return '?';
}

export function getValueType(definition): string {
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
  } else if ('enum' in definition) {
    valueType = (
      <>
        Enum of {definition.type}: {' '}
        {definition.enum.map((item, index) => {
          let separator;
          if (index === definition.enum.length - 2) {
          // The last item and not the only item
            separator = ' or ';
          } else if (index < definition.enum.length - 1) {
            separator = ', ';
          } else {
            separator = '';
          }

          return (
            <React.Fragment key={item}>
              <InlineCode>{item}</InlineCode>
              {separator}
            </React.Fragment>
          );
        })}
      </>
    );
  } else {
    valueType = definition.type;
  }

  return valueType;
}

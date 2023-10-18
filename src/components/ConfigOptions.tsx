import {
  Link,
} from '@chakra-ui/react';
import React from 'react';

import ReactMarkdown from 'react-markdown';

import rehypeRaw from 'rehype-raw';

import configSchema from '../../static/mergify-configuration-openapi.json';

import InlineCode from './InlineCode';
import { mdxComponents } from './mdxComponents';

// FIXME: move this to JSON schema?
const valueTypeLinks: { [key: string]: string } = {
  '/definitions/TemplateArray': '/configuration/data-types#template',
  '/definitions/UserArray': '/configuration/data-types#template',
  '/definitions/Template': '/configuration/data-types#template',
  '/definitions/LabelArray': '/configuration/data-types#template',
  '/definitions/Timestamp': '/configuration/data-types#timestamp',
  '/definitions/TimestampOrRelativeTimestamp': '/configuration/data-types#timestamp',
  '/definitions/TimestampOrTimestampInterval': '/configuration/data-types#timestamp-interval',
  '/definitions/Commit': '/configuration/data-types#commit',
  '/definitions/CommitAuthor': '/configuration/data-types#commit-author',
  '/definitions/RuleCondition': '/configuration/conditions',
  '/definitions/Duration': '/configuration/data-types#duration',
  '/definitions/PriorityRule': '/merge-queue/priority#how-to-define-priority-rules',
  '/definitions/GitHubActionsWorkflow': '/workflow/actions/github_actions#workflow-action',
  '/definitions/GitHubActionsWorkflowDispatch': '/workflow/actions/github_actions#workflow-action-dispatch',
  '/definitions/CommandRestriction': '/commands/restrictions#command-restriction-format',
};

export interface OptionDefinition {
  valueType: string;
  description: string;
  default: string | boolean;
  deprecated?: boolean;
  $ref: any;
}

/** We need to strip <em> tags when highlighted by algolia */
function splitRefPath($ref: string) {
  return $ref.replace(/<\/?em>/g, '').split('/').slice(1);
}

function getTypeLink(ref: string): string | undefined {
  if (ref) {
    const refPath = splitRefPath(ref);
    const refDefinition = refPath.reduce((acc, segment) => (acc as any)[segment], configSchema);
    const refId = refDefinition.$id;

    return valueTypeLinks[refId];
  }

  return undefined;
}

function getTypeDescription(ref: string): string {
  if (ref) {
    const refPath = splitRefPath(ref);
    const refDefinition = refPath.reduce((acc, segment) => (acc as any)[segment], configSchema);
    return refDefinition.description;
  }

  return '?';
}

export function getValueType(definition): React.ReactElement {
  let valueType = null;

  if (definition.type === 'array') {
    let typeLink;
    let typeDescription;

    if ('$ref' in definition.items) {
      typeLink = getTypeLink(definition.items.$ref);
      typeDescription = getTypeDescription(definition.items.$ref);
    } else {
      typeDescription = definition.items.type;
    }

    if (typeLink !== undefined) {
      valueType = (
        <>list of{' '}
          <Link color="primary" textDecoration="underline" href={typeLink}>
            {typeDescription}
          </Link>
        </>
      );
    } else {
      valueType = (
        <ReactMarkdown rehypePlugins={[rehypeRaw as any]} components={mdxComponents as any}>
          {`list of ${typeDescription}`}
        </ReactMarkdown>
      );
    }
  } else if (definition.$ref !== undefined) {
    const typeLink = getTypeLink(definition.$ref);
    const typeDescription = (
      <ReactMarkdown rehypePlugins={[rehypeRaw as any]} components={mdxComponents as any}>
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
  } else if ('anyOf' in definition) {
    valueType = (
      <>
        {definition.anyOf.map((item, index) => {
          let separator;
          if (index === definition.anyOf.length - 2) {
            // The last item and not the only item
            separator = ' or ';
          } else if (index < definition.anyOf.length - 1) {
            separator = ', ';
          } else {
            separator = '';
          }

          return (
            <>
              {getValueType(item)}{separator}
            </>
          );
        })}
      </>
    );
  } else if ('enum' in definition) {
    valueType = (
      <>
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
              <HighlightCode>{item}</HighlightCode>
              {separator}
            </React.Fragment>
          );
        })}
      </>
    );
  } else {
    valueType = (
      <HighlightCode>
        {definition.type}
      </HighlightCode>
    );
  }

  return valueType;
}

export function HighlightCode(props: any) {
  const { children } = props;
  // eslint-disable-next-line react/no-danger
  return <InlineCode dangerouslySetInnerHTML={{ __html: children }} />;
}

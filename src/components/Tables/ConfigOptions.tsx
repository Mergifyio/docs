import jsonpointer from 'jsonpointer';
import React, { ReactElement } from 'react';
import configSchema from '../../util/sanitizedConfigSchema';
import { renderMarkdown } from './utils';

const valueTypeLinks: { [key: string]: string } = {
  Commit: '/configuration/data-types#commit',
  CommitAuthor: '/configuration/data-types#commit-author',
  ListOfRuleConditions: '/configuration/conditions',
  CommandRestrictionsConditionsModel: '/configuration/conditions',
  PullRequestRuleConditionsModel: '/configuration/conditions',
  QueueRuleMergeConditionsModel: '/configuration/conditions',
  PriorityRuleConditionsModel: '/configuration/conditions',
  GhaActionModelWorkflow: '/workflow/actions/github_actions#workflow-action',
  GhaActionModelDispatch: '/workflow/actions/github_actions#workflow-action-dispatch',
  CommandRestrictionsModel: '/commands/restrictions#command-restriction-format',
  GitHubRepositoryPermission: '/configuration/data-types#github-repository-permissions',
};

const valueTypeFormatLinks: { [key: string]: string } = {
  template: '/configuration/data-types#template',
  'date-time': '/configuration/data-types#timestamp',
  duration: '/configuration/data-types#duration',
};

export type OptionDefinitionRef = string;

export interface OptionDefinitionProperties {
  title: string;
  type: string;
  $ref: OptionDefinitionRef;
  [optionKey: string]: any;
}

export interface OptionDefinition {
  description: string;
  default: string | boolean;
  deprecated?: boolean;
  type: string;
  title: string;
  name: string;
  $ref: OptionDefinitionRef;
  properties: OptionDefinitionProperties;
}

export type DefName = keyof typeof configSchema.$defs;

export interface ConfigSchema {
  title: string;
  type: string;
  $defs: { [key in DefName]: OptionDefinition };
  properties: { string: OptionDefinitionProperties };
}

export interface Def {
  def: keyof typeof configSchema.$defs;
}

/** We need to strip <em> tags when highlighted by algolia */
function splitRefPath($ref: string) {
  return $ref
    .replace(/<\/?em>/g, '')
    .split('/')
    .slice(1);
}

function getTypeLink(ref: string): string | undefined {
  if (ref) {
    const refPath = splitRefPath(ref);
    const refId = refPath.at(-1);

    if (!refId) {
      return undefined;
    }
    return valueTypeLinks[refId];
  }

  return undefined;
}

function getItemFromSchema(schema: object, path: OptionDefinitionRef): OptionDefinition {
  const refPath = path.replace('#', ''); // Clean the path
  return jsonpointer.get(schema, refPath);
}

/**
 * Resolves a JSON Schema item, following $refs until a complete type is found.
 * @param schema - The root JSON schema.
 * @param item - The current item in the schema to resolve.
 * @returns The fully resolved schema item.
 */
export function resolveSchema(schema: object, item: object): object {
  if ((item as any).$ref) {
    // Recursively resolve if the resolved item is another $ref
    return resolveSchema(schema, getItemFromSchema(schema, (item as OptionDefinition).$ref));
  } else {
    // Return the item if it's a complete definition (not a $ref)
    return item;
  }
}

function getTitle(schema: object, ref: OptionDefinitionRef): string {
  const item = getItemFromSchema(schema, ref);
  return item?.title || item?.name || '';
}

export function getValueType(schema: object, definition: any): React.ReactElement | null {
  let valueType: ReactElement | null = null;
  if (definition.type === 'array') {
    let typeLink: string | undefined;
    let typeDescription: string | React.ReactElement | null;

    if ('$ref' in definition.items) {
      typeLink = getTypeLink(definition.items.$ref);
      typeDescription = getTitle(schema, definition.items.$ref);
    } else {
      typeDescription = getValueType(schema, definition.items);
    }

    if (typeLink !== undefined) {
      valueType = (
        <>
          list of{' '}
          <a color="primary" style={{ textDecoration: 'underline' }} href={typeLink}>
            {typeDescription}
          </a>
        </>
      );
    } else {
      valueType = <>list of {typeDescription}</>;
    }
  } else if (definition.$ref !== undefined) {
    const typeLink = getTypeLink(definition.$ref);
    const typeDescription = (
      <div
        dangerouslySetInnerHTML={{ __html: renderMarkdown(getTitle(schema, definition.$ref)) }}
      />
    );

    if (typeLink !== undefined) {
      valueType = (
        <a color="primary" style={{ textDecoration: 'underline' }} href={typeLink}>
          {typeDescription}
        </a>
      );
    } else valueType = typeDescription;
  } else if ('anyOf' in definition || 'oneOf' in definition || 'allOf' in definition) {
    const def: any[] = definition.anyOf || definition.oneOf || definition.allOf;
    valueType = (
      <>
        {def.map((item: any, index) => {
          let separator: string;
          if (index === def.length - 2) {
            // The last item and not the only item
            separator = ' or ';
          } else if (index < def.length - 1) {
            separator = ', ';
          } else {
            separator = '';
          }

          return (
            <>
              {getValueType(schema, item)}
              {separator}
            </>
          );
        })}
      </>
    );
  } else if ('enum' in definition) {
    valueType = (
      <>
        {definition.enum.map((item: any, index: number) => {
          let separator: string;
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
  } else if ('const' in definition) {
    valueType = <HighlightCode>{definition.const}</HighlightCode>;
  } else if ('format' in definition) {
    const formatLink = valueTypeFormatLinks[definition.format];
    if (formatLink !== undefined) {
      valueType = (
        <a color="primary" style={{ textDecoration: 'underline' }} href={formatLink}>
          {definition.format}
        </a>
      );
    }
  } else {
    valueType = <HighlightCode>{definition.type}</HighlightCode>;
  }

  return valueType;
}

export function HighlightCode(props: any) {
  const { children } = props;
  // eslint-disable-next-line react/no-danger
  return <code dangerouslySetInnerHTML={{ __html: children }} />;
}

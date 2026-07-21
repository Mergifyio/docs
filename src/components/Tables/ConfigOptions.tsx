import jsonpointer from 'jsonpointer';
import React, { ReactElement } from 'react';
import { getDataTypeHref, isDataType } from '~/util/dataType';
import configSchema from '~/util/sanitizedConfigSchema';
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
  template: '/configuration/data-types#legacy-template',
  'date-time': '/configuration/data-types#timestamp',
  duration: '/configuration/data-types#duration',
};

// A simple-template field carries a per-set title (e.g. "Message template"); render
// the title as the field type, linking to the matching data-types section.
const simpleTemplateTitleLinks: { [key: string]: string } = {
  'Message template': '/configuration/data-types#message-template',
  'Title template': '/configuration/data-types#title-template',
  'Body template': '/configuration/data-types#body-template',
  'Workflow input template': '/configuration/data-types#workflow-input-template',
  User: '/configuration/data-types#user',
  Assignee: '/configuration/data-types#assignee',
  'Bot account': '/configuration/data-types#bot-account',
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

function splitRefPath($ref: string) {
  return $ref.split('/').slice(1);
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

// A node flagged `x-has-data-type: true` is a documented data type: link to its
// data-types section instead of expanding the node's shape — an enum such as
// `queue-dequeue-reason` would otherwise dump its forty codes into the type
// cell. The node's `title` drives both the label and the anchor (slugified
// title == section heading anchor; the build gate enforces it). pydantic
// publishes the flag inline for inlined types but as a *sibling of `$ref`*
// for types hoisted into `$defs`, so check each node along the `$ref` chain,
// starting with the raw node, and stop quietly on a dangling `$ref` rather
// than crashing the build.
function getDataTypeLink(schema: object, definition: unknown): ReactElement | null {
  let node = definition;
  let marked = isDataType(node);
  for (let hops = 0; !marked && hops < 10; hops++) {
    if (node === null || typeof node !== 'object') {
      break;
    }
    const ref = (node as { $ref?: unknown }).$ref;
    if (typeof ref !== 'string') {
      break;
    }
    node = getItemFromSchema(schema, ref);
    marked = isDataType(node);
  }
  if (!marked) {
    return null;
  }

  // A `$ref`-sibling flag carries no title of its own — it lives on the
  // `$defs` target — so follow one more hop for the title if needed.
  let titled = node as { title?: string; $ref?: unknown };
  if (titled.title === undefined && typeof titled.$ref === 'string') {
    titled = getItemFromSchema(schema, titled.$ref) ?? titled;
  }
  const title = titled?.title;
  if (!title) {
    // Invalid marker (no title to derive from) — the anchor check reports
    // it; render the node's shape as before instead of a broken link.
    return null;
  }

  // Plain text, not renderMarkdown: markdown rendering emits a block-level
  // <p> that would break inline composition ("list of <link>", "X or Y").
  return (
    <a style={{ textDecoration: 'underline' }} href={getDataTypeHref(title)}>
      {title}
    </a>
  );
}

export function getValueType(schema: object, definition: any): React.ReactElement | null {
  const dataTypeLink = getDataTypeLink(schema, definition);
  if (dataTypeLink !== null) {
    return dataTypeLink;
  }

  let valueType: ReactElement | null = null;
  if (definition.type === 'array') {
    const itemsDataTypeLink = getDataTypeLink(schema, definition.items);
    if (itemsDataTypeLink !== null) {
      return <>list of {itemsDataTypeLink}</>;
    }

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
            <React.Fragment key={index}>
              {getValueType(schema, item)}
              {separator}
            </React.Fragment>
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
  } else if (definition.format === 'simple-template') {
    // A simple-template field IS a named data type: show its title and link to the
    // matching data-types section, like Template/Timestamp/Duration.
    const title: string = definition.title ?? 'simple-template';
    const titleLink = simpleTemplateTitleLinks[title];
    valueType =
      titleLink !== undefined ? (
        <a color="primary" style={{ textDecoration: 'underline' }} href={titleLink}>
          {title}
        </a>
      ) : (
        <HighlightCode>{title}</HighlightCode>
      );
  } else if ('format' in definition) {
    const formatLink = valueTypeFormatLinks[definition.format];
    if (formatLink !== undefined) {
      valueType = (
        <a color="primary" style={{ textDecoration: 'underline' }} href={formatLink}>
          {definition.format}
        </a>
      );
    }
  } else if (
    definition.additionalProperties &&
    typeof definition.additionalProperties === 'object'
  ) {
    // A map field (e.g. github_actions inputs): show "map of <value type>" so the
    // templated value type still links to its data-types section.
    valueType = <>map of {getValueType(schema, definition.additionalProperties)}</>;
  } else {
    valueType = <HighlightCode>{definition.type}</HighlightCode>;
  }

  return valueType;
}

export function HighlightCode(props: any) {
  const { children } = props;

  return <code dangerouslySetInnerHTML={{ __html: children }} />;
}

import configSchema from '../content/mergify-configuration-openapi.json';

// FIXME: move this to JSON schema?
const valueTypeLinks: { [key: string]: string } = {
  '#/TemplateArray': '/configuration/data-types#template',
  '#/UserArray': '/configuration/data-types#template',
  '#/Template': '/configuration/data-types#template',
  '#/LabelArray': '/configuration/data-types#template',
  '#/TimestampOrRelativeTimestamp': '/configuration/data-types#timestamp',
  '#/RuleCondition': '/configuration/conditions',
  '#/Duration': '/configuration/data-types#duration',
  '#/PriorityRule': '/merge-queue/priority#how-to-define-priority-rules',
};

export function getTypeLink(ref: string): string | undefined {
  if (ref) {
    const refPath = ref.split('/').slice(1);
    const refDefinition = refPath.reduce((acc, segment) => (acc as any)[segment], configSchema);
    const refId = refDefinition.$id;

    return valueTypeLinks[refId];
  }

  return undefined;
}

export function getTypeDescription(ref: string): string {
  if (ref) {
    const refPath = ref.split('/').slice(1);
    const refDefinition = refPath.reduce((acc, segment) => (acc as any)[segment], configSchema);
    return refDefinition.description;
  }

  return '?';
}

import configSchema from '../content/mergify-configuration-openapi.json';

// FIXME: move this to JSON schema?
const valueTypeLinks: { [key: string]: string } = {
  '/definition/TemplateArray': '/configuration/data-types#template',
  '/definition/UserArray': '/configuration/data-types#template',
  '/definition/Template': '/configuration/data-types#template',
  '/definition/LabelArray': '/configuration/data-types#template',
  '/definition/TimestampOrRelativeTimestamp': '/configuration/data-types#timestamp',
  '/definition/RuleCondition': '/configuration/conditions',
  '/definition/Duration': '/configuration/data-types#duration',
  '/definition/PriorityRule': '/merge-queue/priority#how-to-define-priority-rules',
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

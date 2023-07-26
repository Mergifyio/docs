import configSchema from '../content/mergify-configuration-openapi.json';

const valueTypeLinks: { [key: string]: string } = {
  '#/TemplateArray': '/configuration/data-types#template',
  '#/UserArray': '/configuration/data-types#template',
  '#/Template': '/configuration/data-types#template',
  '#/LabelArray': '/configuration/data-types#template',
  '#/TimestampOrRelativeTimestamp': '/configuration/data-types#timestamp',
  '#/RuleCondition': '/configuration/conditions',
};

export function getTypeLink(ref: string) {
  if (ref) {
    const refPath = ref.split('/').slice(1);
    const refDefinition = refPath.reduce((acc, segment) => (acc as any)[segment], configSchema);
    const refId = refDefinition.$id;

    return valueTypeLinks[refId];
  }

  return '';
}

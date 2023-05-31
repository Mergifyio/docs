import configSchema from '../content/mergify-configuration-openapi.json'

const valueTypeLinks = {
  '#/TemplateArray': '/configuration/data-types#template',
  '#/UserArray': '/configuration/data-types#template',
  '#/Template': '/configuration/data-types#template',
  '#/LabelArray': '/configuration/data-types#template',
  '#/TimestampOrRelativeTimestamp': '/configuration/data-types#timestamp',
}

export function getTypeLink(ref: string) {
  if (ref) {
    const refPath = ref.split('/').slice(1);
    const refDefinition = refPath.reduce((acc, segment) => {
      return acc[segment];
    }, configSchema);
    const refId = refDefinition.$id;
    
    return valueTypeLinks[refId];
  }
}
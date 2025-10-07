import rawConfigSchema from '../../public/mergify-configuration-schema.json';

// Fields to hide from configuration documentation
const hiddenFields = ['autosquash'];

function deepRemoveKey(value: any, keyToRemove: string) {
  if (Array.isArray(value)) {
    for (const item of value) deepRemoveKey(item, keyToRemove);
    return value;
  }
  if (value && typeof value === 'object') {
    if (Object.prototype.hasOwnProperty.call(value, keyToRemove)) {
      delete (value as any)[keyToRemove];
    }
    for (const k of Object.keys(value)) deepRemoveKey((value as any)[k], keyToRemove);
  }
  return value;
}

function sanitizeConfigSchema() {
  const cloned = JSON.parse(JSON.stringify(rawConfigSchema));
  for (const field of hiddenFields) deepRemoveKey(cloned, field);
  return cloned as typeof rawConfigSchema;
}

const configSchema = sanitizeConfigSchema();

export default configSchema;

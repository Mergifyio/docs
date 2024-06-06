import Ajv from 'ajv';
import { describe, it } from 'vitest';

import configSchema from '../public/mergify-configuration-schema.json';

describe('Checking mergify configuration schema', () => {
	it('should be a valid JSON schema', () => {
		const ajv = new Ajv({ allowUnionTypes: true });
		ajv.addSchema(configSchema, 'mergify-schema.json');
		const valid = ajv.validate(configSchema, {});
		if (!valid) throw new Error(`\nValidation errors: ${ajv.errorsText()}`);
	});
});

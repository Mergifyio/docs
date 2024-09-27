import configSchema from '../../../public/mergify-configuration-schema-future-version.json';

import { OptionDefinition, Def } from './ConfigOptions';
import { OptionsTableBase } from './OptionsTable';

export default function ActionOptionsTable({ def }: Def) {
	const options = configSchema.$defs[def].properties as {
		[optionKey: string]: OptionDefinition;
	};
	return OptionsTableBase(configSchema, options);
}

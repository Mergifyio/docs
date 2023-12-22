import configSchema from '../../../public/mergify-configuration-openapi.json';

import { OptionDefinition } from './ConfigOptions';
import { OptionsTableBase } from './OptionsTable';

interface Props {
	/** Action's name to retrieve its options */
	action: keyof typeof configSchema.definitions.Actions.properties;
}

export default function ActionOptionsTable({ action }: Props) {
	const options = configSchema.definitions.Actions.properties[action].properties as {
		[optionKey: string]: OptionDefinition;
	};

	return OptionsTableBase(options);
}

import configSchema from '../../../public/mergify-configuration-schema.json';

import { OptionDefinition } from './ConfigOptions';
import { OptionsTableBase } from './OptionsTable';

interface Props {
	/** Action's name to retrieve its options */
	action: keyof typeof configSchema.$defs.Actions.properties;
}

export default function ActionOptionsTable({ action }: Props) {
	const options = configSchema.$defs.Actions.properties[action].properties as {
		[optionKey: string]: OptionDefinition;
	};

	return OptionsTableBase(options);
}

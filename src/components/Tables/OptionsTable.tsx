import * as yaml from 'js-yaml';

import configSchema from '../../../public/mergify-configuration-openapi.json';

import { getValueType, OptionDefinition } from './ConfigOptions';
import { renderMarkdown } from './utils';
import Badge from '../Badge/Badge';

type ObjectWithProperties<T> = {
	properties: T;
};
type KeysWithProperties<T> = {
	[K in keyof T]: T[K] extends ObjectWithProperties<any> ? K : never;
}[keyof T];

interface Props {
	/** Name to retrieve its options */
	name: KeysWithProperties<typeof configSchema.definitions>;
	options?: { [optionKey: string]: OptionDefinition };
}

interface RootProps {
	/** Name to retrieve its options */
	name: KeysWithProperties<typeof configSchema.properties>;
}

export function RootOptionsTable({ name }: RootProps) {
	const options = configSchema.properties[name].properties;

	return OptionsTableBase(options as any);
}

export default function OptionsTable({ name }: Props) {
	const options = configSchema.definitions[name].properties;

	return OptionsTableBase(options as any);
}

export function OptionsTableBase(options: OptionDefinition) {
	const hasDefaultValue = (definition: OptionDefinition) => definition.default !== undefined;

	const shouldHideDefaultColumn = Object.entries(options).every(
		([, definition]) => !definition.default
	);
	const shouldHideDeprecatedColumn = Object.entries(options).every(
		([, definition]) => !definition.deprecated
	);

	return (
		<table>
			<thead>
				<tr>
					<th>Key name</th>
					<th>Value type</th>
					{!shouldHideDefaultColumn && <th>Default</th>}
					{!shouldHideDeprecatedColumn && <th />}
				</tr>
			</thead>
			<tbody>
				{Object.entries(options).map(([optionKey, definition]) => {
					const valueType = getValueType(definition);
					const { deprecated } = definition;

					return (
						<>
							<tr style={{ position: 'relative' }}>
								<td style={{ whiteSpace: 'nowrap' }}>
									<code>{optionKey}</code>
								</td>
								<td>{valueType}</td>
								{!shouldHideDefaultColumn && (
									<td>
										{hasDefaultValue(definition) && (
											<code
												dangerouslySetInnerHTML={{
													__html: yaml.dump(definition.default, {
														noCompatMode: true,
														lineWidth: -1,
														quotingType: '"',
														noRefs: true,
													}),
												}}
											/>
										)}
									</td>
								)}
								{!shouldHideDeprecatedColumn && <td>{deprecated && <Badge>deprecated</Badge>}</td>}
							</tr>
							{definition.description !== undefined && (
								<tr>
									{/* FIXME: don't hardcode the border color like that */}
									<td {...({ colSpan: shouldHideDefaultColumn ? '3' : '4' } as any)}>
										<div
											dangerouslySetInnerHTML={{
												__html: renderMarkdown(definition.description),
											}}
										/>
									</td>
								</tr>
							)}
						</>
					);
				})}
			</tbody>
		</table>
	);
}

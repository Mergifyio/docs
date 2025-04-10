import configSchema from '../../../public/mergify-configuration-schema.json';
import { getValueType } from './ConfigOptions';

import { renderMarkdown } from './utils';

interface Props {
	staticAttributes: typeof configSchema.$defs.PullRequestAttributes.properties;
}

export default function PullRequestAttributes({ staticAttributes }: Props) {
	const attributes = staticAttributes ?? configSchema.$defs.PullRequestAttributes.properties;

	return (
		<table>
			<thead>
				<tr>
					<th>Attribute name</th>
					<th>Value type</th>
					<th>Description</th>
				</tr>
			</thead>
			<tbody>
				{Object.entries(attributes)
					.sort(([keyA, _valueA], [keyB, _valueB]) => (keyA > keyB ? 1 : -1))
					.map(([key, value]) => {
						const valueType = getValueType(configSchema, value);

						return (
							<tr key={key}>
								<td style={{ whiteSpace: 'nowrap' }}>
									<code>{key}</code>
								</td>
								<td>{valueType}</td>
								<td
									dangerouslySetInnerHTML={{ __html: renderMarkdown(value.description) }}
									style={{ width: '100%' }}
								/>
							</tr>
						);
					})}
			</tbody>
		</table>
	);
}

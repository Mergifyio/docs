import configSchema from '../../../public/mergify-configuration-schema.json';
import { getValueType } from './ConfigOptions';

import { renderMarkdown } from './utils';

interface Props {
	staticAttributes: typeof configSchema.$defs.PullRequestAttribute.enum;
}

export default function PullRequestAttributes({ staticAttributes }: Props) {
	const attributes = staticAttributes ?? configSchema?.$defs?.PullRequestAttribute?.enum ?? [];

	return (
		<table>
			<caption>Pull Request Attributes</caption>
			<thead>
				<tr>
					<th>Attribute name</th>
					<th>Value type</th>
					<th>Description</th>
				</tr>
			</thead>
			<tbody>
				{attributes
					.sort((a, b) => (a.key > b.key ? 1 : -1))
					.map((attr) => {
						const valueType = getValueType(configSchema, attr);

						return (
							<tr key={attr.key}>
								<td>
									<code>{attr.key}</code>
								</td>
								<td>{valueType}</td>
								<td dangerouslySetInnerHTML={{ __html: renderMarkdown(attr.description) }} />
							</tr>
						);
					})}
			</tbody>
		</table>
	);
}

import configSchema from '../../../public/mergify-configuration-openapi.json';
import { getValueType } from './ConfigOptions';

import { renderMarkdown } from './utils';

interface Props {
	staticAttributes: typeof configSchema.definitions.PullRequestAttribute.enum;
}

export default function PullRequestAttributes({ staticAttributes }: Props) {
	const attributes =
		staticAttributes ?? configSchema?.definitions?.PullRequestAttribute?.enum ?? [];

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
				{attributes.map((attr) => {
					const valueType = getValueType(attr);

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

import React from 'react';
import jsonpointer from 'jsonpointer';
import configSchema from '../../../public/mergify-configuration-schema.json';
import { renderMarkdown } from './utils';

const valueTypeLinks: { [key: string]: string } = {
	TemplateArray: '/configuration/data-types#template',
	UserArray: '/configuration/data-types#template',
	Template: '/configuration/data-types#template',
	LabelArray: '/configuration/data-types#template',
	Timestamp: '/configuration/data-types#timestamp',
	TimestampOrRelativeTimestamp: '/configuration/data-types#timestamp',
	TimestampOrTimestampInterval: '/configuration/data-types#timestamp-interval',
	Commit: '/configuration/data-types#commit',
	CommitAuthor: '/configuration/data-types#commit-author',
	RuleCondition: '/configuration/conditions',
	Duration: '/configuration/data-types#duration',
	Schedule: '/configuration/data-types#schedule',
	PriorityRule: '/merge-queue/priority#how-to-define-priority-rules',
	GitHubActionsWorkflow: '/workflow/actions/github_actions#workflow-action',
	GitHubActionsWorkflowDispatch: '/workflow/actions/github_actions#workflow-action-dispatch',
	CommandRestriction: '/commands/restrictions#command-restriction-format',
	QueueDequeueReason: '/configuration/data-types#queue-dequeue-reason',
	ReportModeArray: '/configuration/data-types#report-modes',
};

export interface OptionDefinition {
	description: string;
	default: string | boolean;
	deprecated?: boolean;
	$ref: any;
}

/** We need to strip <em> tags when highlighted by algolia */
function splitRefPath($ref: string) {
	return $ref
		.replace(/<\/?em>/g, '')
		.split('/')
		.slice(1);
}

function getTypeLink(ref: string): string | undefined {
	if (ref) {
		const refPath = splitRefPath(ref);
		const refId = refPath.at(-1);

		return valueTypeLinks[refId];
	}

	return undefined;
}

function getItemFromSchema(schema: object, path: string): object {
	const refPath = path.replace('#', ''); // Clean the path
	return jsonpointer.get(schema, refPath);
}

/**
 * Resolves a JSON Schema item, following $refs until a complete type is found.
 * @param schema - The root JSON schema.
 * @param item - The current item in the schema to resolve.
 * @returns The fully resolved schema item.
 */
export function resolveSchema(schema: object, item: object): object {
	if (item.$ref) {
		// Recursively resolve if the resolved item is another $ref
		return resolveSchema(schema, getItemFromSchema(schema, item.$ref));
	} else {
		// Return the item if it's a complete definition (not a $ref)
		return item;
	}
}

function getTypeDescription(ref: object): string {
	return getItemFromSchema(configSchema, resolveSchema(configSchema, ref)).description;
}

export function getValueType(definition: any): React.ReactElement {
	let valueType = null;

	if (definition.type === 'array') {
		let typeLink: string;
		let typeDescription: string;

		if ('$ref' in definition.items) {
			typeLink = getTypeLink(definition.items.$ref);
			typeDescription = getTypeDescription(definition.items.$ref);
		} else {
			typeDescription = definition.items.type;
		}

		if (typeLink !== undefined) {
			valueType = (
				<>
					list of{' '}
					<a color="primary" style={{ textDecoration: 'underline' }} href={typeLink}>
						{typeDescription}
					</a>
				</>
			);
		} else {
			valueType = (
				<div
					dangerouslySetInnerHTML={{ __html: renderMarkdown(`\`list of ${typeDescription}\``) }}
				/>
			);
		}
	} else if (definition.$ref !== undefined) {
		const typeLink = getTypeLink(definition.$ref);
		const typeDescription = (
			<div
				dangerouslySetInnerHTML={{ __html: renderMarkdown(getTypeDescription(definition.$ref)) }}
			/>
		);

		if (typeLink !== undefined) {
			valueType = (
				<a color="primary" style={{ textDecoration: 'underline' }} href={typeLink}>
					{typeDescription}
				</a>
			);
		} else valueType = typeDescription;
	} else if ('anyOf' in definition || 'oneOf' in definition || 'allOf' in definition) {
		const def: any[] = definition.anyOf || definition.oneOf || definition.allOf;
		valueType = (
			<>
				{def.map((item: any, index) => {
					let separator: string;
					if (index === def.length - 2) {
						// The last item and not the only item
						separator = ' or ';
					} else if (index < def.length - 1) {
						separator = ', ';
					} else {
						separator = '';
					}

					return (
						<>
							{getValueType(item)}
							{separator}
						</>
					);
				})}
			</>
		);
	} else if ('enum' in definition) {
		valueType = (
			<>
				{definition.enum.map((item: any, index: number) => {
					let separator: string;
					if (index === definition.enum.length - 2) {
						// The last item and not the only item
						separator = ' or ';
					} else if (index < definition.enum.length - 1) {
						separator = ', ';
					} else {
						separator = '';
					}

					return (
						<React.Fragment key={item}>
							<HighlightCode>{item}</HighlightCode>
							{separator}
						</React.Fragment>
					);
				})}
			</>
		);
	} else {
		valueType = <HighlightCode>{definition.type}</HighlightCode>;
	}

	return valueType;
}

export function HighlightCode(props: any) {
	const { children } = props;
	// eslint-disable-next-line react/no-danger
	return <code dangerouslySetInnerHTML={{ __html: children }} />;
}

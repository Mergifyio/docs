import GithubSlugger from 'github-slugger';
import { renderMdxTable } from '../../util/mdxast';

import { AlgoliaResult, Heading } from './types';

type HighlightHeading = NonNullable<NonNullable<AlgoliaResult['_highlightResult']>['headings']>;

interface TableOfContentsProps {
	highlightHeadings: HighlightHeading;
	headings: Heading[];
	slug: string;
}

const slugger = new GithubSlugger();

function TableOfContents({ headings, slug }: TableOfContentsProps) {
	function getHeadingSlugFromValue(value: string) {
		const cleanupValue = value.replace('<em>', '').replace('</em>', '');

		return slugger.slug(cleanupValue);
	}

	return (
		<div className="table-of-content" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
			{headings.map((heading) => (
				<a
					key={heading.value}
					style={{
						paddingLeft: (Number(heading.depth) - 2) * 16,
					}}
					href={`${slug}#${getHeadingSlugFromValue(heading.value)}`} // Remove highlight markups
					dangerouslySetInnerHTML={{ __html: heading.value ?? '' }}
				/>
			))}
		</div>
	);
}

interface Props extends AlgoliaResult {}

export default function Preview({
	_highlightResult,
	_snippetResult,
	tables,
	objectID,
	headings,
}: Props) {
	const slug = objectID.substring(0, objectID.indexOf('.mdx'));

	return (
		<div
			style={{
				display: 'flex',
				padding: 16,
				justifyContent: 'flex-start',
				alignItems: 'start',
				flex: 2,
				height: '100%',
				overflow: 'auto',
				flexDirection: 'column',
				gap: 16,
			}}
		>
			<a
				href={slug}
				dangerouslySetInnerHTML={{ __html: _highlightResult?.title?.value ?? '' }}
				style={{
					lineHeight: 1.2,
					fontSize: '2.25rem',
				}}
			/>
			<div
				style={{
					fontSize: '1.25rem',
				}}
				dangerouslySetInnerHTML={{
					__html: _highlightResult?.description?.value ?? '',
				}}
			/>
			<div
				style={{
					margin: '8px 0',
					color: 'var(--theme-text-light)',
				}}
				dangerouslySetInnerHTML={{ __html: _snippetResult?.excerpt?.value ?? '' }}
			/>
			{_highlightResult?.tables
				?.filter(
					(el) =>
						el?.data?.matchLevel !== 'none' || (el?.content && el.content.matchLevel !== 'none')
				)
				.map((table, index) =>
					renderMdxTable({
						data: table?.data?.value,
						node: tables[index].node,
						content: table?.content?.value,
					})
				)}
			{_highlightResult?.headings && (
				<>
					<hr style={{ margin: '8px 0' }} />
					<div
						style={{ alignItems: 'flex-start', display: 'flex', flexDirection: 'column', gap: 4 }}
					>
						<div style={{ fontWeight: 'bold', colorScheme: 'gray', fontSize: 'sm' }}>
							ON THIS PAGE
						</div>
						<TableOfContents
							highlightHeadings={_highlightResult.headings}
							headings={headings}
							slug={slug}
						/>
					</div>
				</>
			)}
		</div>
	);
}

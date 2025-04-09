import { SearchResponse } from '@algolia/client-search';
import { algoliasearch } from 'algoliasearch';
import React, { useEffect, useRef, useState } from 'react';
import { BsSearch } from 'react-icons/bs';

import Results from './Results';
import { AlgoliaResult, Page } from './types';
import Modal from '../Modal/Modal';
import './Search.scss';

function useAlgoliaSearch(query: string, open: boolean) {
	const [results, setResults] = useState<AlgoliaResult[]>();

	useEffect(() => {
		const search = async () => {
			const searchClient = algoliasearch(
				import.meta.env.PUBLIC_ALGOLIA_APP_ID as string,
				import.meta.env.PUBLIC_ALGOLIA_SEARCH_KEY as string
			);
			const response = await searchClient.search<Page>({
				requests: [
					{
						indexName: import.meta.env.PUBLIC_ALGOLIA_INDEX_NAME,
						query: query,
						attributesToHighlight: [
							'title',
							'description',
							'excerpt',
							'headings.value',
							'tables.data',
							'tables.content',
						],
						attributesToSnippet: ['excerpt:40'],
					},
				],
			});
			setResults((response.results[0] as SearchResponse<Page>)?.hits);
		};

		if (open && query && query.length > 3) {
			// eslint-disable-next-line @typescript-eslint/no-floating-promises
			search();
		}
	}, [query, open]);

	return results;
}

export default function SearchBar() {
	const inputRef = useRef<HTMLInputElement>(null);

	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState('');

	const searchResults = useAlgoliaSearch(search, open);

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearch(e.target.value);
	};

	const handleClose = () => {
		setOpen(false);
		setSearch('');
	};

	useEffect(() => {
		const button = document.getElementById('docsearch-search-button');
		const openModal = () => {
			setOpen(true);
		};
		const openModalKeypress = (e: KeyboardEvent) => {
			if (e.key === '/') {
				openModal();
			}
		};

		button?.addEventListener('click', openModal);
		window.addEventListener('keypress', openModalKeypress);

		return () => {
			button?.removeEventListener('click', openModal);
			window.removeEventListener('keypress', openModalKeypress);
		};
	}, []);

	useEffect(() => {
		if (open) {
			inputRef.current?.focus();
		}
	}, [open]);

	return (
		<div id="search-bar">
			<Modal open={open} onClose={handleClose}>
				<div
					style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 16, paddingTop: 8 }}
				>
					<BsSearch fontSize={'large'} />
					<input
						autoFocus
						name="search"
						ref={inputRef}
						value={search}
						onChange={handleSearchChange}
						style={{
							border: 'none',
							height: 46,
							fontSize: 'large',
							outline: 'none',
							flex: 1,
							background: 'transparent',
						}}
						placeholder="Search Mergify Docs"
					/>
				</div>
				<hr style={{ margin: '8px 0' }} />
				{searchResults && <Results results={searchResults} />}
			</Modal>
		</div>
	);
}

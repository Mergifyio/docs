import { SearchResponse } from '@algolia/client-search';
import {
  Divider, Input, InputGroup, InputLeftAddon, Modal,
  ModalBody, ModalContent, ModalHeader, ModalOverlay,
} from '@chakra-ui/react';
import algoliasearch from 'algoliasearch/lite';
import React, { useEffect, useState } from 'react';
import { BsSearch } from 'react-icons/bs';

import Results from './Results';
import { Page } from './types';

function useAlgoliaSearch(query: string) {
  const [results, setResults] = useState<SearchResponse<Page>>();

  useEffect(() => {
    const search = async () => {
      const searchClient = algoliasearch(
        process.env.GATSBY_ALGOLIA_APP_ID as string,
        process.env.GATSBY_ALGOLIA_SEARCH_KEY as string,
      );
      const pagesIndex = searchClient.initIndex('docs-pages');
      const response = await pagesIndex.search<Page>(query, {
        attributesToHighlight: ['excerpt', 'frontmatter', 'tableOfContents'],
        attributesToSnippet: ['excerpt:40'],
      });
      setResults(response);
    };

    search();
  }, [query]);

  return results;
}

export default function SearchBar() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const searchResults = useAlgoliaSearch(search);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSearch('');
  };

  return (
    <>
      <InputGroup marginRight={4} marginLeft={4} onClick={handleOpen}>
        <InputLeftAddon><BsSearch /></InputLeftAddon>
        <Input placeholder="Search Mergify" size="md" />
      </InputGroup>
      <Modal scrollBehavior="inside" isOpen={open} onClose={handleClose} size="4xl">
        <ModalOverlay />
        <ModalContent height="100%">
          <ModalHeader padding={0}>
            <InputGroup padding={1} onClick={handleOpen}>
              <InputLeftAddon background="none" border="none"><BsSearch /></InputLeftAddon>
              <Input onChange={handleSearchChange} variant="unstyled" placeholder="Search Mergify" size="lg" />
            </InputGroup>
          </ModalHeader>
          <Divider />
          <ModalBody padding={0}>
            {searchResults?.hits && <Results results={searchResults?.hits} />}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

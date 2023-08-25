import {
  Divider, Input, InputGroup, InputLeftAddon, Modal,
  ModalBody, ModalContent, ModalHeader, ModalOverlay,
} from '@chakra-ui/react';
import { graphql, useStaticQuery } from 'gatsby';
import React, { useState } from 'react';
import { BsSearch } from 'react-icons/bs';

import Results from './Results';
import searchPage from './searchPage';
import { PageQuery } from './types';

const pagesQuery = graphql`
 {
    pages: allFile(filter: {extension: {in: ["md", "mdx"]}}) {
      nodes {
        id
        childMdx {
          fields {
            slug
          }
          excerpt(pruneLength: 400)
          frontmatter {
            title
            description
            toc
            tags
          }
        }
      }
    }
  }
`;

export default function SearchBar() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const data = useStaticQuery<PageQuery>(pagesQuery);
  const searchResults = searchPage(data.pages.nodes, search);

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
            <Results results={searchResults.slice(0, 10)} />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

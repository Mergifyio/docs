import {
  Flex, HStack, Heading, IconButton, Link, SimpleGrid, Text,
} from '@chakra-ui/react';
import { Link as GatsbyLink } from 'gatsby';
import PropTypes from 'prop-types';
import React from 'react';

import { PrimaryLink } from './RelativeLink';

export function DocsetGrid(props) {
  return <SimpleGrid spacing="4" minChildWidth="250px" {...props} />;
}

export function Docset({
  title, children, description, path, icon,
}) {
  return (
    <Flex align="flex-start" p="6" rounded="md" borderWidth="1px">
      <Flex align="flex-start" direction="column" h="full">
        <PrimaryLink as={GatsbyLink} to={path}>
          <Heading as="h4" size="md" mb="4" color="linkedin.700">
            <HStack spacing="3">
              {icon}
              <span>{title}</span>
            </HStack>
          </Heading>
        </PrimaryLink>
        {description && <Text fontSize="md">{description}</Text>}
      </Flex>
      {children}
    </Flex>
  );
}

Docset.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  path: PropTypes.string.isRequired,
  icon: PropTypes.element,
  children: PropTypes.node,
};

export function CommunityButton(props) {
  return <IconButton as={Link} fontSize="larger" isExternal {...props} />;
}

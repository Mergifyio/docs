import PropTypes from 'prop-types';
import React from 'react';
import {
  Flex,
  HStack,
  Heading,
  IconButton,
  Link,
  SimpleGrid,
  Text
} from '@chakra-ui/react';
import {Link as GatsbyLink} from 'gatsby';
import {PrimaryLink} from './RelativeLink';

export const DocsetGrid = props => (
  <SimpleGrid spacing="4" minChildWidth="250px" {...props} />
);

export function Docset({
  title,
  children,
  description,
  path,
  icon
}) {
  return (
    <PrimaryLink as={GatsbyLink} to={path}>
      <Flex align="flex-start" p="6" rounded="md" borderWidth="1px">
        <Flex align="flex-start" direction="column" h="full">
          <Heading as="h3" size="lg" mb="4">
            <HStack spacing="3">
              {icon}
              <span>{title}</span>
            </HStack>
          </Heading>
          {description && <Text mb="4">{description}</Text>}
        </Flex>
        {children}
      </Flex>
    </PrimaryLink>
  );
}

Docset.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  path: PropTypes.string.isRequired,
  icon: PropTypes.element,
  children: PropTypes.node
};

export const CommunityButton = props => (
  <IconButton as={Link} fontSize="larger" isExternal {...props} />
);

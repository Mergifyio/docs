import PropTypes from 'prop-types';
import React from 'react';
import {
  Box,
  Flex,
  Heading,
  Link,
  List,
  ListItem,
  SimpleGrid,
  Text
} from '@chakra-ui/react';
import {footerConfig} from '@apollo/chakra-helpers';

export default function Footer() {
  return (
    <SimpleGrid
      as="footer"
      minChildWidth="150px"
      spacing={{base: 6, md: 8}}
      borderTopWidth="1px"
      px="10"
      py="12"
    >
      {footerConfig.map(({links, title}, index) => (
        <div key={index}>
          <Heading mb="2" size="md">
            {title}
          </Heading>
          <List spacing="1">
            {links.map(({href, text}, index) => (
              <ListItem key={index}>
                <Link href={href}>{text}</Link>
              </ListItem>
            ))}
          </List>
        </div>
      ))}
    </SimpleGrid>
  );
}

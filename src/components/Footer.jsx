import {
  Heading, Link, List, ListItem, SimpleGrid,
} from '@chakra-ui/react';
import React from 'react';

import { defaultConfig as footerConfig } from '../chakra-helpers/footer';

export default function Footer() {
  return (
    <SimpleGrid
      as="footer"
      minChildWidth="150px"
      spacing={{ base: 6, md: 8 }}
      borderTopWidth="1px"
      px="10"
      py="12"
    >
      {footerConfig.map(({ links, title }, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={index}>
          <Heading mb="2" size="md">
            {title}
          </Heading>
          <List spacing="1">
            {links.map(({ href, text }, linkIndex) => (
              // eslint-disable-next-line react/no-array-index-key
              <ListItem key={linkIndex}>
                <Link href={href}>{text}</Link>
              </ListItem>
            ))}
          </List>
        </div>
      ))}
    </SimpleGrid>
  );
}

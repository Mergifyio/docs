import PropTypes from 'prop-types';
import React from 'react';
import Search from '../Search';
import StudioButton from './StudioButton';
// import MergifyLogo from '../../assets/logos/mergify-logo-title-horizontal.svg';
import {ReactComponent as ApolloLogo} from '@apollo/space-kit/logos/logo.svg';
import {
  Box,
  Center,
  Flex,
  HStack,
  IconButton,
  useColorMode,
  useColorModeValue
} from '@chakra-ui/react';
import {FiMoon, FiSun} from 'react-icons/fi';
import {Link as GatsbyLink} from 'gatsby';
import {useTagColors} from '../../utils';

const EYEBROW_HEIGHT = 32;
const HEADER_HEIGHT = 60;
const HEADER_BORDER_WIDTH = 1;
export const TOTAL_HEADER_HEIGHT =
  EYEBROW_HEIGHT + HEADER_HEIGHT + HEADER_BORDER_WIDTH;

function Eyebrow({children}) {
  const bg = useColorModeValue('indigo.50', 'indigo.800');
  const bgHover = useColorModeValue('indigo.100', 'indigo.700');
  return (
    <Center
      bg={bg}
      _hover={{bg: bgHover}}
      css={{height: EYEBROW_HEIGHT}}
      fontSize="sm"
      fontWeight="semibold"
      as="a"
      href="https://summit.graphql.com/?utm_campaign=2022-07-22_GraphQLSummit&utm_medium=website&utm_source=apollo"
      target="_blank"
      rel="noopener noreferrer"
      px="3"
    >
      <span>{children}</span>
    </Center>
  );
}

Eyebrow.propTypes = {
  children: PropTypes.node.isRequired
};

export function Header({children, algoliaFilters}) {
  const {toggleColorMode, colorMode} = useColorMode();
  const [tagBg, tagTextColor] = useTagColors();
  return (
    <Box pos="sticky" top="0" zIndex="2">
      <Eyebrow>
        GraphQL Summit is back for three days of insights, hands-on learning,
        and fun to celebrate the GraphQL community. Join us in San Diego Oct
        3-5.
      </Eyebrow>
      <Flex
        align="center"
        as="header"
        px="4"
        boxSizing="content-box"
        bg="bg"
        css={{
          height: HEADER_HEIGHT,
          borderBottomWidth: HEADER_BORDER_WIDTH
        }}
      >
        <HStack spacing="4" d={{base: 'none', md: 'flex'}}>
          <Flex
            as={GatsbyLink}
            to="/"
            align="center"
            d={{base: 'none', md: 'flex'}}
          >
            <Box
              ml="1.5"
              px="1.5"
              fontSize="sm"
              fontWeight="semibold"
              textTransform="uppercase"
              letterSpacing="widest"
              bg={tagBg}
              color={tagTextColor}
              rounded="sm"
            >
              Docs
            </Box>
          </Flex>
          {children}
        </HStack>
        <HStack d={{base: 'flex', md: 'none'}}>
          {children}
        </HStack>
        <IconButton
          ml="auto"
          mr="2"
          fontSize="xl"
          variant="ghost"
          onClick={toggleColorMode}
          icon={colorMode === 'dark' ? <FiSun /> : <FiMoon />}
        />
        {process.env.ALGOLIA_SEARCH_KEY && (
          <Search algoliaFilters={algoliaFilters} />
        )}
        <StudioButton />
      </Flex>
    </Box>
  );
}

Header.propTypes = {
  children: PropTypes.node,
  algoliaFilters: PropTypes.array
};

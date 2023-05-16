import Footer from './Footer';
import Header, {TOTAL_HEADER_HEIGHT} from './Header';
import MobileNav from './MobileNav';
import PropTypes from 'prop-types';
import React from 'react';
import Sidebar, {
  SIDEBAR_WIDTH_BASE,
  SIDEBAR_WIDTH_XL,
  SidebarNav
} from './Sidebar';
import useLocalStorage from 'react-use/lib/useLocalStorage';
import {
  Box,
  Divider,
  Fade,
  Flex,
  Heading,
  IconButton,
  Tooltip,
  useColorModeValue,
  useToken
} from '@chakra-ui/react';
import {FiChevronsRight} from 'react-icons/fi';
import '../main.css'

export function usePageLayoutProps(props) {
  const paddingTop = useToken('space', 10);
  const paddingBottom = useToken('space', 12);
  return {
    ...props,
    paddingTop,
    paddingBottom
  };
}

export default function Page({
  pageContext,
  title,
  children,
  banner,
  subtitle,
  pagination,
  aside,
  paddingTop,
  paddingBottom,
  contentProps
}) {
  const [sidebarHidden, setSidebarHidden] = useLocalStorage('sidebar');

  const {navItems} = pageContext;
  const bgColor = useColorModeValue('white', 'blue.800');

  return (
    <>
      <Header>
        <MobileNav>
          <SidebarNav navItems={navItems} darkBg="gray.700" />
        </MobileNav>
      </Header>
      <Fade in={sidebarHidden} unmountOnExit delay={0.25}>
        <Tooltip placement="right" label="Show sidebar">
          <IconButton
            display={{base: 'none', md: 'flex'}}
            pos="fixed"
            mt="2"
            left="2"
            size="sm"
            variant="outline"
            fontSize="md"
            icon={<FiChevronsRight />}
            css={{top: TOTAL_HEADER_HEIGHT}}
            onClick={() => setSidebarHidden(false)}
          />
        </Tooltip>
      </Fade>
      <Sidebar isHidden={sidebarHidden}>
        <SidebarNav navItems={navItems} onHide={() => setSidebarHidden(true)} />
      </Sidebar>
      <Box
        marginLeft={{
          base: 0,
          md: sidebarHidden ? 0 : SIDEBAR_WIDTH_BASE,
          xl: sidebarHidden ? 0 : SIDEBAR_WIDTH_XL
        }}
        transitionProperty="margin-left"
        transitionDuration="normal"
        bg={bgColor}
      >
        {banner}
        <Flex
          maxW="6xl"
          mx="auto"
          align="flex-start"
          px={{base: 6, md: 10}}
          as="main"
          sx={{
            paddingTop,
            paddingBottom
          }}
        >
          <Box flexGrow="1" w="0">
            <Heading as="h1" size="2xl">
              {title}
            </Heading>
            {subtitle}
            <Divider my="8" />
            <Box fontSize={{md: 'lg'}} lineHeight={{md: 1.7}} {...contentProps}>
              {children}
            </Box>
            {pagination}
          </Box>
          {aside}
        </Flex>
        <Footer />
      </Box>
    </>
  );
}

Page.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  pageContext: PropTypes.object.isRequired,
  paddingTop: PropTypes.string.isRequired,
  paddingBottom: PropTypes.string.isRequired,
  banner: PropTypes.element,
  pagination: PropTypes.element,
  aside: PropTypes.element,
  subtitle: PropTypes.node,
  description: PropTypes.string,
  contentProps: PropTypes.object
};

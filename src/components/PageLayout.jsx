import {
  Box,
  Divider,
  Fade,
  Flex,
  Heading,
  IconButton,
  Tooltip,
  useColorModeValue,
  useToken,
  Link,
  HStack,
  Button,
  Show,
} from '@chakra-ui/react';
import PropTypes from 'prop-types';

import React from 'react';

import { AiOutlineDashboard } from 'react-icons/ai';
import { FaGithub } from 'react-icons/fa';
import { FiChevronsRight } from 'react-icons/fi';
import { HiOutlineDocumentArrowUp } from 'react-icons/hi2';
import { SiSlack, SiStatuspage } from 'react-icons/si';
import useLocalStorage from 'react-use/lib/useLocalStorage';

import navItems from '../content/config';
import {
  PathContext, flattenNavItems, getFullPath, isPathActive,
} from '../utils';

import Footer from './Footer';
import Header, { TOTAL_HEADER_HEIGHT } from './Header';
import MobileNav from './MobileNav';
import SEO from './SEO/SEO';
import Sidebar, {
  SIDEBAR_WIDTH_BASE,
  SIDEBAR_WIDTH_XL,
  SidebarNav,
} from './Sidebar';

import '../main.css';

export function usePageLayoutProps(props) {
  const paddingTop = useToken('space', 10);
  const paddingBottom = useToken('space', 12);
  return {
    ...props,
    paddingTop,
    paddingBottom,
  };
}

// eslint-disable-next-line react/prop-types
function HeaderLink({ icon, ...linkProps }) {
  const activeHoverBg = useColorModeValue('blue.50', 'blue.500');

  return (
    <Button
      whiteSpace="nowrap"
      variant="ghost"
      roundedLeft="full"
      roundedRight="full"
      fontWeight="normal"
      leftIcon={icon}
      _hover={{
        bg: activeHoverBg,
      }}
    >
      <Link
        style={{ textDecoration: 'none' }}
        target="_blank"
        sx={{
          code: {
            color: 'inherit',
          },
        }}
        {...linkProps}
      />
    </Button>
  );
}

export default function Page({
  title,
  children,
  banner,
  subtitle,
  aside,
  paddingTop,
  paddingBottom,
  contentProps,
  description,
}) {
  const { uri, basePath } = React.useContext(PathContext);

  const [sidebarHidden, setSidebarHidden] = useLocalStorage('sidebar');

  const bgColor = useColorModeValue('white', 'blue.800');
  const activeItem = flattenNavItems(navItems)
    .find((navItem) => (
      navItem?.path && isPathActive(getFullPath(navItem?.path, basePath), uri)
    ));
  const pageTitle = activeItem?.title ? `${activeItem?.title} | Mergify Documentation` : 'Mergify Documentation';

  return (
    <>
      <SEO
        title={pageTitle}
        pathname={activeItem?.path}
        description={description}
      />
      <Header>
        <MobileNav>
          <SidebarNav darkBg="gray.700" />
        </MobileNav>
        <Show above="xl">
          <HStack marginX={20} spacing={6}>
            <HeaderLink href="https://dashboard.mergify.com" icon={<AiOutlineDashboard />}> Dashboard</HeaderLink>
            <HeaderLink href="https://slack.mergify.com" icon={<SiSlack />}> Slack Community</HeaderLink>
            <HeaderLink href="https://github.com/Mergifyio/mergify/discussions" icon={<FaGithub />}> Discussions</HeaderLink>
            <HeaderLink href="https://changelog.mergify.com" icon={<HiOutlineDocumentArrowUp />}> Changelog</HeaderLink>
            <HeaderLink href="https://status.mergify.com" icon={<SiStatuspage />}> Status</HeaderLink>
          </HStack>
        </Show>
      </Header>
      <Fade in={sidebarHidden} unmountOnExit delay={0.25}>
        <Tooltip placement="right" label="Show sidebar">
          <IconButton
            display={{ base: 'none', md: 'flex' }}
            pos="fixed"
            mt="2"
            left="2"
            size="sm"
            variant="outline"
            fontSize="md"
            icon={<FiChevronsRight />}
            css={{ top: TOTAL_HEADER_HEIGHT }}
            onClick={() => setSidebarHidden(false)}
          />
        </Tooltip>
      </Fade>
      <Sidebar isHidden={sidebarHidden}>
        <SidebarNav onHide={() => setSidebarHidden(true)} />
      </Sidebar>
      <Box
        marginLeft={{
          base: 0,
          md: sidebarHidden ? 0 : SIDEBAR_WIDTH_BASE,
          xl: sidebarHidden ? 0 : SIDEBAR_WIDTH_XL,
        }}
        transitionProperty="margin-left"
        transitionDuration="normal"
        bg={bgColor}
      >
        {banner}
        <Flex
          maxW="8xl"
          mx="auto"
          align="flex-start"
          px={{ base: 6, md: 10 }}
          as="main"
          sx={{
            paddingTop,
            paddingBottom,
          }}
        >
          <Box flexGrow="1" w="0">
            <Heading as="h1" size="2xl">
              {title}
            </Heading>
            {subtitle}
            <Divider my="8" />
            <Box fontSize={{ md: 'lg' }} lineHeight={{ md: 1.7 }} {...contentProps}>
              {children}
            </Box>
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
  aside: PropTypes.element,
  subtitle: PropTypes.node,
  description: PropTypes.string,
  contentProps: PropTypes.object,
};

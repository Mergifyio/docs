import {
  Box,
  Button,
  Flex,
  IconButton,
  Tooltip,
  chakra,
  useColorModeValue,
} from '@chakra-ui/react';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { BsChevronContract, BsChevronExpand } from 'react-icons/bs';
import { FiChevronsLeft } from 'react-icons/fi';
import useLocalStorage from 'react-use/lib/useLocalStorage';

import { flattenNavItems } from '../../utils';

import NavItems, { NavContext } from './NavItems';

export function SidebarNav({
  navItems, onHide, darkBg = 'blue.800', children,
}) {
  const bg = useColorModeValue('white', darkBg);

  const navGroups = useMemo(
    () => flattenNavItems(navItems).filter((item) => item.children),
    [navItems],
  );

  // set all nav items to close by default
  const initialNavState = useMemo(
    () => navGroups.reduce(
      (acc, group) => ({
        ...acc,
        [group.id]: false,
      }),
      {},
    ),
    [navGroups],
  );

  // save nav state in storage
  const [localNavState, setLocalNavState] = useLocalStorage('nav');

  // combine initial and local nav states
  const nav = useMemo(
    () => ({
      ...initialNavState,
      ...localNavState,
    }),
    [localNavState, initialNavState],
  );

  // compute expand/collapse all state from nav state
  const isAllExpanded = useMemo(
    () => (
      // get an array of the state of all nav items that also exist in the list of
      // valid nav group ids (above)
      navGroups.every((group) => nav[group.id])
    ),
    [navGroups, nav],
  );

  const context = useMemo(() => ({ nav, setNav: setLocalNavState }), [nav, setLocalNavState]);

  return (
    <>
      <Box p="2" pl="0" pos="sticky" top="0" bg={bg} zIndex="1">
        {children}
        <Flex>
          <Button
            mr="auto"
            size="sm"
            variant="ghost"
            roundedRight="full"
            roundedLeft="none"
            isDisabled={!navGroups.length}
            leftIcon={
              isAllExpanded ? <BsChevronContract /> : <BsChevronExpand />
            }
            onClick={() => {
              const expanded = !isAllExpanded;
              setLocalNavState(
                navGroups.reduce(
                  (acc, group) => ({
                    ...acc,
                    [group.id]: expanded,
                  }),
                  {},
                ),
              );
            }}
          >
            {isAllExpanded ? 'Collapse' : 'Expand'} all
          </Button>
          {onHide && (
            <Tooltip label="Hide sidebar">
              <IconButton
                size="sm"
                variant="ghost"
                fontSize="md"
                onClick={onHide}
                icon={<FiChevronsLeft />}
              />
            </Tooltip>
          )}
        </Flex>
      </Box>
      <NavContext.Provider value={context}>
        <chakra.nav pt="1" pr="2" pb="4">
          <NavItems items={navItems} />
        </chakra.nav>
      </NavContext.Provider>
    </>
  );
}

SidebarNav.propTypes = {
  children: PropTypes.node,
  navItems: PropTypes.array.isRequired,
  onHide: PropTypes.func,
  darkBg: PropTypes.string,
};

import {
  Flex, Link, Tag, TagLabel, TagLeftIcon,
} from '@chakra-ui/react';
import React from 'react';
import { BsCode } from 'react-icons/bs';
import { FaCrown } from 'react-icons/fa';
import { MdOutlineWorkspacePremium } from 'react-icons/md';

interface Props {
  advanced: boolean;
  premium: boolean;
  openSource: boolean;
}

/**
 * Renders tags for each plan advanced, premium and opensource.
 * Meaning that a feature is available for
 * one or more of these plans.
 *
 * *Must be placed beside a title to avoid big margins*
 * @example `##Awesome feature <PlanTags advanced premium />`
 * @returns
 */
export default function PlanTags({ advanced, premium, openSource }: Props) {
  return (
    <Flex alignItems="flex-start" gap="2" marginTop={2}>
      {advanced && (
        <Link href="https://mergify.com/pricing" target="_blank" rel="noopenner">
          <Tag size="md" colorScheme="orange">
            <TagLeftIcon as={FaCrown} />
            <TagLabel>Advanced Plan Feature</TagLabel>
          </Tag>
        </Link>
      )}
      {premium && (
        <Link href="https://mergify.com/pricing" target="_blank" rel="noopenner">
          <Tag size="md" colorScheme="blue">
            <TagLeftIcon as={MdOutlineWorkspacePremium} />
            <TagLabel>Premium Plan Feature</TagLabel>
          </Tag>
        </Link>
      )}
      {openSource && (
        <Tag size="md" colorScheme="green">
          <TagLeftIcon as={BsCode} />
          <TagLabel>Open Source Feature</TagLabel>
        </Tag>
      )}
    </Flex>
  );
}

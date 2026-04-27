import type * as mdast from 'mdast';
import type * as unified from 'unified';
import { visit } from 'unist-util-visit';
import enterpriseReleases from '../src/data/enterprise-releases.json';

const SENTINEL = '@@ENTERPRISE_VERSION@@';

export function remarkEnterpriseVersionPlugin(): unified.Plugin<[], mdast.Root> {
  const latestVersion = enterpriseReleases[0]?.version;
  if (!latestVersion) {
    throw new Error('remark-enterprise-version: no version found in enterprise-releases.json');
  }

  const transformer: unified.Transformer<mdast.Root> = (tree) => {
    visit(tree, (node) => {
      if (
        (node.type === 'text' || node.type === 'inlineCode' || node.type === 'code') &&
        typeof (node as { value?: string }).value === 'string' &&
        (node as { value: string }).value.includes(SENTINEL)
      ) {
        (node as { value: string }).value = (node as { value: string }).value.replaceAll(
          SENTINEL,
          latestVersion
        );
      }
    });
  };

  return function attacher() {
    return transformer;
  };
}

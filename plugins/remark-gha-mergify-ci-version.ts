import type * as mdast from 'mdast';
import type * as unified from 'unified';
import { visit } from 'unist-util-visit';
import ghaMergifyCiVersion from '../src/data/gha-mergify-ci-version.json';

const SENTINEL = '@@GHA_MERGIFY_CI_VERSION@@';

export function remarkGhaMergifyCiVersionPlugin(): unified.Plugin<[], mdast.Root> {
  const version = ghaMergifyCiVersion.version;
  if (!version) {
    throw new Error(
      'remark-gha-mergify-ci-version: no version found in gha-mergify-ci-version.json'
    );
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
          version
        );
      }
    });
  };

  return function attacher() {
    return transformer;
  };
}

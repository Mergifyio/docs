import type * as mdast from 'mdast';
import type * as unified from 'unified';
import { visit } from 'unist-util-visit';
import buildkitePluginVersion from '../src/data/buildkite-plugin-version.json';

const SENTINEL = '@@BUILDKITE_PLUGIN_VERSION@@';

export function remarkBuildkiteVersionPlugin(): unified.Plugin<[], mdast.Root> {
  const version = buildkitePluginVersion.version;
  if (!version) {
    throw new Error('remark-buildkite-version: no version found in buildkite-plugin-version.json');
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

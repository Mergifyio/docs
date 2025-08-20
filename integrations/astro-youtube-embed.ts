import type { AstroIntegration } from 'astro';
import type * as mdast from 'mdast';
import remarkDirective from 'remark-directive';
import type * as unified from 'unified';
import { remove } from 'unist-util-remove';
import { visit } from 'unist-util-visit';
import { makeComponentNode } from './utils/makeComponentNode';

const YoutubeTagname = 'AutoImportedYoutube';
export const youtubeAutoImport: Record<string, [string, string][]> = {
  '~/components/Youtube.astro': [['default', YoutubeTagname]],
};

/**
 * remark plugin to convert ::youtube markup in youtube embeded video
 *
 * example:
 * ::youtube[Cool youtube video]{v=01ab2cd3efg}
 *
 * Will embed the youtube video (with id 01ab2cd3efg) in the page.
 */
function remarkYoutubeEmbed(): unified.Plugin<[], mdast.Root> {
  const transformer: unified.Transformer<mdast.Root> = (tree) => {
    visit(tree, (node, index, parent) => {
      if (!parent || index === null || node.type !== 'leafDirective' || node.name !== 'youtube')
        return;
      let title: string | undefined;

      remove(node, (child) => {
        if ((child.data as { directiveLabel?: string })?.directiveLabel) {
          if ('children' in child && 'value' in (child.children as any)[0]) {
            title = (child.children as any)[0].value;
          }
          return true;
        }
      });

      if (index !== undefined) {
        // Replace this node with the aside component it represents.
        parent.children[index] = makeComponentNode(
          YoutubeTagname,
          { attributes: { title, video: node.attributes?.v } },
          ...(node.children as mdast.BlockContent[])
        );
      } else {
        throw new Error('Youtube directive has no parent');
      }
    });
  };

  return function attacher() {
    return transformer;
  };
}

/**
 * Astro integration that sets up the remark plugin and auto-imports the `<Youtube>` component everywhere.
 */
export function astroYoutubeEmbeds(): AstroIntegration {
  return {
    name: '@astrojs/youtube-embed',
    hooks: {
      'astro:config:setup': ({ updateConfig }) => {
        updateConfig({
          markdown: {
            remarkPlugins: [remarkDirective, remarkYoutubeEmbed()],
          },
        });
      },
    },
  };
}

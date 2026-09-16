import { isUnifiedProcessor } from '@astrojs/markdown-remark';
import type { AstroConfig } from 'astro';

/**
 * Return the configured unified Markdown processor, so an integration can push
 * remark/rehype plugins onto it.
 *
 * Throws rather than skipping when another processor is configured: Astro 7's
 * default, Sätteri, never runs remark plugins, so skipping would publish raw
 * directive markup on every page with no error.
 */
export function unifiedProcessorOf(config: AstroConfig, integration: string) {
  const { processor } = config.markdown;
  if (!isUnifiedProcessor(processor)) {
    throw new Error(
      `${integration} needs \`markdown.processor: unified({...})\` from \`@astrojs/markdown-remark\`, got \`${processor.name}\`.`
    );
  }
  return processor;
}

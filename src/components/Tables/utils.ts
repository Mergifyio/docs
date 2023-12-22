import rehypeFormat from 'rehype-format';
import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import rehypeRaw from 'rehype-raw';

export function renderMarkdown(markdown: string) {
	const file = unified()
		.use(remarkParse)
		.use(remarkRehype)
		.use(rehypeFormat)
		.use(rehypeStringify)
		.use(rehypeRaw)
		.processSync(markdown);

	return file.toString();
}

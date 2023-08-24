export type Page = {
  id: string;
  childMdx: {
    fields: {
      slug: string
    }
    excerpt: string;
    frontmatter: {
      title: string;
      description: string;
      toc: boolean;
      tags: string;
    }
  }
};

export type PageQuery = {
  pages: {
    nodes: Page[]
  }
};

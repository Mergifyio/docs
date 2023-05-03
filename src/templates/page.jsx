import Page from '../components/Page';
import PropTypes from 'prop-types';
import React from 'react';
import {graphql} from 'gatsby';

export default function PageTemplate({data, location, pageContext, children}) {
  const page = (
    <Page file={data.file} uri={location.pathname} pageContext={pageContext}>{children}</Page>
  );
  return pageContext.internal ? <></> : page;
}

PageTemplate.propTypes = {
  data: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  pageContext: PropTypes.object.isRequired
};

export const pageQuery = graphql`
  query GetPage($id: String!) {
    file(id: {eq: $id}) {
      name
      basePath: sourceInstanceName
      relativePath
      childMdx {
        body
        headings {
          depth
          value
        }
        frontmatter {
          title
          description
          toc
          tags
        }
      }
    }
  }
`;

# Apollo Chakra UI helpers

This package contains Chakra UI theme options that are shared between DX properties. This makes it easy to set up a theme with consistent color palettes, fonts, and component styles.

- [Installation](#installation)
- [Usage](#usage)
  - [Color palettes](#color-palettes)
  - [Footer configuration](#footer-configuration)

## Installation

This package has peer dependencies on `@chakra-ui/react`. Make sure those packages are already installed in your project, and then install this package.

```bash
npm i @apollo/chakra-helpers
```

## Usage

The easiest way to set up Chakra UI in a Gatsby website is by using the `@chakra-ui/gatsby-plugin` package.

```js
// gatsby-config.js
module.exports = {
  plugins: ["@chakra-ui/gatsby-plugin"],
};
```

Next, use Gatsby component shadowing to shadow the default `theme.js` file in the plugin. Use the `extendTheme` function to override default Chakra theme values and export your new theme.

```js
// src/@chakra-ui/gatsby-plugin/theme.js
import { fonts, components } from "@apollo/chakra-helpers";
import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  fonts,
  components,
});

export default theme;
```

### Footer configuration

This package exports an object that helps configure footers on all Apollo properties. Each category contains a title field and an array of link objects with their own titles and URLs.

```js
// Footer.js
import {footerConfig} from '@apollo/chakra-helpers';

export default function Footer() {
  return (
    <nav>
      {footerConfig.map(({links, title}, index) => (
        <ul key={index}>
          {links.map((link, index) => (
            <li key={index}>
              <a href={link.href}>{link.text}</a>
            </li>
          )}
        </ul>
      )}
    </nav>
  )
}
```

This package also exports the individual parts that make up the default `footerConfig`. These can be composed together to create your own custom footers.

```js
import {
  communityCategory,
  companyCategory,
  helpCategory,
  productCategory,
  whyApolloCategory
} from '@apollo/chakra-helpers/lib/footer';

const customFooterConfig = [
  communityCategory,
  helpCategory,
  whyApolloCategory
];
```

For your convenince, there are also exported `Category` and `Link` interfaces for type safety and intellisense in TypeScript projects.

```ts
import {Category, Link} from '@apollo/chakra-helpers/lib/footer';

const customLink: Link = {
  title: "A Custom Link",
  href: "https://www.acustomlink.com"
};

const customCategory: Category = {
  title: "My Custom Category",
  links: [customLink]
}
```

## Publishing changes

We use [Changesets](https://github.com/changesets/changesets) to automate the publishing of new versions of this package to the NPM registry.

To publish a new version, first add a changeset to your PR using `npx changeset add`. Follow the prompts in your terminal to select the version bump for this release, and add a message describing what is being changed.

After this PR gets merged to main, a new PR will be opened automatically that increments the package version. When this PR is merged, [a GitHub action](../../.github/workflows/release-pr.yml) will be run that publishes the package to NPM.

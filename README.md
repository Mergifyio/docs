# Mergify Docs

This repository contains the code responsible for building the Mergify Docs
site.

## Developing locally

Run a local server to see your changes.

1. Install NPM dependencies:

    ```sh
    npm i
    ```

2. Start the local development environment:

    ```sh
    npm start
    ```
Note that in dev mode like this, a page is built only when accessing it from the browser.
So it may take a few seconds when navigating through pages.

## Preview prod build

You can build docs and run a preview close to how it's done in production

1. Build the docs

    ```sh
    npm run build
    ```

2. Run the preview

    ```sh
    npm run preview
    ```

Note that during the build, you can encounter some errors that you won't see in local dev.
This is because you're building every single page, in opposite of a local dev server that builds
pages when you visit them.
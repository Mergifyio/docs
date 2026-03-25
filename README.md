# Mergify Documentation

The source code for [docs.mergify.com](https://docs.mergify.com) — the official
documentation for Mergify, the merge queue and CI optimization platform.

Built with [Astro](https://astro.build/) and MDX.

## Prerequisites

You need **Node.js 24** installed on your machine. If you don't have it yet:

- **Any platform** (using [nvm](https://github.com/nvm-sh/nvm) — recommended):
  ```sh
  nvm install 24
  nvm use 24
  ```

- **macOS** (using [Homebrew](https://brew.sh)):
  ```sh
  brew install node@24
  ```
  Since `node@24` is a keg-only formula, Homebrew won't add it to your PATH automatically.
  Follow the instructions Homebrew prints after installation, or add this to your shell
  profile (`~/.zshrc` on macOS, or `~/.bashrc` if you use Bash):
  ```sh
  export PATH="$(brew --prefix node@24)/bin:$PATH"
  ```
  Then restart your terminal.

- **Or download directly** from [nodejs.org](https://nodejs.org/)

You can verify your Node version with:

```sh
node --version
# Should output v24.x.x
```

> **Note:** The required version is specified in the `.node-version` file
> at the root of this repository. Tools like `nvm`, `fnm`, and `mise`
> can read this file automatically.

## Getting Started

1. **Clone the repository:**

   ```sh
   git clone https://github.com/Mergify/mergify-docs.git
   cd mergify-docs
   ```

2. **Install dependencies:**

   ```sh
   npm install
   ```

   This downloads all the packages the project needs. It may take a minute the first time.

3. **Start the development server:**

   ```sh
   npm start
   ```

   Open [http://localhost:4321](http://localhost:4321) in your browser to see the site.

   > Pages are built on-demand in dev mode, so the first visit to each page may take a few seconds.

## Common Commands

| Command              | What it does                                          |
| -------------------- | ----------------------------------------------------- |
| `npm start`          | Start the local development server                    |
| `npm run build`      | Build the full site for production (with type checks) |
| `npm run preview`    | Preview the production build locally                  |
| `npm run check`      | Run all linting and type checks                       |
| `npm run format`     | Auto-format code with Biome                           |
| `npm run format:check` | Check formatting without changing files             |
| `npm test`           | Run unit tests with Vitest                            |

## Project Structure

```text
src/
├── content/
│   ├── docs/          # Documentation pages (MDX files) — this is where most edits happen
│   └── changelog/     # Changelog entries
├── components/        # Astro and React UI components
├── layouts/           # Page layout templates
└── util/              # Utility functions
integrations/          # Custom Astro integrations
plugins/               # Custom Remark/Rehype plugins
public/                # Static assets (images, fonts, etc.)
```

### Documentation content

All documentation lives in `src/content/docs/` as `.mdx` files. The main sections are:

- `configuration/` — Mergify configuration reference
- `merge-queue/` — Merge queue features and setup
- `commands/` — GitHub comment commands
- `ci-insights/` — CI analytics and optimization
- `merge-protections/` — Branch protection rules
- `integrations/` — Third-party integrations
- `enterprise/` — Enterprise features

## Editing Documentation

Each `.mdx` file starts with frontmatter — metadata between `---` fences:

```mdx
---
title: My Page Title
description: A short description of the page.
---

Your content here, written in Markdown.
```

Both `title` and `description` are **required**.

### Callout boxes

Use directive syntax for callout boxes:

```mdx
:::note
  Important information here.
:::

:::tip
  Helpful suggestion.
:::

:::caution
  Be careful about this.
:::
```

### Images

Place images in `src/content/docs/images/` and use relative imports in your MDX files.

## Before You Commit

Always run the checks before pushing your changes:

```sh
npm run check
```

This runs TypeScript type checking, ESLint, and Biome formatting checks all at once. Fix any errors before committing.

You can also do a full production build to catch issues that only appear when building all pages:

```sh
npm run build
```

## Production Build Preview

To see exactly what the site will look like in production:

```sh
npm run build && npm run preview
```

> The build compiles every page, so you may see errors here that don't
> appear in dev mode (where pages are built one at a time).

## Agentation (Visual Feedback for AI Agents)

[Agentation](https://www.agentation.com) lets developers leave visual
annotations directly on the rendered site so AI coding agents can see
and act on them. It consists of a React overlay component and an MCP
server.

### Setup

Agentation is already configured in this project:

1. **React component** — included in `src/layouts/BaseLayout.astro` (dev mode only via `import.meta.env.DEV`)
2. **MCP server** — configured in `.claude/mcp.json`
3. **npm package** — installed as a dev dependency (`agentation`)

### Usage

1. Start the dev server (`npm start`) and open the site in your
   browser

2. Use the Agentation overlay to create annotations on page elements
   (click on elements, leave comments describing what needs to change)

3. AI agents connected via the MCP server pick up pending annotations
   and act on them automatically

### Adding Agentation to a new agent

Add the following to your agent's MCP configuration:

```json
{
  "mcpServers": {
    "agentation": {
      "command": "npx",
      "args": ["-y", "agentation-mcp", "server"]
    }
  }
}
```

## Tech Stack

- **Framework:** [Astro 5](https://astro.build/) with MDX
- **UI:** React 19, Vue (for select components)
- **Language:** TypeScript (strict mode)
- **Formatter:** [Biome](https://biomejs.dev/)
- **Linter:** ESLint 9
- **Tests:** Vitest
- **Deployment:** Cloudflare Pages

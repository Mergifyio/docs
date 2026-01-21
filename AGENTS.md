# Mergify Documentation Site

> Official documentation for Mergify - the merge queue and CI optimization platform.

## Quick Facts

- **Framework**: Astro 5.x with MDX
- **UI Libraries**: React 19, Vue (for specific components)
- **Language**: TypeScript (strict mode)
- **Node Version**: 22 (see `.node-version`)
- **Formatter**: Biome (primary), Prettier (for .astro files)
- **Linter**: ESLint 9 (flat config)
- **Testing**: Vitest
- **Deployment**: Cloudflare Pages

## Key Commands

```bash
# Development
npm start              # Start dev server (pages build on-demand)
npm run build          # Full production build with type checking
npm run preview        # Preview production build locally

# Code Quality
npm run check          # Run all checks: astro check + eslint + biome
npm run format         # Auto-format with Biome
npm run format:check   # Check formatting without modifying

# Testing
npm run test           # Run Vitest unit tests
./scripts/detect-broken-links.sh  # Check for broken links
```

## Key Directories

- `src/content/docs/` - Main documentation pages (MDX files)
- `src/content/changelog/` - Changelog entries
- `src/components/` - Astro and React components
- `src/layouts/` - Page layout templates
- `src/util/` - Utility functions (with tests)
- `integrations/` - Custom Astro integrations
- `plugins/` - Custom Remark/Rehype plugins
- `public/` - Static assets

## Code Style

### TypeScript
- Strict mode enabled
- Use `~/*` path alias for imports from `src/`
- Prefer interfaces over types (except unions)

### MDX Documentation Files
- Always include YAML frontmatter with `title` and `description`
- Import components at top of file
- Use custom components for callouts: `<Aside type="note|tip|caution|danger">`
- Code blocks use Shiki syntax highlighting

### Formatting
- 100 character line width
- Single quotes
- 2-space indentation
- Trailing commas (ES5 style)
- Semicolons required

## Content Structure

Documentation is organized into sections:
- `configuration/` - Mergify configuration reference
- `merge-queue/` - Merge queue features and setup
- `workflow/` - Workflow automation
- `commands/` - GitHub comment commands
- `ci-insights/` - CI analytics and optimization
- `merge-protections/` - Branch protection rules
- `integrations/` - Third-party integrations
- `enterprise/` - Enterprise features

## Callout Boxes

When writing documentation, use directive syntax for callouts:

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

:::danger
  Critical warning.
:::
```

**Note:** Content inside directives should be indented with 2 spaces.

## Git Workflow

### Creating Branches
When creating a new branch, always track the main branch:
```bash
git checkout -b my-feature-branch --track origin/main
```

### Pushing Changes
Use Mergify's stack command to push:
```bash
mergify stack push
```

Do NOT use regular `git push` - always use `mergify stack push`.

## Critical Rules

1. **Always run `npm run check` before committing** - Catches TypeScript, lint, and format errors
2. **MDX files must have valid frontmatter** - Title and description required
3. **Images go in `src/content/docs/images/`** - Use relative imports
4. **Test locally with `npm run build`** - Ensures SSG works correctly
5. **Use `mergify stack push` to push** - Not regular git push

## Common Issues

- **Build fails on MDX**: Check for unclosed JSX tags or invalid frontmatter
- **Component not found**: Ensure correct import path with `~/` alias
- **Styling issues**: Check CSS scoping in components

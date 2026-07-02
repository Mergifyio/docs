# Component Decision Table

Which component to reach for, by content type. All live in `src/components/`.
Import with the `~/components/...` alias or a relative path. React components are
`.tsx`, Astro components are `.astro`.

## Table of contents

- [Quick map](#quick-map)
- [Config & reference tables (schema-driven)](#config--reference-tables-schema-driven)
- [Callouts](#callouts)
- [Media](#media)
- [Integration & CI pages](#integration--ci-pages)
- [Layout & navigation](#layout--navigation)
- [Specialized visualizations](#specialized-visualizations)

## Quick map

| You are documenting… | Use |
| --- | --- |
| Config options for a model/action | `OptionsTable` / `ActionOptionsTable` |
| A CLI command | `CliCommand` |
| A note / warning / tip | `:::note` / `:::tip` / `:::caution` / `:::danger` (Aside) |
| A dashboard screenshot | `<Image>` from `astro:assets` (see capture-screenshots skill) |
| A YouTube walkthrough | `Youtube` |
| An integration page header | `IntegrationLogo` |
| CI report upload steps | `MergifyCIUploadStep` / `BuildkiteCIUploadStep` / `MergifyCliUploadStep` |
| A product overview card grid | `DocsetGrid` + `Docset` |
| A call-to-action button | `Button` |
| A lifecycle/flow diagram | Graphviz `dot` code block (see mdx-documentation) |

## Config & reference tables (schema-driven)

Prefer these over hand-written tables — they render from the live schema and
never go stale.

```mdx
import OptionsTable from "~/components/OptionsTable.tsx"
import ActionOptionsTable from "~/components/ActionOptionsTable.tsx"

<OptionsTable def="QueueRuleModel" />
<ActionOptionsTable def="QueueActionModel" />
```

- `OptionsTable` `def`: a model name from the config schema (e.g.
  `PullRequestRuleModel`, `QueueRuleModel`).
- `ActionOptionsTable` `def`: an action model (e.g. `QueueActionModel`,
  `LabelActionModel`).
- To find valid `def` names, look at `public/mergify-configuration-schema.json`
  or existing usages: `grep -rh "OptionsTable def=" src/content/docs/`.

CLI reference card from `public/cli-schema.json`:

```mdx
import CliCommand from "~/components/CliCommand.astro"

<CliCommand command="mergify tests show" />
```

## Callouts

Use directive syntax (renders via `Aside.astro`). Content indented 2 spaces.

```mdx
:::note
  Neutral context the reader should know.
:::

:::tip
  A best practice or shortcut.
:::

:::caution
  A risk or gotcha.
:::

:::danger
  Destructive or irreversible action.
:::
```

## Media

```mdx
import { Image } from "astro:assets"
import shot from "../../images/<section>/<page>/<name>.png"

<Image src={shot} alt="What the screenshot shows" />
```

```mdx
import Youtube from "~/components/Youtube.astro"

<Youtube video="dQw4w9WgXcQ" title="Setting up the merge queue" />
```

All article `<img>` get lightbox zoom automatically (`ImageZoom`); add class
`no-zoom` to opt out.

## Integration & CI pages

```mdx
import IntegrationLogo from "~/components/IntegrationLogo.astro"
import logo from "../../images/integrations/<name>/logo.svg"

<IntegrationLogo src={logo} alt="<Name> logo" />
```

CI upload steps (props vary — check the component source for the exact prop, e.g.
`reportPath`):

- `MergifyCIUploadStep.astro` — GitHub Actions YAML step
- `BuildkiteCIUploadStep.astro` — Buildkite pipeline step
- `MergifyCliUploadStep.astro` — CLI-based upload
- `CIInsightsSetupNote.astro`, `CliInstall.astro` — reusable setup snippets

## Layout & navigation

```mdx
import DocsetGrid from "~/components/DocsetGrid.astro"
import Docset from "~/components/Docset.astro"

<DocsetGrid>
  <Docset title="Merge Queue" path="/merge-queue" icon="mergify:merge-queue">
    Keep your main branch green.
  </Docset>
</DocsetGrid>
```

`Button.astro` props: `href`, `variant` (`primary|secondary|ghost|solid`),
`target` (default `_blank`), `icon`, `colorScheme`, `rel`.

## Specialized visualizations

These are bespoke to specific topics — reuse them only on their topic pages, and
read the component source before using:

- `GitGraph.astro`, `StackMapping.astro`, `StacksLocalModel.astro` — stacks
- `ScopesDetection.astro` — merge-queue scopes
- `MergeQueueCalculator/` (React) — interactive queue calculator
- `AcademyCallout.astro` — link to Merge Queue Academy

If unsure whether a specialized component fits, grep for where it is already used:
`grep -rl "ComponentName" src/content/docs/`.

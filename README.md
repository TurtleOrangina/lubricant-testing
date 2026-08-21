# Lubricant Testing

A web application that visualises bicycle chain lubricant test data in an accessible and interactive way. Built with Vue 3, ECharts, and TypeScript.

Can be integrated into existing wordpress websites, see [wordpress.md](wordpress.md).
Is also hosted as stand-alone [website using github pages](https://turtleorangina.github.io/lubricant-testing/).

## Prerequisites — Install Vite+

This project uses [Vite+](https://viteplus.dev/) (`vp`), a unified toolchain that wraps Vite, Vitest, Oxlint, and Oxfmt behind a single CLI. Install it globally once:

```sh
# windows:
irm https://vite.plus/ps1 | iex

# macos / linux
curl -fsSL https://vite.plus | bash
```

Verify the installation:

```sh
vp --version
```

Vite+ is the only tool you need to actively install on your machine to be able to build the website assets.

## Common Commands

```sh
vp install      # install dependencies (run after cloning or pulling)
vp dev          # start the development server with hot-reload
vp build        # type-check, compile, and minify into docs/
vp check        # format, lint, and type-check (run before committing)
vp check --fix  # same, but auto-fixes formatting and lint issues
```

## Test data

`public/assets/data.csv` is generated from the ZFC test workbook — do not edit it by hand.
Drop the latest `.xlsx` in `xlsx_data/`, then:

```sh
vp run convert-xlsx-to-csv   # regenerate public/assets/data.csv
vp run check-data            # verify the csv matches the workbook (for CI)
```

The converter reads three tables from the workbook's `Data Raw revamp 1.1` sheet and the three
tables on `Single Application Longevity`, and joins them on the lubricant name. Two things the
workbook encodes only as formatting are read as data:

- the **font colour** of a lubricant's name gives its category (magenta = immersive wax,
  green = wax drip, cyan = wet drip);
- a **red cell fill** marks a wear rate as extrapolated rather than measured, and extrapolated
  values are left out of the csv.

Names drift between tables, and a few products need a different published name, note or
category than the workbook gives them. Those corrections live in
[`scripts/lib/product-overrides.ts`](scripts/lib/product-overrides.ts); everything else is
discovered automatically, so a new lubricant usually needs no code change.

The converter also cross-checks the workbook's derived tables against its raw data — cumulative
against block-by-block wear, the chain lifespan against the wear total, the "per 5000km" and
"real world" columns against the values they scale — and reports any disagreement as a warning.
Warnings mean the workbook contradicts itself and are worth passing back to whoever maintains
it; they do not block the csv from being written. Errors do.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) with the following extensions:

- [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) — Vue 3 language support and type-aware `.vue` file handling (disable Vetur if installed)
- [Oxlint](https://marketplace.visualstudio.com/items?itemName=oxc.oxc-vscode) — in-editor linting via Oxlint

### Browser DevTools

- Chromium (Chrome, Edge, Brave): [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) + [enable Custom Object Formatters](http://bit.ly/object-formatters)
- Firefox: [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/) + [enable Custom Object Formatters](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

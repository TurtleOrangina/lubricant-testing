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

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) with the following extensions:

- [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) — Vue 3 language support and type-aware `.vue` file handling (disable Vetur if installed)
- [Oxlint](https://marketplace.visualstudio.com/items?itemName=oxc.oxc-vscode) — in-editor linting via Oxlint

### Browser DevTools

- Chromium (Chrome, Edge, Brave): [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) + [enable Custom Object Formatters](http://bit.ly/object-formatters)
- Firefox: [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/) + [enable Custom Object Formatters](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

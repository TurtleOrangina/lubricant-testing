# Lubricant Testing

In this project we are building a small web page that visualizes testing data
from bicycle chain lubricant tests in a accessible and modern way.

## Test data

- Product name
- Product category (one of: immersive wax, wax drip, wet-drip)
- Product cost (in AUD)
- Main Test: Chain wear rate during for each of (up to) 6 stages of 1000km each:
  - Block 1 - No Contamination
  - Block 2 - Dry Offroad conditions
  - Block 3 - No Contamination
  - Block 4 - Wet conditions riding
  - Block 5 - No Contamination
  - Block 6 - Harsh wet conditions riding
- Single Application Logevity. The two numbers "wear rate jump point [km]" and the "total wear allowance [km]" for each of the three conditions:
  - Dry Road
  - Dry Gravel
  - Extreme Conditions

Note that partially filled data is possible:

- product name and category should always exist.
- cost can be missing/unknown
- Main test can be entirely missing
- If the main test is not missing, it will not always contains all blocks, if the test had to be aborted at some point the following blocks will be missing/unset. But no block will ever be skipped.
- Each of the three conditions of the single application longevity test can be missing, but if a condition is not missing, it should always contain the two numbers (jump point and wear allowance).

## Tech stack

- echarts for interactive plots/charts
- vue
- html/css/typescript
- hard-code the test data and not use a API/database yet
- Vite+ [see below for details] (and single file building to ship a single html file to the customer)

## Philosophy

- Use state of the art modern tools and libraries
- Use best practices where possible
- Clean code, use type annotations and modern language features to avoid
  complicated or error prone code.
- Use type checking, linting, code auto-formatting (all provided through vite+). Enable strict
  rules where possible to improve code quality.

# File access/permissions

- You can _only_ read/write files inside of the project directory (cwd)
- This especially includes not being able to write files to /tmp
  => So if you run shell scripts do not try and redirect the output into /tmp, as that will
  result in EACCESS errors. If you need the output in a file, you have to put it into the
  working directory and delete it when finished with it.
- Additionally, this also means no read access to typical binaries from /bin /usr/bin /usr/local/bin
  etc. - so you need to ask the user to execute those commands for you (e.g. vp check --fix)

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

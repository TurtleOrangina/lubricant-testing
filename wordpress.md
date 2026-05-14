# WordPress Integration Guide

This document explains how to embed the Lubricant Testing Vue app into an existing WordPress site.

## Overview

The app ships as three files, all in `docs/assets/`:

- `docs/assets/index.js` — the compiled Vue application (ES module)
- `docs/assets/index.css` — all styles
- `docs/assets/data.csv` — the lubricant test data

A `<div id="lubricant-testing-app"></div>` anywhere on the page is the mount point. The app attaches itself to that element on load.

The app fetches `data.csv` at runtime relative to `index.js`. Because all three files live in the same `assets/` directory, the app finds `data.csv` automatically — this works identically in standalone hosting and in WordPress, with no configuration required.

---

## Step 1 — Create a Custom Plugin

Create a new directory and PHP file in your WordPress installation:

```
wp-content/plugins/lubricant-testing/
├── lubricant-testing.php
└── assets/
    ├── index.js
    ├── index.css
    └── data.csv
```

Copy `docs/assets/index.js`, `docs/assets/index.css`, and `docs/assets/data.csv` from this repository into `wp-content/plugins/lubricant-testing/assets/`.

---

## Step 2 — Register and Enqueue the Assets

Paste the following into `wp-content/plugins/lubricant-testing/lubricant-testing.php`:

```php
<?php
/**
 * Plugin Name: Lubricant Testing
 * Description: Embeds the Lubricant Testing Vue app.
 * Version:     1.0.0
 */

add_action( 'wp_enqueue_scripts', function () {
    $base = plugin_dir_url( __FILE__ ) . 'assets/';
    $ver  = '1.0.0';

    wp_enqueue_style(
        'lubricant-testing',
        $base . 'index.css',
        [],
        $ver
    );

    wp_enqueue_script(
        'lubricant-testing',
        $base . 'index.js',
        [],
        $ver,
        true   // load in footer
    );
} );

// The built JS is an ES module — WordPress does not add type="module" by default.
add_filter( 'script_loader_tag', function ( $tag, $handle ) {
    if ( 'lubricant-testing' !== $handle ) {
        return $tag;
    }
    return '<script type="module" crossorigin src="' .
           esc_url( plugins_url( 'assets/index.js', __FILE__ ) ) .
           '?ver=1.0.0"></script>' . "\n";
}, 10, 2 );
```

Activate the plugin from the WordPress admin panel under **Plugins → Installed Plugins**.

---

## Step 3 — Insert the Mount Point

Place `<div id="lubricant-testing-app"></div>` wherever you want the app to appear. There are several ways to do this depending on your setup:

### Option A — Shortcode (recommended)

Add a shortcode to the plugin so you can drop `[lubricant_testing_app]` into any post, page, or widget:

```php
add_shortcode( 'lubricant_testing_app', function () {
    return '<div id="lubricant-testing-app"></div>';
} );
```

Add this function inside the plugin file (before or after the `wp_enqueue_scripts` action). Then insert `[lubricant_testing_app]` in the page editor at the desired position.

### Option B — Block editor (Gutenberg)

Add a **Custom HTML** block at the desired position and paste:

```html
<div id="lubricant-testing-app"></div>
```

### Option C — Theme template

Edit the relevant template file (e.g. `page.php` in your child theme) and add:

```php
<div id="lubricant-testing-app"></div>
```

at the desired position within the loop or page content area.

---

## Updating the App

When a new version of the app is built:

1. Run `vp build` in this repository to regenerate `docs/assets/index.js`, `docs/assets/index.css`, and `docs/assets/data.csv`. If you did not change the existing website code, the files found in docs/assets should already be up-to-date, and you can skip this step.
2. Copy all three files into `wp-content/plugins/lubricant-testing/assets/`, overwriting the old ones.
3. Bump the `$ver` version string in `lubricant-testing.php` (e.g. `'1.0.1'`) so browsers fetch the new files instead of serving a cached version.

### Updating data only (without rebuilding)

If only the test data has changed, you can update just `data.csv` without a full rebuild or a version bump for the JS/CSS:

1. Replace `public/assets/data.csv` in this repository with the new CSV file.
2. Upload the new file to `wp-content/plugins/lubricant-testing/assets/data.csv` on the server, overwriting the old one.

That's it — the next page load will fetch and parse the new file automatically. No rebuild, no cache-busting needed (browsers do not aggressively cache CSV files the way they cache versioned JS bundles).

#### Verifying the new data

After uploading a new `data.csv`, navigate to the parse report to check for any parsing errors:

- Visit `https://your-site.com/your-page/#parse_data_csv` — the app detects this hash and shows the CSV parse report instead of the normal visualisation.
- The report lists every product that was loaded, flags any warnings (unknown categories, out-of-range values, duplicate names), and shows a clear success or error summary.
- No separate WordPress page is needed; the hash is simply appended to the URL of the page where the app is embedded.

---

## URL Routing Note

The app uses hash-based navigation exclusively. All state — the active tab, selected lubricant, filter flags, and dropdown selections — is encoded after the `#` and never sent to the server.

URL format:

```
#<tab>[/<glossary-anchor>][?param1=value1&param2=value2]
```

Examples:

| What the user sees                                         | URL                                                                                                     |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Overview tab                                               | `#main_test_overview`                                                                                   |
| Blocks tab, Block 2 selected                               | `#main_test_blocks?block=Block%202%20(dry%20dirt)`                                                      |
| Longevity tab, Extreme Conditions, a lubricant highlighted | `#single_application_longevity?condition=Extreme%20Conditions&selected_lubricant=Cyclowax%20Race%20Wax` |
| Glossary, Chain Wear section                               | `#glossary/Chain%20Wear`                                                                                |

Supported hash parameters:

| Parameter             | Values                                                               | Description                               |
| --------------------- | -------------------------------------------------------------------- | ----------------------------------------- |
| `selected_lubricant`  | product name                                                         | Highlights a lubricant in the chart       |
| `include_unavailable` | (flag, no value)                                                     | Shows products not commercially available |
| `block`               | `Block 1 (clean)` … `Block 6 (harsh wet)`                            | Active block on the Blocks tab            |
| `condition`           | `Dry Road Conditions`, `Dry Gravel / MTB / CX`, `Extreme Conditions` | Active condition on the Longevity tab     |

Because the hash fragment is never sent to the server, WordPress sees only the bare page URL and serves the correct page regardless of which tab or selection is active. Bookmarked and shared links work without any server-side configuration or custom rewrite rules.

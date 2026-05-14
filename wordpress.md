# WordPress Integration Guide

This document explains how to embed the Lubricant Testing Vue app into an existing WordPress site.

## Overview

The app ships as two static files:

- `docs/assets/index.js` — the compiled Vue application (ES module)
- `docs/assets/index.css` — all styles

A `<div id="lubricant-testing-app"></div>` anywhere on the page is the mount point. The app attaches itself to that element on load.

---

## Step 1 — Create a Custom Plugin

Create a new directory and PHP file in your WordPress installation:

```
wp-content/plugins/lubricant-testing/
├── lubricant-testing.php
└── assets/
    ├── index.js
    └── index.css
```

Copy `docs/assets/index.js` and `docs/assets/index.css` from this repository into `wp-content/plugins/lubricant-testing/assets/`.

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

1. Run `vp build` in this repository to regenerate `docs/assets/index.js` and `docs/assets/index.css`.
2. Copy the two new files into `wp-content/plugins/lubricant-testing/assets/`, overwriting the old ones.
3. Bump the `$ver` version string in `lubricant-testing.php` (e.g. `'1.0.1'`) so browsers fetch the new files instead of serving a cached version.

---

## Style Isolation Note

The app's CSS resets several global properties (`body`, `h1–h3`, `:root` font settings). These rules may affect the rest of your WordPress theme. If that causes conflicts, wrap all app styles in a more specific selector (e.g. `#lubricant-testing-app`) in `src/style.css` and rebuild, or apply the necessary overrides in your theme's stylesheet.

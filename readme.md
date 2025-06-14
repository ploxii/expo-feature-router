# expo-feature-router

## 🤔 Problem Statement

Currently, expo-router does not support collocation (feature-based folder structure) out of the box. This means developers have to:

1. Set up routes in the `app` folder using the standard file routing system
2. Maintain their actual screen components in a separate `features` folder
3. Manually import each screen from the features folder into its corresponding route file in the app directory

This creates unnecessary duplication and makes it harder to maintain a clean, feature-based project structure.


## 🚀 Solution

> 📁 Enable feature-based routing in [expo-router](https://expo.dev/router) with automatic route generation from your
`features/` folder.

**`expo-feature-router`** scans your `features` directory and mirrors corresponding files into the `app` directory
expected by `expo-router`, preserving layouts, nested routes, and more.

---

## ✨ Features

- ✅ Auto-generates route files from your `features` directory into `app`
- 📂 Supports deeply nested folder structures and dynamic routes (`[id].tsx`, etc.)
- 🔥 Supports hot reload via file watching during development
- ⚙️ Supports both CLI arguments and external config files (`.js` or `.json`)
- 🔍 Ignores folders/files by prefix (e.g. `_`) or glob pattern (`*.utils.tsx`, etc.)

<!-- 🎯 Supports virtual routes via `// route: /custom-path` comments
- 🧩 Respects custom `tsconfig.json` path aliases (`baseUrl`, `paths`) 
- 🧪 Dry run and verbose/debug modes for safety and inspection -->

---

## 📦 Installation

```bash
npm install --save-dev expo-feature-router
# or
yarn add -D expo-feature-router
```

---

## 🚀 Usage

### CLI 

```bash
npx expo-feature-router --watch
```

Or generate routes once:

```bash
npx expo-feature-router
```

You can pass CLI flags or define a config file.

---

### Example CLI options:

```bash
npx expo-feature-router \
  --features src/features \
  --app src/app \
  --excludePrefix _ \
  --include _layout.tsx \
  --ignorePatterns *.utils.*,*.view.* \
  --watch
```

---

## ⚙️ Configuration

Instead of passing CLI flags, you can add a config file named `expo-feature-router.config.js` or `.json` to your project
root:

### `expo-feature-router.config.js`

```js
module.exports = {
    featuresDir: 'src/features',
    appDir: 'src/app',
    excludePrefix: '_',
    include: ['_layout.tsx'],
    ignorePatterns: ['*.utils.*', '*.view.*'],
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    watch: true,
    dryRun: false,
    verbose: true
}
```

### `expo-feature-router.config.json`

```json
{
  "featuresDir": "src/features",
  "appDir": "src/app",
  "excludePrefix": "_",
  "include": [
    "_layout.tsx"
  ],
  "ignorePatterns": [
    "*.utils.*",
    "*.view.*"
  ],
  "extensions": [
    ".tsx",
    ".ts",
    ".jsx",
    ".js"
  ],
  "watch": true,
  "dryRun": false,
  "verbose": true
}
```

Then simply run:

```bash
npx expo-feature-router
```

<!--- ---

## 🧠 Custom Route Mapping via Comments

You can override the default route path using a comment at the top of a file:

```tsx
// route: /custom-path

export default function MyScreen() {
    return <Text>Hello from a custom route</Text>;
}
```

--->

## 📁 Output

Given a structure like:

```
src/features/
  posts/
    index.tsx
    create.tsx
    [id]/
      index.tsx
      edit.tsx
  _components/
    post-preview.tsx
  _utils/
    helpers.ts
```

The plugin will generate:

```
src/app/
  posts/
    index.tsx
    create.tsx
    [id]/
      index.tsx
      edit.tsx
```

Files or folders like `_utils` will be ignored based on `excludePrefix`.

---

## 🧪 Dry Run & Verbose

- Use `--dryRun` or `dryRun: true` to simulate without writing files.
- Use `--verbose` or `verbose: true` to log detailed operations.

---

## 📄 Contributing

1. Fork this repo
2. Clone and install dependencies
3. Create a branch and make your changes
4. Open a PR and let's collaborate 🎉

---

## 📜 License

MIT © [Jesulonimi William](https://github.com/jesulonimii)

---

## 🙌 Acknowledgements

Built with ❤️ for Expo developers who prefer scalable feature-based architecture with expo-router.

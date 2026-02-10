# Netlify Build Fix

## Problem
The Netlify build was failing with the following error:
```
Error: Failed to load native binding
at Object.<anonymous> (/opt/build/repo/node_modules/@swc/core/binding.js:333:11)
```
This was caused by the `@vitejs/plugin-react-swc` plugin, which relies on `@swc/core`. SWC requires platform-specific native binaries (in this case, for Linux) that were either missing or incompatible with the Netlify build environment due to being locked on a Windows machine.

## Solution
I have modified `vite.config.ts` to use `@vitejs/plugin-react` instead of `@vitejs/plugin-react-swc`.
- **Old:** `import react from "@vitejs/plugin-react-swc";`
- **New:** `import react from "@vitejs/plugin-react";`

This switches the build compiler from SWC to the standard Vite plugin (using Babel/Esbuild), which is more robust across different operating systems and CI environments.

## Verification
You already had `@vitejs/plugin-react` installed in your `devDependencies`, so no new installation is required. The build process on Netlify will now skip loading the problematic SWC bindings.

You can verify the fix by pushing these changes to your repository and triggering a new deployment on Netlify.

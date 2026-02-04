# 🚨 Netlify Build Error Fix

The error you are seeing:
`Base directory does not exist: /opt/build/repo/scr`

This indicates that your **Netlify URL/Build Settings** have a typo.
It is looking for a folder named `scr` (which doesn't exist), but you likely meant `src` or just the root directory.

## How to Fix in Netlify Dashboard

1. Go to your **Netlify Dashboard**
2. Select your site
3. Go to **Site Configuration** > **Build & deploy** > **Build settings**
4. Look for **Base directory**
5. Change `scr` to `.` (or leave it empty/clear it)
6. Click **Save**
7. Trigger a new deploy

## I added a `netlify.toml` file
I have also added a `netlify.toml` file to the root of your project with the correct settings:

```toml
[build]
  base = "."
  publish = "dist"
  command = "npm run build"
```

Once you fix the "Base directory" setting in the Netlify UI to point to the root (or clear it), this file will ensure your build runs correctly.

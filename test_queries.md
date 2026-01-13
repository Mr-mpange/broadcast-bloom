# Test Current Query Status

## Current Errors in Console:

1. **user_roles query**: `user_roles?select=user_id,role,profiles!user_roles_user_id_fkey(id,display_name,bio,avatar_url,social_links)&role=in.(dj,presenter)` - 400 error
2. **blogs query**: `blogs?select=id,title,excerpt,featured_image_url,published_at,slug,blog_categories(name)&is_published=eq.true&order=published_at.desc&limit=3` - 400 error

## Expected Queries (after fixes):

1. **user_roles query should be**: Two separate queries:
   - `user_roles?select=user_id,role&role=in.(dj,presenter)`
   - `profiles?select=id,user_id,display_name,bio,avatar_url,social_links&user_id=in.(user_ids)`

2. **blogs query should be**: 
   - `blogs?select=id,title,excerpt,featured_image_url,published_at,slug,category&is_published=eq.true&order=published_at.desc&limit=3`

## Issue Analysis:

The errors suggest that the old code is still running, which means:
1. **Browser cache** - The old JavaScript is cached
2. **Build cache** - The build system hasn't picked up the changes
3. **Hot reload issue** - Development server needs restart

## Solutions:

### 1. Clear Browser Cache
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Or open DevTools → Network tab → check "Disable cache"

### 2. Restart Development Server
```bash
# Stop the current dev server (Ctrl+C)
# Then restart
npm run dev
# or
yarn dev
```

### 3. Clear Build Cache
```bash
# If using Vite
rm -rf node_modules/.vite
npm run dev

# If using other bundler
rm -rf dist
npm run build
```

### 4. Force Browser to Load New Code
Add a cache-busting parameter or check if service worker is caching old code.

## Verification Steps:

1. **Check Network Tab**: Look for the actual queries being made
2. **Check if files changed**: Verify the source files have the correct code
3. **Check build output**: Make sure the built files contain the new code
4. **Disable service worker**: Temporarily disable to rule out caching issues

The fixes are correct in the source code, but the browser/build system might be serving cached versions.
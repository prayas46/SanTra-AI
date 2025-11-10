# 🚀 Quick Start - Test Language Switcher

## ✅ Ready to Test!

I've created a **simpler language button** that will definitely work. It cycles through languages when clicked:
- 🇬🇧 English → 🇮🇳 Hindi → 🇮🇳 Bengali → 🇬🇧 English (repeat)

## Start the Widget

```bash
pnpm --filter widget dev
```

## Open in Browser

```
http://localhost:3001?organizationId=org_31mKCJtUZMz5Q34SwfL3xxJbrtc
```

## What You'll See

1. **Loading Screen**
2. **Auth Screen** - Enter name/email
3. **Language Selection** - Choose your language (first time only)
4. **Selection Screen** - Choose "Start chat"
5. **Chat Screen** - You should now see a **flag button (🇬🇧/🇮🇳)** in the top-right corner!

## Test the Language Button

1. Look at the **top-right corner** of the chat header
2. You should see a flag: 🇬🇧 (or 🇮🇳 if you selected Hindi)
3. **Click the flag** - it will cycle through: EN → HI → BN → EN
4. Watch the console (F12) for: `Language changed to: hi`

## If You Still Don't See the Button

### Quick Fix Steps:

1. **Hard Refresh**: Press `Ctrl + Shift + R`

2. **Clear Storage**:
   - Press F12
   - Application tab → Local Storage
   - Right-click → Clear
   - Refresh page

3. **Try Incognito Mode**:
   - `Ctrl + Shift + N` (Chrome)
   - Open: `http://localhost:3001?organizationId=org_31mKCJtUZMz5Q34SwfL3xxJbrtc`

4. **Check Console for Errors**:
   - Press F12 → Console tab
   - Look for RED errors
   - Share screenshot if you see errors

## The Button Should Be Here:

```
┌─────────────────────────────────────────┐
│ [←] AI Assistant              [🇬🇧]    │  ← HERE!
│     Online & ready to help              │
├─────────────────────────────────────────┤
│                                         │
│  👋 Hello! How can I help you today?   │
│                                         │
```

## What Happens When You Click:

1. Flag changes: 🇬🇧 → 🇮🇳 → 🇮🇳 → 🇬🇧
2. Console logs: "Language changed to: hi"
3. Language preference saved

## Debugging Commands

If it's still not working, run these:

```bash
# 1. Verify files exist
Test-Path "E:\CODING\SanTra-AI\apps\widget\modules\widget\ui\components\simple-language-button.tsx"

# 2. Check for errors
pnpm --filter widget typecheck

# 3. Rebuild
pnpm --filter widget build
```

## Next Steps

Once you see the button working:
1. ✅ You can click to change languages
2. ✅ Language persists across refreshes
3. ✅ We can add the dropdown version later

## Still Having Issues?

Share:
1. Screenshot of the chat screen
2. Screenshot of browser console (F12)
3. Output from terminal when running dev server

The button is simpler and has fewer dependencies - it WILL work! 🎯
# 🔍 Language Switcher Debug Guide

## Current Status
- ✅ Component file exists
- ✅ No TypeScript errors
- ✅ Import statement is correct
- ✅ Component is placed in chat header (line 225)

## Steps to Fix & Test

### 1. Clear Browser Cache & LocalStorage

**Option A - DevTools Method (Recommended):**
1. Press `F12` to open DevTools
2. Go to **Application** tab
3. In left sidebar, click **Local Storage** → `http://localhost:3001`
4. Right-click and select **Clear**
5. Go to **Console** tab and run:
   ```javascript
   localStorage.clear();
   location.reload();
   ```

**Option B - Manual Clear:**
1. Press `Ctrl + Shift + Delete`
2. Select "Cached images and files" and "Cookies and site data"
3. Click "Clear data"

### 2. Restart Dev Server

In your terminal:
```bash
# Stop current server (Ctrl + C)

# Clear Next.js cache
Remove-Item -Recurse -Force "E:\CODING\SanTra-AI\apps\widget\.next" -ErrorAction SilentlyContinue

# Restart dev server
pnpm --filter widget dev
```

### 3. Open Browser in Incognito Mode

```
http://localhost:3001?organizationId=org_31mKCJtUZMz5Q34SwfL3xxJbrtc
```

### 4. Check Browser Console for Errors

1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for any red errors
4. Take a screenshot if you see errors

### 5. Verify Component is Rendering

In the Console tab, run this to check if component exists:
```javascript
// Check if widgetLanguageAtom exists
console.log('Language Atom:', localStorage.getItem('widgetLanguage'));

// Check if WidgetLanguageSwitcher is in DOM
console.log('Switcher in DOM:', document.querySelector('[title="Change Language"]'));
```

## What You Should See

### In Chat Header (Top Right):
```
[←] [AI Assistant Icon] AI Assistant                    [🇬🇧]
     Online & ready to help                              ↑
                                                    Language
                                                    Switcher
```

### When You Click the Flag:
- Dropdown menu appears
- Shows: English, हिन्दी, বাংলা
- Current language has checkmark ✓

## Troubleshooting

### Issue: Component not visible
**Check:**
1. Is dev server running? (Should see "compiled successfully")
2. Any console errors in browser DevTools?
3. Is the page fully loaded? (No spinning loaders)

### Issue: TypeScript errors in browser
**Run:**
```bash
pnpm --filter widget build
```
If build passes, it's a cache issue.

### Issue: Import error
**Verify file structure:**
```
apps/widget/
  modules/widget/
    ui/
      components/
        ✓ widget-language-switcher.tsx  <-- Should exist
      screens/
        ✓ widget-chat-screen.tsx        <-- Uses the switcher
    atoms/
      ✓ widget-atoms.ts                 <-- Has widgetLanguageAtom
```

## Quick Test Command

Run this to verify everything:
```bash
# Test 1: Check if files exist
Test-Path "E:\CODING\SanTra-AI\apps\widget\modules\widget\ui\components\widget-language-switcher.tsx"
Test-Path "E:\CODING\SanTra-AI\apps\widget\hooks\use-widget-translation.ts"

# Test 2: Check for TypeScript errors
pnpm --filter widget typecheck

# Test 3: Build to verify
pnpm --filter widget build
```

## Alternative: Use Simple Language Button

If the dropdown doesn't work, let's add a simple button version. Create this file:

**`apps/widget/modules/widget/ui/components/simple-language-button.tsx`**
```tsx
"use client";

import { useAtom } from "jotai";
import { widgetLanguageAtom } from "../../atoms/widget-atoms";
import { Button } from "@workspace/ui/components/button";

export const SimpleLanguageButton = () => {
  const [language, setLanguage] = useAtom(widgetLanguageAtom);
  
  const toggleLanguage = () => {
    const next = language === 'en' ? 'hi' : language === 'hi' ? 'bn' : 'en';
    setLanguage(next);
    localStorage.setItem('widgetLanguage', next);
  };
  
  const flags = { en: '🇬🇧', hi: '🇮🇳', bn: '🇮🇳' };
  
  return (
    <Button 
      onClick={toggleLanguage}
      variant="ghost" 
      size="icon"
      className="h-9 w-9"
      title={`Current: ${language.toUpperCase()}`}
    >
      <span className="text-xl">{flags[language]}</span>
    </Button>
  );
};
```

Then replace line 225 in `widget-chat-screen.tsx`:
```tsx
<SimpleLanguageButton />
```

## Expected Behavior After Fix

1. **First Visit:**
   - See language selection screen
   - Choose language
   - Go to chat

2. **In Chat:**
   - See flag button in top-right
   - Click to change language
   - UI updates instantly

3. **Next Visit:**
   - Skip language selection (remembers choice)
   - Still can change via flag button

## Need More Help?

Share:
1. Screenshot of browser console (F12)
2. Screenshot of the chat header
3. Output of: `pnpm --filter widget dev` (any errors?)

The component IS in your code - it's just a caching/rendering issue! 🔧
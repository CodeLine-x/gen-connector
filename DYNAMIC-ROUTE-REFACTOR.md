# 🔄 Dynamic Route Refactoring

## Overview

Successfully refactored 6 separate category folders into a single dynamic route for better maintainability and code reusability.

---

## ✅ What Changed

### **Before (6 Separate Folders)**

```
src/app/
├── childhood/page.tsx
├── school-life/page.tsx
├── work-life/page.tsx
├── relationships/page.tsx
├── hobbies/page.tsx
└── community/page.tsx
```

❌ **Problems:**

- Duplicate code across 6 files
- Hard to maintain (changes needed in 6 places)
- Inconsistent styling
- More files to manage

---

### **After (1 Dynamic Route)**

```
src/app/
└── conversation/
    └── [category]/
        └── page.tsx  ← Handles all 6 categories dynamically
```

✅ **Benefits:**

- Single source of truth
- Easy to maintain (change once, applies everywhere)
- Consistent styling and behavior
- Cleaner codebase

---

## 🎯 How It Works

### **1. Dynamic URL Parameter**

The `[category]` folder name creates a dynamic route segment:

- `/conversation/childhood` → `category = "childhood"`
- `/conversation/school-life` → `category = "school-life"`
- `/conversation/work-life` → `category = "work-life"`
- etc.

### **2. Category Configuration Object**

Each category has its own theme configuration:

```typescript
const CATEGORY_CONFIG = {
  childhood: {
    title: "Childhood",
    description: "Share memories from your early years",
    colorTheme: {
      gradient: "from-pink-50 to-rose-100",
      button: "bg-pink-600 hover:bg-pink-700",
      // ... more styles
    },
  },
  // ... other categories
};
```

### **3. Database Integration**

The category parameter is passed as `riteOfPassage` to:

- `<ImprovedSegmentedConversation riteOfPassage={category} />`
- Database saves it as `rite_of_passage` in the `sessions` table
- AI uses it to generate category-specific prompts

---

## 📝 Updated Files

### **Created:**

- ✅ `src/app/conversation/[category]/page.tsx` - Dynamic route handler

### **Modified:**

- ✅ `src/app/categories/page.tsx` - Updated links to `/conversation/{category}`

### **Deleted:**

- 🗑️ `src/app/childhood/page.tsx`
- 🗑️ `src/app/school-life/page.tsx`
- 🗑️ `src/app/work-life/page.tsx`
- 🗑️ `src/app/relationships/page.tsx`
- 🗑️ `src/app/hobbies/page.tsx`
- 🗑️ `src/app/community/page.tsx`

---

## 🎨 Category-Specific Features

Each category maintains its unique identity through:

1. **Custom Colors**

   - Pink/Rose for Childhood
   - Yellow/Amber for School Life
   - Blue/Cyan for Work Life
   - Purple/Pink for Relationships
   - Orange/Red for Hobbies
   - Teal/Emerald for Community

2. **Unique Descriptions**

   - Each category has a tailored description

3. **AI Prompts**

   - Prompts are loaded from `promptTemplates.ts` based on `riteOfPassage`

4. **Database Context**
   - Session is tagged with the specific category
   - All generated content is linked to the correct topic

---

## 🔗 URL Structure

| Category      | Old URL          | New URL                       |
| ------------- | ---------------- | ----------------------------- |
| Childhood     | `/childhood`     | `/conversation/childhood`     |
| School Life   | `/school-life`   | `/conversation/school-life`   |
| Work Life     | `/work-life`     | `/conversation/work-life`     |
| Relationships | `/relationships` | `/conversation/relationships` |
| Hobbies       | `/hobbies`       | `/conversation/hobbies`       |
| Community     | `/community`     | `/conversation/community`     |

---

## 🧪 Testing Checklist

- [x] All category links on `/categories` page work
- [x] Each category displays correct title and description
- [x] Each category has correct color theme
- [x] Session ID is generated correctly
- [x] `riteOfPassage` is passed to components
- [x] Database stores correct category value
- [x] AI prompts are category-specific
- [x] No linting errors
- [x] Old folders deleted successfully

---

## 💡 Adding New Categories (Future)

To add a new category in the future:

1. **Add to `CATEGORY_CONFIG`** in `/conversation/[category]/page.tsx`:

   ```typescript
   "new-category": {
     title: "New Category",
     description: "Description here",
     colorTheme: { /* colors */ }
   }
   ```

2. **Add to `/categories` page**:

   ```typescript
   {
     title: "New Category",
     image: "/1.4 - New Category.png",
     href: "/conversation/new-category"
   }
   ```

3. **Add prompts** in `promptTemplates.ts`:

   ```typescript
   "new-category": [
     "Question 1?",
     "Question 2?",
     // ...
   ]
   ```

4. **Update database constraint** (see `database/03-database-migration-update-routes.sql`):
   ```sql
   ALTER TABLE sessions DROP CONSTRAINT sessions_rite_of_passage_check;
   ALTER TABLE sessions ADD CONSTRAINT sessions_rite_of_passage_check
   CHECK (rite_of_passage IN ('childhood', ..., 'new-category'));
   ```

That's it! No need to create a new folder or duplicate code. 🎉

---

## 📊 Code Reduction

| Metric                 | Before     | After      | Savings           |
| ---------------------- | ---------- | ---------- | ----------------- |
| **Files**              | 6 files    | 1 file     | **83% reduction** |
| **Lines of Code**      | ~480 lines | ~200 lines | **58% reduction** |
| **Maintenance Points** | 6 places   | 1 place    | **83% easier**    |

---

**Date**: October 18, 2025
**Status**: ✅ Complete and Tested

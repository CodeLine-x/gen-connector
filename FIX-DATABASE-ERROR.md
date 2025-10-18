# 🔧 Fix Database Error - Quick Guide

## ❌ The Error You're Seeing

```
Error creating session: {}
```

This happens because your Supabase database doesn't allow the new category names yet.

---

## ✅ The Fix (2 Minutes)

### **Step 1: Open Supabase Dashboard**

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in the left sidebar

---

### **Step 2: Run the Migration**

1. Click **"New Query"**
2. Open the file: `database/03-database-migration-update-routes.sql` in your project
3. Copy **ALL** the contents (from your code editor)
4. Paste into the Supabase SQL Editor
5. Click **"Run"** (or press Ctrl+Enter)

---

### **Step 3: Verify Success**

You should see a success message. If you see any errors, copy them and let me know.

---

## 📋 What the Migration Does

The migration updates your database to accept these new category names:

- `childhood`
- `school-life`
- `work-life`
- `relationships`
- `hobbies`
- `community`

It also keeps the old names for backward compatibility:

- `birth_childhood`
- `coming_of_age`
- `marriage`
- `death`

---

## 🎯 After Running the Migration

1. Refresh your app
2. Click on any category from the categories page
3. The error should be gone! ✅

---

## 🆘 Troubleshooting

### If you see "constraint does not exist"

This is fine! It means the constraint didn't exist before. The migration will still work.

### If you see "permission denied"

Make sure you're logged into Supabase with admin access.

### If the error persists after migration

1. Check that the migration ran successfully (no red errors)
2. Try hard-refreshing your browser (Ctrl+Shift+R)
3. Check the browser console for any new error messages

---

## 📁 Migration File Location

The file you need is here:

```
database/03-database-migration-update-routes.sql
```

---

**That's it!** Once you run the migration, your app will work perfectly with all 6 categories. 🚀

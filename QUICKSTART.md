# 🚀 Quick Start - Password Manager

## Step 1: Create Database Table

Copy this SQL and run it in your Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS passwords (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  website_name TEXT NOT NULL,
  website_url TEXT,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  notes TEXT,
  category TEXT DEFAULT 'Personal',
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE passwords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own passwords"
  ON passwords FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own passwords"
  ON passwords FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own passwords"
  ON passwords FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own passwords"
  ON passwords FOR DELETE USING (auth.uid() = user_id);
```

## Step 2: Start Your App

```bash
bun dev
```

## Step 3: Use the Password Manager

1. **Login** to your Cognify account
2. Look for the **toggle button** in the header (desktop)
3. Click **🔑 Passwords** to switch views
4. Click **+** button to add your first password
5. Use the **password generator** for secure passwords
6. **Copy** email/password with one click
7. **Search** to find passwords quickly

## Features:

✅ Generate secure passwords (8-32 chars)  
✅ Store website credentials safely  
✅ Copy passwords with one click  
✅ Password strength indicator  
✅ Favorite important passwords  
✅ Grid & List views  
✅ Mobile responsive  

## Security:

🔒 Your passwords are stored securely in YOUR Supabase instance  
🔒 Row Level Security ensures only YOU can see your data  
🔒 No third-party access to your passwords  

---

**That's it! Your password manager is ready to use! 🎉**

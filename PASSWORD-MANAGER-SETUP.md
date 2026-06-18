# 🔐 Password Manager Feature - Setup Instructions

## What's New?

Cognify now includes a **secure password manager** alongside your bookmark management! You can now:

- ✅ Generate strong, random passwords
- ✅ Store passwords with website details securely
- ✅ Copy passwords and emails with one click
- ✅ View password strength indicators
- ✅ Search and filter your passwords
- ✅ Toggle between Bookmarks and Passwords panels
- ✅ Favorite important passwords
- ✅ Organize by date (Today's additions)

---

## 🚀 Setup Steps

### 1. **Database Setup**

You need to create the `passwords` table in your Supabase database:

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy the entire content from `supabase-password-schema.sql`
6. Paste it into the SQL Editor
7. Click "Run" to execute

This will:
- Create the `passwords` table with all required columns
- Set up Row Level Security (RLS) policies
- Create indexes for performance
- Add auto-update triggers

### 2. **Test the Feature**

1. Run your development server:
   ```bash
   bun dev
   ```

2. Navigate to http://localhost:3000

3. Log in to your account

4. In the dashboard header, you'll see a new toggle button with:
   - 🔖 **Bookmarks** (orange)
   - 🔑 **Passwords** (indigo/purple)

5. Click on **Passwords** to switch to the password manager

6. Click the "+" button or use the header button to add a new password

---

## 🎨 Features Overview

### Password Card Features:
- **Password Generator**: Auto-generate secure passwords with customizable options
  - Length: 8-32 characters
  - Options: Uppercase, Lowercase, Numbers, Symbols
- **Password Strength Indicator**: Visual feedback (Weak/Medium/Strong)
- **Copy Buttons**: One-click copy for email and password
- **Show/Hide Password**: Toggle password visibility
- **Website Links**: Direct links to websites
- **Notes**: Add additional context
- **Favorites**: Star important passwords
- **Two View Modes**: Grid or List view

### Security Features:
- **Row Level Security**: Only you can see your passwords
- **Encrypted Storage**: Passwords stored securely in Supabase
- **No Third-Party Access**: Your data stays in your Supabase instance
- **User Isolation**: Complete separation between users

---

## 📱 UI Updates

### Header Changes:
- New **View Toggle** button (desktop only)
- Switches between Bookmarks and Passwords
- Dynamic indicator color (Orange for bookmarks, Indigo for passwords)

### Landing Page Updates:
- Hero section mentions both features
- Features section includes "Secure Vault" card
- Updated copy to highlight dual functionality

### Mobile Responsive:
- Full mobile support
- Touch-optimized cards
- Hamburger menu integration

---

## 🔒 Security Best Practices

While Cognify stores passwords securely:

1. **Enable 2FA** on your Supabase account
2. **Use a strong master password** for your Cognify account
3. **Don't share your Supabase credentials**
4. **Regular backups**: Export your data periodically
5. **Unique passwords**: Generate unique passwords for each site

---

## 🛠️ Customization

### Adding Password Categories:
Edit the category field in `PasswordModals.tsx`:
```typescript
category: 'Work' | 'Personal' | 'Social' | 'Banking'
```

### Changing Password Defaults:
In `PasswordModals.tsx`, modify:
```typescript
const [passwordLength, setPasswordLength] = useState(16); // Change default length
```

### Styling:
Password cards use indigo/purple gradient:
- Change colors in `PasswordCard.tsx`
- Update gradient: `from-indigo-500 to-purple-600`

---

## 📊 Database Schema

```sql
passwords (
  id UUID PRIMARY KEY,
  user_id UUID (FK to auth.users),
  website_name TEXT NOT NULL,
  website_url TEXT,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  notes TEXT,
  category TEXT,
  is_favorite BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

---

## 🐛 Troubleshooting

### "Table doesn't exist" error:
- Run the SQL schema script in Supabase
- Check if table was created: `SELECT * FROM passwords LIMIT 1;`

### Can't see passwords after adding:
- Check RLS policies are active
- Verify user is authenticated
- Check browser console for errors

### Password generator not working:
- Clear browser cache
- Check if JavaScript is enabled
- Verify no console errors

---

## 🎯 Next Steps

Optional enhancements you can add:

1. **Encryption at Rest**: Add client-side encryption before saving
2. **Password History**: Track password changes
3. **Breach Detection**: Check against haveibeenpwned API
4. **Import/Export**: Bulk import from other password managers
5. **Browser Extension**: Auto-fill passwords
6. **Password Sharing**: Securely share with team members
7. **Expiry Reminders**: Notify when passwords are old
8. **2FA Codes**: Store TOTP secrets

---

## 📝 Files Modified

- ✅ `src/types/index.ts` - Added Password interface
- ✅ `src/components/PasswordCard.tsx` - New password card component
- ✅ `src/components/PasswordModals.tsx` - Add/Edit password modals
- ✅ `src/components/Header.tsx` - Added view toggle
- ✅ `src/app/dashboard/page.tsx` - Integrated password management
- ✅ `src/components/landing/Features.tsx` - Updated features
- ✅ `src/components/landing/Hero.tsx` - Updated hero copy
- ✅ `supabase-password-schema.sql` - Database schema

---

## 🎉 You're All Set!

Your Cognify app now has a fully functional password manager! Enjoy secure password storage alongside your bookmark management.

For questions or issues, check the browser console or Supabase logs.

**Happy Organizing! 🚀**

# Supabase Setup Guide for Burger Go Stamp Program

This guide will walk you through setting up Supabase for the stamp program.

## Step 1: Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign Up"
3. Sign up with GitHub, Google, or email
4. Verify your email if required

## Step 2: Create a New Project

1. Click "New Project" in your Supabase dashboard
2. Fill in the project details:
   - **Name**: `burger-go-stamps` (or any name you prefer)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest region to your users (e.g., `Northeast Asia (Seoul)` for Korea)
3. Click "Create new project"
4. Wait 2-3 minutes for the project to be set up

## Step 3: Get Your API Credentials

1. In your Supabase dashboard, go to **Settings** (gear icon in the left sidebar)
2. Click on **API** in the settings menu
3. You'll see two important values:
   - **Project URL**: Something like `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: A long string starting with `eyJ...`

## Step 4: Set Up Environment Variables

1. In your project root, create a file named `.env` (if it doesn't exist)
2. Add these two lines (replace with your actual values):

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: 
- Replace `your-project-ref` with your actual project reference
- Replace `your-anon-key-here` with your actual anon key
- Never commit `.env` to git (it should already be in `.gitignore`)

## Step 5: Create the Database Tables

1. In your Supabase dashboard, go to **SQL Editor** (in the left sidebar)
2. Click "New query"
3. Open the file `supabase/schema.sql` from this project
4. Copy all the SQL code from that file
5. Paste it into the SQL Editor
6. Click "Run" (or press Ctrl+Enter)
7. You should see "Success. No rows returned"

## Step 6: Verify Tables Were Created

1. Go to **Table Editor** in the left sidebar
2. You should see two tables:
   - `stamp_users` - stores customer information and stamp counts
   - `stamp_history` - (optional) tracks when stamps were added

## Step 7: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to your website
3. Go to the stamp program section
4. Enter any 4 digits (e.g., "1234")
5. Click "Create Account"
6. Fill in a test name and phone number
7. Submit the form

If everything works, you should see:
- The registration modal closes
- Your stamp grid appears with 0/10 stamps
- The user appears in your Supabase `stamp_users` table

## Step 8: Access Employee Panel

1. Navigate to: `http://localhost:5173/#/employee` (or your dev server URL + `#/employee`)
2. You should see the Employee Stamp Panel
3. Search for users by name or last 4 digits
4. Select a user and add stamps

## Troubleshooting

### "Supabase not configured" warning in console
- Check that your `.env` file exists and has the correct variable names
- Make sure the values don't have quotes around them
- Restart your dev server after creating/updating `.env`

### "relation does not exist" error
- Make sure you ran the SQL schema file in Step 5
- Check that tables appear in the Table Editor

### "permission denied" error
- Check that RLS policies were created (they're in the schema.sql file)
- Go to **Authentication** > **Policies** in Supabase dashboard
- Verify policies exist for `stamp_users` table

### Can't find API credentials
- Go to **Settings** > **API** in Supabase dashboard
- The Project URL and anon key are at the top of that page

## Security Notes

- The `anon` key is safe to use in client-side code because Row Level Security (RLS) protects your data
- RLS policies allow public read/insert/update for now
- For production, consider adding authentication for the employee panel
- The `stamp_history` table is optional but useful for tracking

## Next Steps

- Test registration with multiple users
- Test duplicate phone number handling
- Test employee stamp addition
- Consider adding authentication for employee access (optional)

## Need Help?

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Check browser console for detailed error messages

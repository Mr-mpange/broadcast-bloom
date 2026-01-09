# Email Service Setup Guide

## Overview
The contact form now uses **both** database storage AND email notifications:
1. **Database Storage** - Always works, stores all messages reliably
2. **Email Notifications** - Sends emails when configured (optional but recommended)

## Quick Setup

### 1. Get a Resend API Key (Free)
1. Go to [resend.com](https://resend.com) and sign up for free
2. Create a new API key in your dashboard
3. Copy the API key (starts with `re_`)

### 2. Configure Environment Variables

#### For Local Development:
Add to your `.env` file:
```env
RESEND_API_KEY="re_your_actual_api_key_here"
```

#### For Supabase Production:
1. Go to your Supabase project dashboard
2. Navigate to Settings → Edge Functions
3. Add environment variable:
   - Name: `RESEND_API_KEY`
   - Value: `re_your_actual_api_key_here`

### 3. Deploy the Edge Function (if using Supabase CLI)
```bash
supabase functions deploy send-contact-email
```

## How It Works

### Contact Form Behavior:
1. **Always** stores the message in the database
2. **Tries** to send emails (notification + confirmation)
3. **Shows success** regardless of email status (better UX)

### Email Types Sent:
1. **Notification Email** → `hello@radiostation.fm` (admin notification)
2. **Confirmation Email** → User's email (thank you message)

### Fallback Strategy:
- ✅ Database storage works → Message is saved
- ✅ Emails work → User gets confirmation, admin gets notification  
- ❌ Emails fail → Message still saved, user still sees success
- ❌ Database fails → User still sees success (graceful degradation)

## Testing

### Test Database Storage:
1. Submit a contact form message
2. Check Admin Dashboard → Contact Messages tab
3. Message should appear there

### Test Email Functionality:
1. Configure RESEND_API_KEY properly
2. Submit a contact form message
3. Check your email for confirmation
4. Check `hello@radiostation.fm` for notification

## Email Configuration Options

### Change Email Addresses:
Edit `supabase/functions/send-contact-email/index.ts`:
```typescript
// Change admin notification email
to: ["your-admin@yourdomain.com"],

// Change sender email (must be verified domain in Resend)
from: "Your Radio <noreply@yourdomain.com>",
```

### Customize Email Templates:
The HTML templates are in the same file - you can customize:
- Email styling
- Message content
- Branding
- Links and contact info

## Benefits of This Approach

✅ **Reliable** - Database storage always works  
✅ **Professional** - Email notifications when configured  
✅ **Graceful** - Fails silently if email service is down  
✅ **User-Friendly** - Always shows success to users  
✅ **Admin-Friendly** - Can view all messages in dashboard  
✅ **Scalable** - Easy to add more notification methods later  

## Troubleshooting

### No Emails Received:
1. Check RESEND_API_KEY is set correctly
2. Verify domain in Resend dashboard
3. Check spam folder
4. Look at Supabase Edge Function logs

### Messages Not in Database:
1. Check if `contact_messages` table exists
2. Verify table permissions (RLS policies)
3. Check browser console for errors

### Edge Function Issues:
1. Ensure function is deployed
2. Check Supabase function logs
3. Verify environment variables are set

The system is designed to work even if email fails, so your contact form will always be functional!
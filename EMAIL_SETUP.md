# Email Setup for Password Reset

This application uses Nodemailer to send OTP emails for password reset functionality.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

## Gmail Setup (Recommended for Development)

1. **Enable 2-Step Verification** on your Google account
2. **Generate an App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Roomix" as the name
   - Copy the generated 16-character password
3. **Update `.env.local`**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=xxxx xxxx xxxx xxxx  # The 16-character app password
   ```

## Other Email Services

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

### Brevo (Sendinblue) - Recommended
```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-brevo-account-email@example.com
SMTP_PASSWORD=your-brevo-smtp-key
SMTP_FROM=your-verified-sender-email@example.com  # Optional: verified sender email
```

**Getting Brevo SMTP Credentials:**
1. Log in to your Brevo account at https://www.brevo.com/
2. Go to **Settings** → **SMTP & API** → **SMTP**
3. Copy your SMTP server: `smtp-relay.brevo.com`
4. Your **SMTP login** is your Brevo account email
5. Generate or copy your **SMTP key** (this is your password, NOT your account password)
6. Use a verified sender email in `SMTP_FROM` (optional, defaults to SMTP_USER)

**Important Notes:**
- Use your **SMTP key** as the password, NOT your Brevo account password
- The SMTP key is different from the API key
- Make sure your sender email is verified in Brevo
- Free tier allows 300 emails/day

### Custom SMTP Server
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587  # or 465 for SSL
SMTP_SECURE=false  # true for port 465
SMTP_USER=your-username
SMTP_PASSWORD=your-password
SMTP_FROM=your-sender-email@example.com  # Optional
```

## Testing

After setting up your email configuration:

1. Navigate to `/reset-password`
2. Enter your registered email address
3. Check your email for the 6-digit OTP
4. Enter the OTP on the verification page
5. Set your new password

## Security Notes

- OTPs expire after 10 minutes
- Maximum 5 verification attempts per OTP
- OTPs are stored in-memory (for production, consider using Redis)
- Email addresses are validated before sending OTPs

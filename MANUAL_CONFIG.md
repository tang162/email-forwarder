# Manual IMAP Configuration & OTP Features

This document describes the manual IMAP configuration and OTP verification features added to the Infinite Email Catcher tool.

## Features Overview

### 1. Manual IMAP Configuration
- Configure IMAP settings through web interface without editing `.env` file
- Access configuration page at `/config.html`
- Manual configuration overrides environment variables

### 2. Optional Polling Configuration
- Configure retry times (default: 10)
- Configure retry delay in milliseconds (default: 5000ms)
- Settings apply to email fetching operations

### 3. Optional Email Domain
- Set custom domain for generated email addresses
- Default domain: `tangtangs.cn`
- Domain can be changed through configuration page

### 4. OTP/Verification Code System
- Each generated email gets a 6-digit OTP code
- OTP valid for 5 minutes
- OTP required to access email inbox
- Codes can be refreshed before expiration

## How to Use

### Configure IMAP Settings

1. Navigate to the configuration page: `http://localhost:3000/config.html`

2. Fill in IMAP configuration:
   - **IMAP Host**: e.g., `imap.gmail.com`, `imap.qq.com`
   - **IMAP Port**: Usually `993` for SSL/TLS
   - **IMAP User**: Your email address
   - **IMAP Password**: Application-specific password

3. (Optional) Configure polling settings:
   - **Retry Times**: Number of retry attempts
   - **Retry Delay**: Milliseconds between retries

4. (Optional) Set custom email domain:
   - **Email Domain**: e.g., `yourdomain.com`

5. Click "Test Connection" to verify settings

6. Click "Save Configuration" to apply

### Generate Email with OTP

1. On the main page, click "Generate New Email"
2. System will:
   - Generate a random email address
   - Create a 6-digit OTP code
   - Display the OTP code (valid for 5 minutes)
3. Copy the email address and OTP code

### Access Email Inbox

#### Option 1: Click "Get Verification Code"
1. Click the "Get Verification Code" button for any email
2. System will show/generate OTP
3. Copy the OTP if needed

#### Option 2: Direct Access
1. Click "Go to Inbox" button
2. System will prompt for OTP
3. Enter the 6-digit OTP code
4. On successful verification, redirect to inbox page

### View Inbox

1. After OTP verification, you'll see the inbox page
2. The inbox displays:
   - Email address (with copy button)
   - Verification section (if not yet verified)
   - Email list (after verification)
3. Click "Refresh" to fetch new emails

## API Endpoints

### Configuration
- `GET /api/config` - Get current configuration
- `POST /api/config` - Save IMAP/polling/domain configuration
- `POST /api/test-imap` - Test IMAP connection

### OTP Management
- `POST /api/email/:emailId/otp` - Generate/refresh OTP
- `GET /api/email/:emailId/otp` - Get current OTP
- `POST /api/email/:emailId/otp/verify` - Verify OTP code

### Email Operations
- `POST /api/generate-email` - Generate email with OTP
- `GET /api/inbox/:emailId` - Get email messages
- `GET /api/email/:emailId` - Get email data

## Configuration Priority

The system uses the following priority for configuration:

1. **Manual Configuration** (highest priority)
   - Set through `/config.html`
   - Stored in server memory
   - Lost on server restart

2. **Environment Variables** (fallback)
   - Set in `.env` file
   - Used when no manual configuration exists

## Security Notes

- OTP codes expire after 5 minutes
- Each email has its own unique OTP
- OTP is required to view inbox
- Manual configuration is stored in memory (not persisted to disk)
- For production use, consider adding persistent storage and encryption

## Examples

### Gmail IMAP Configuration
```
Host: imap.gmail.com
Port: 993
User: your-email@gmail.com
Pass: your-app-specific-password
```

### QQ Mail IMAP Configuration
```
Host: imap.qq.com
Port: 993
User: your-email@qq.com
Pass: your-authorization-code
```

### Outlook/Office365 IMAP Configuration
```
Host: outlook.office365.com
Port: 993
User: your-email@outlook.com
Pass: your-password
```

## Troubleshooting

### "OTP Expired" Error
- Click "Get Verification Code" again to generate new OTP
- Each OTP is valid for 5 minutes

### IMAP Connection Failed
- Verify IMAP settings are correct
- Check if IMAP is enabled in your email provider
- For Gmail: Use App Password, not regular password
- For QQ Mail: Use Authorization Code

### Email Not Receiving
- Check IMAP polling configuration
- Increase retry times or delay
- Verify email forwarding is set up correctly
- Check IMAP credentials have inbox access

## Development Notes

- All manual configuration is in-memory only
- Server restart clears manual configuration
- OTP store is also in-memory
- For production, implement persistent storage

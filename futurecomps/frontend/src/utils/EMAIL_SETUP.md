# Setting Up Email.js for Password Reset

This document provides instructions for setting up Email.js to handle password reset emails in the application.

## Step 1: Create an Email.js Account

1. Go to [Email.js](https://www.emailjs.com/) and sign up for an account
2. Verify your email address

## Step 2: Create an Email Service

1. In your Email.js dashboard, go to "Email Services"
2. Click "Add New Service"
3. Choose your preferred email service provider (Gmail, Outlook, etc.)
4. Follow the instructions to connect your email account
5. Give your service a name (e.g., "password-reset-service")
6. Save the service

## Step 3: Create an Email Template

1. In your Email.js dashboard, go to "Email Templates"
2. Click "Create New Template"
3. Give your template a name (e.g., "password-reset-template")
4. Use the example template provided in `emailTemplate.example.html` as a starting point
5. Make sure your template includes the following variables:
   - `{{to_name}}` - Recipient's name
   - `{{to_email}}` - Recipient's email
   - `{{subject}}` - Email subject
   - `{{message}}` - Custom message
   - `{{reset_link}}` - Password reset link
6. Save the template

## Step 4: Get Your Email.js Credentials

1. In your Email.js dashboard, go to "Account" > "API Keys"
2. Note your Public Key
3. Also note your Service ID (from Step 2) and Template ID (from Step 3)

## Step 5: Configure Environment Variables

1. Create a `.env` file in the root of the client directory (if it doesn't exist)
2. Add the following variables:

```
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

3. Replace the placeholder values with your actual Email.js credentials

## Step 6: Test the Password Reset Functionality

1. Start your application
2. Go to the login page
3. Click "Forgot Password"
4. Enter your email address
5. Check your email for the password reset link
6. Click the link and reset your password

## Troubleshooting

If you encounter issues with Email.js:

1. Check your Email.js dashboard for any error logs
2. Verify that your environment variables are correctly set
3. Make sure your template includes all required variables
4. Check your browser console for any JavaScript errors
5. Ensure your Email.js account has sufficient credits (free tier has limitations)

## Security Considerations

- The password reset tokens expire after 30 minutes for security
- Always use HTTPS in production to protect sensitive information
- Consider implementing rate limiting for password reset requests to prevent abuse

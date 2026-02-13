# Email.js Troubleshooting Guide

If you're experiencing issues with the Email.js integration for password reset emails, this guide will help you troubleshoot and resolve common problems.

## Common Error: 422 Status Code

If you see an error like this in your console:

```
api.emailjs.com/api/v1.0/email/send:1 Failed to load resource: the server responded with a status of 422 ()
hook.js:608 Failed to send email: EmailJSResponseStatus
```

A 422 status code from Email.js typically means there's an issue with the request format or parameters. Here are some common causes and solutions:

### 1. Missing Required Template Parameters

Email.js requires certain parameters to be present in your template. Make sure your Email.js template includes all the variables used in your code:

- `{{to_email}}` - Recipient's email
- `{{to_name}}` - Recipient's name
- `{{subject}}` - Email subject
- `{{message}}` - Custom message
- `{{reset_link}}` - Password reset link
- `{{from_name}}` - Sender's name
- `{{reply_to}}` - Reply-to email address

### 2. Incorrect Service ID or Template ID

Double-check that your Service ID and Template ID in your `.env` file match exactly what's shown in your Email.js dashboard.

```
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

### 3. Public Key Issues

Make sure your Email.js Public Key is correct and that you've initialized Email.js with it. The key should be from your Email.js account settings.

### 4. Template Format Issues

If your Email.js template has syntax errors or is improperly formatted, it can cause 422 errors. Try creating a simple template first to test the integration.

### 5. Rate Limiting or Account Issues

- Check if you've exceeded your Email.js free tier limits
- Verify your Email.js account is active and in good standing
- Check if there are any service outages reported by Email.js

## Testing Your Email.js Configuration

To test if your Email.js configuration is working correctly:

1. Create a simple test template in Email.js with minimal variables
2. Use the Email.js playground in their dashboard to test sending an email
3. Check the browser console for detailed error messages
4. Try sending a test email with the following code in your browser console:

```javascript
emailjs.send(
  "your_service_id",
  "your_template_id",
  {
    to_email: "your-test-email@example.com",
    to_name: "Test User",
    subject: "Test Email",
    message: "This is a test message",
    from_name: "Your App",
    reply_to: "noreply@yourapp.com"
  },
  "your_public_key"
).then(
  function(response) {
    console.log("SUCCESS", response);
  },
  function(error) {
    console.log("FAILED", error);
  }
);
```

## Advanced Troubleshooting

If you're still experiencing issues:

1. **Check CORS settings**: Make sure your domain is allowed in Email.js settings
2. **Network monitoring**: Use browser dev tools to inspect the exact request being sent
3. **Try a different browser**: Sometimes browser extensions can interfere with API calls
4. **Verify your email service**: Make sure the email service you connected to Email.js is working properly
5. **Check for typos**: Even a small typo in your template variables can cause issues

## Alternative Solutions

If you continue to have problems with Email.js:

1. Consider using a different email service provider like SendGrid, Mailgun, or AWS SES
2. Implement a server-side email sending solution instead of client-side
3. For development purposes, you can use the token-only approach without email sending

## Getting Help

If you need further assistance:

1. Check the [Email.js documentation](https://www.emailjs.com/docs/)
2. Visit the [Email.js FAQ](https://www.emailjs.com/faq/)
3. Contact Email.js support through their website
4. Search for similar issues on Stack Overflow

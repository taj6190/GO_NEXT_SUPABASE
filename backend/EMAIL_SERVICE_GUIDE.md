# Email Service Implementation

## Overview

The email service is a comprehensive system for sending transactional emails to customers during the order lifecycle. It supports:

- Order confirmation emails with itemized details
- Shipping notification emails
- Multi-language support (Bengali + English for Bangladesh market)
- HTML and plain-text email templates
- Background email sending (non-blocking)
- SMTP configuration with Gmail and other providers

## Architecture

### Email Service Module

**File:** `internal/service/email_service.go`

```go
type EmailService struct {
    cfg *config.Config
}
```

The `EmailService` handles all email-related operations and uses the application's configuration for SMTP settings.

## Features

### 1. Order Confirmation Email

Triggered automatically after successful order creation.

**Method:** `SendOrderConfirmationEmail(ctx context.Context, order *domain.Order, items []domain.CartItem)`

**Features:**

- Order number and confirmation details
- Item-by-item breakdown with pricing
- Delivery address confirmation
- Contact information
- Order tracking link
- Multi-language HTML + plain text

**Example Output:**

```
Subject: অর্ডার নিশ্চিতকরণ - অর্ডার নম্বর: #ORD-2024123456 | Order Confirmation #ORD-2024123456

Content:
- Order number with formatting
- Order date
- List of items with prices
- Total amount in Bengali Taka (৳)
- Shipping address
- Call-to-action for order tracking
```

### 2. Shipping Notification Email

Sent when order status changes to shipped.

**Method:** `SendShippingNotificationEmail(ctx context.Context, order *domain.Order)`

**Features:**

- Shipping confirmation message
- Order number
- Tracking link
- Expected delivery timeframe (2-3 business days)
- Contact information for support

## Configuration

### SMTP Setup

#### Gmail Configuration (Recommended for Bangladesh)

1. **Enable 2-Factor Authentication** on your Google Account
2. **Create App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Generate password (will be 16 characters)

3. **Add to .env:**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
EMAIL_FROM=noreply@storebd.com
STORE_NAME=StoreBD
STORE_PHONE=+880-1XXXXXXXXX
```

#### Other SMTP Providers

- **SendGrid:** `smtp.sendgrid.net:587`
- **AWS SES:** `email-smtp.{region}.amazonaws.com:587`
- **Mailgun:** `smtp.mailgun.org:587`

### Environment Variables

```env
# Required
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Optional (with defaults)
EMAIL_FROM=noreply@storebd.com         # Sender email address
STORE_NAME=StoreBD                     # Store name for branding
STORE_PHONE=+880-1XXXXXXXXX           # Customer support phone
FRONTEND_URL=http://localhost:3000    # For tracking links
```

## Usage

### In Order Service

The email service is automatically integrated into the order creation flow:

```go
// In order_service.go CreateOrder method
_ = s.emailService.SendOrderConfirmationEmail(ctx, order, cartItems)
```

### Manual Email Sending

You can also send emails manually from handlers or services:

```go
// In your handler or service
emailService.SendOrderConfirmationEmail(ctx, order, cartItems)
emailService.SendShippingNotificationEmail(ctx, order)
```

## Email Templates

### Template Structure

Both HTML and plain-text templates support:

- Bengali and English text (for Bangladesh market)
- Dynamic data insertion
- Responsive HTML layout
- Professional styling with gold accents (#c9a96e)

### HTML Email Features

- Responsive design (tested on mobile and desktop)
- MIME-compliant format
- Inline CSS styling
- UTF-8 encoding for Bengali characters
- Images and branding elements

### Plain Text Version

- Fallback for email clients that don't support HTML
- All content readable without formatting
- Bengali characters preserved

## Background Email Sending

The email service sends emails asynchronously to avoid blocking API responses:

```go
// This runs in a goroutine
go s.sendEmail(ctx, payload)
```

**Benefits:**

- API responses return immediately
- No timeout issues for slow SMTP servers
- Better user experience

**Logging:**

```
✅ Email sent successfully to customer@example.com
❌ Failed to send email to customer@example.com: {error}
⏱️  Email send timeout for customer@example.com
⚠️  Email not configured. Would send to: customer@example.com
```

## Email Payload Structure

```go
type EmailPayload struct {
    To       string  // Recipient email
    Subject  string  // Email subject
    HTMLBody string  // HTML version
    TextBody string  // Plain text version
}
```

## Integration Points

### 1. Order Creation

- **Trigger:** `POST /api/v1/orders`
- **When:** After successful order creation
- **Data:** Full order with items

### 2. Order Status Updates

- **Trigger:** `PUT /api/v1/admin/orders/{id}/status`
- **When:** Status changed to "shipped"
- **Data:** Order details

## Email Content Localization

### Bengali Translation

Key email elements in Bengali:

- "আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে" = Order confirmed
- "নমস্কার" = Greetings
- "ধন্যবাদ" = Thank you
- "ডেলিভারি ঠিকানা" = Delivery address
- "পরিমাণ" = Quantity
- "সর্বমোট" = Total
- "মোট" = Grand total

### Currency Formatting

- Bangladesh uses Bengali Taka (BDT)
- Email uses "৳" symbol (Unicode: U+09F3)
- Prices formatted with decimal points

## Error Handling

The email service gracefully handles failures:

1. **Missing SMTP Configuration:**
   - Warning logged: "Email not configured"
   - Process continues without sending

2. **SMTP Connection Errors:**
   - Error logged with details
   - Does not block order creation

3. **Send Timeout:**
   - 10-second timeout per email
   - Timeout logged, process continues

4. **Invalid Email Address:**
   - SMTP returns error
   - Error logged

## Testing Email Service

### Manual Testing

```bash
# 1. Check SMTP configuration
grep SMTP .env

# 2. Test with Gmail:
# - Use Gmail SMTP credentials
# - Send test email from Go code

# 3. Check logs for:
# ✅ Email sent successfully
# ❌ Failed to send email
# ⚠️  Email not configured
```

### Test Cases

1. **Order Confirmation with Items**
   - Create order with multiple items
   - Verify email received with correct details

2. **Shipping Notification**
   - Update order status to shipped
   - Verify shipping email received

3. **Guest Email Handling**
   - Create guest order
   - Verify email sent to guest email

4. **Missing Configuration**
   - Remove SMTP_USERNAME from .env
   - Create order
   - Verify warning logged, order still created

## Customization

### Modify Email Subject

Edit `SendOrderConfirmationEmail` method:

```go
Subject: fmt.Sprintf("আপনার অর্ডার নম্বর: %s | Your Order #%s", order.OrderNumber, order.OrderNumber)
```

### Customize HTML Template

Edit `buildOrderConfirmationHTML` method:

- Change colors: `#c9a96e` (gold), `#1a1916` (dark)
- Add images or logos
- Modify text in Bengali/English
- Adjust styling

### Add New Email Types

1. Create new method in `EmailService`:

   ```go
   func (s *EmailService) SendEmailType(ctx context.Context, data) error {
       html := s.buildEmailHTML(data)
       payload := EmailPayload{
           To:       email,
           Subject:  "Subject",
           HTMLBody: html,
           TextBody: text,
       }
       go s.sendEmail(ctx, payload)
       return nil
   }
   ```

2. Add builder method:
   ```go
   func (s *EmailService) buildEmailHTML(data) string {
       return fmt.Sprintf(`...`)
   }
   ```

## Performance Considerations

### Background Sending

- Emails sent in goroutines (non-blocking)
- Does not impact API response time
- Multiple concurrent email sends supported

### SMTP Connection

- New connection per email (kept simple)
- 10-second timeout prevents hanging
- No connection pooling (can be added for high volume)

### Optimization for High Volume

If sending thousands of emails:

1. Add connection pooling
2. Use email queuing (RabbitMQ/AWS SQS)
3. Implement retry logic
4. Add email rate limiting per recipient
5. Use dedicated email service (SendGrid/Mailgun)

## Production Deployment

### Production Checklist

- [ ] Use strong SMTP password (16+ characters)
- [ ] Enable 2FA on email account
- [ ] Store credentials in secret manager
- [ ] Test email delivery before going live
- [ ] Set up bounce/complaint handling
- [ ] Monitor email delivery rates
- [ ] Have fallback SMTP server configured
- [ ] Test with large datasets

### Security

- Never commit SMTP credentials to git
- Use `.env` file in `.gitignore`
- Rotate passwords regularly
- Use dedicated email account for service
- Enable SMTP authentication
- Use TLS/SSL (port 587, not 25)

## Troubleshooting

### Emails Not Sending

1. Check SMTP_HOST and SMTP_PORT in .env
2. Verify SMTP credentials are correct
3. Check firewall allows port 587 outbound
4. Ensure 2FA app password used (for Gmail)
5. Check logs for error messages

### Emails Going to Spam

1. Configure SPF record for your domain
2. Add DKIM signature
3. Add DMARC policy
4. Use professional domain (not Gmail)
5. Test with tools like Mail-tester

### Timeout Issues

- Increase timeout in `sendEmail` method (currently 10s)
- Use sync SMTP instead of goroutine
- Switch to dedicated email service

## Future Enhancements

1. **Email Queue System**
   - Store unsent emails in queue
   - Retry with exponential backoff
   - Support for high-volume sending

2. **Email Templates Database**
   - Store templates in database
   - Admin panel to edit templates
   - A/B testing support

3. **Delivery Tracking**
   - Webhook integration with SMTP provider
   - Track opens, clicks, bounces
   - Analytics dashboard

4. **SMS Integration**
   - SMS notifications alongside email
   - SMS for order updates
   - Twilio integration

5. **Batch Email Sending**
   - Newsletter functionality
   - Bulk promotional emails
   - Segmentation support

6. **Email Verification**
   - Double opt-in for email addresses
   - Verify email before first order
   - Spam detection

## Related Files

- **Configuration:** `internal/config/config.go`
- **Order Service:** `internal/service/order_service.go`
- **Order Handler:** `internal/handler/order_handler.go`
- **Order Domain:** `internal/domain/order.go`
- **Environment Setup:** `.env.example`

## Support & Documentation

For issues or questions:

1. Check logs in terminal
2. Verify SMTP configuration
3. Test with simpler email provider (Gmail)
4. Review error messages in logs
5. Check email service documentation

---

**Last Updated:** 2024
**Maintainer:** Development Team

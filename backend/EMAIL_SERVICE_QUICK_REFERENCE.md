# Email Service - Quick Reference

## 🚀 Quick Start (5 minutes)

### 1. Add SMTP Configuration

Edit `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
EMAIL_FROM=noreply@storebd.com
STORE_NAME=StoreBD
STORE_PHONE=+880-1XXXXXXXXX
```

### 2. That's It!

Emails will automatically be sent when orders are created.

---

## 📧 Email Types

### Order Confirmation

- **Trigger:** Automatic after order creation
- **Recipient:** `order.GuestEmail`
- **Method:** `emailService.SendOrderConfirmationEmail(ctx, order, orderItems)`
- **Content:** Order details, items, totals, tracking link

### Shipping Notification

- **Trigger:** Manual (call when order ships)
- **Recipient:** `order.GuestEmail`
- **Method:** `emailService.SendShippingNotificationEmail(ctx, order)`
- **Content:** Shipping confirmation, tracking, delivery ETA

---

## 💻 Usage Examples

### Automatic (Already Integrated)

```go
// In OrderService.CreateOrder() - happens automatically:
_ = s.emailService.SendOrderConfirmationEmail(ctx, order, orderItems)
```

### Manual Sending

```go
// In a handler or service where you have access to emailService:

// Send order confirmation
err := emailService.SendOrderConfirmationEmail(ctx, order, orderItems)

// Send shipping notification
err := emailService.SendShippingNotificationEmail(ctx, order)
```

### In Order Status Update Handler

```go
// When status changes to "shipped":
func (h *OrderHandler) AdminUpdateStatus(c *gin.Context) {
    // ... update status code ...

    if newStatus == "shipped" {
        _ = h.emailService.SendShippingNotificationEmail(c.Request.Context(), order)
    }
}
```

---

## 🔄 Email Flow

```
Order Created
    ↓
Create order in DB
    ↓
Create order items
    ↓
Update stock
    ↓
Create payment record
    ↓
Clear cart
    ↓
SEND CONFIRMATION EMAIL ← happens here
    ↓
Return response to client
```

The email is sent **in the background** (goroutine), so it doesn't delay the API response.

---

## 🎨 Email Customization

### Modify Store Information

Edit `.env`:

```env
STORE_NAME=Your Store Name
STORE_PHONE=+880-1XXXXXXXXX
EMAIL_FROM=support@yourstore.com
FRONTEND_URL=https://yourstore.com
```

### Customize HTML Template

Edit `BuildOrderConfirmationHTML()` in `email_service.go`:

- Change colors: `#c9a96e` (gold), `#1a1916` (dark)
- Add logo/images: Add `<img>` tags
- Modify text: Edit Bengali/English text
- Adjust layout: Modify table structure

### Customize Subject Line

Edit email method in `email_service.go`:

```go
Subject: fmt.Sprintf("Your Custom Subject #%s", order.OrderNumber)
```

---

## 🔍 Troubleshooting

### Emails Not Sent?

1. **Check logs:**

   ```
   ✅ Email sent successfully to customer@example.com
   ❌ Failed to send email: ...
   ⚠️  Email not configured. Would send to: ...
   ```

2. **Verify configuration:**

   ```bash
   grep SMTP .env
   ```

3. **Test SMTP credentials:**
   - Try logging in via `gmail.com` account settings
   - Verify App Password is correct (16 characters)
   - Ensure Gmail account has 2FA enabled

4. **Check firewall:**
   - Port 587 should allow outbound connections
   - Test: `telnet smtp.gmail.com 587`

### Emails in Spam?

- Gmail: Check "Promotions" and "Spam" tabs
- Add store email to contacts
- Configure SPF/DKIM records (production)

### Missing Recipient Email?

- Guest emails: Must provide `guest_email` in order creation
- Registered users: Email fetched from database
- If neither: Email silently skipped

---

## 📊 Email Content

### Order Confirmation Includes

✓ Order number
✓ Order date
✓ Item list (name, qty, price, total)
✓ Delivery address
✓ Store phone & email
✓ Order tracking link
✓ Bengali + English

### Shipping Notification Includes

✓ Shipping confirmation
✓ Order number
✓ Tracking link
✓ Expected delivery (2-3 days)
✓ Contact info
✓ Bengali + English

---

## ⚙️ Configuration Options

| Variable      | Example              | Purpose                     |
| ------------- | -------------------- | --------------------------- |
| SMTP_HOST     | smtp.gmail.com       | SMTP server address         |
| SMTP_PORT     | 587                  | SMTP port (TLS)             |
| SMTP_USERNAME | your-email@gmail.com | Email account for sending   |
| SMTP_PASSWORD | xxxx xxxx xxxx xxxx  | App password (16 chars)     |
| EMAIL_FROM    | noreply@storebd.com  | Sender email address        |
| STORE_NAME    | StoreBD              | Store name in emails        |
| STORE_PHONE   | +880-1XXXXXXXXX      | Support phone in emails     |
| FRONTEND_URL  | https://storebd.com  | Base URL for tracking links |

---

## 🔗 SMTP Providers

### Gmail (Recommended for Testing)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=16-character-app-password
```

**Setup:** https://support.google.com/accounts/answer/185833

### SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### AWS SES

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USERNAME=AKIAIOSFODNN7EXAMPLE
SMTP_PASSWORD=BInxXAmySTRONGPASSWORD
```

### Mailgun

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USERNAME=postmaster@mg.yourdomain.com
SMTP_PASSWORD=your-password
```

---

## 📝 Logging

Emails write logs for debugging:

```go
✅ Email sent successfully to customer@example.com
❌ Failed to send email to customer@example.com: connection refused
⏱️  Email send timeout for customer@example.com
⚠️  Email not configured. Would send to: customer@example.com
```

View logs in your application output/logs.

---

## 🚀 Production Checklist

Before going live:

- [ ] SMTP credentials configured in `.env`
- [ ] Tested email sending with real order
- [ ] Verified emails not going to spam
- [ ] SPF record configured for domain
- [ ] DKIM signature enabled
- [ ] Credentials stored in secret manager
- [ ] Email account has 2FA enabled
- [ ] Fallback SMTP provider identified
- [ ] Support team trained on email system
- [ ] Monitoring/alerting set up for failures

---

## 🔧 Technical Details

### Background Sending

```go
// Runs in goroutine - doesn't block response
go s.sendEmail(ctx, payload)
```

### Timeout

```go
// Each email has 10-second timeout
context.WithTimeout(ctx, 10*time.Second)
```

### Error Handling

```go
// Failures logged but don't block order creation
_ = s.emailService.SendOrderConfirmationEmail(ctx, order, orderItems)
```

### Format

```go
// RFC 2822 compliant with MIME headers
// UTF-8 encoding for Bengali characters
// HTML with inline CSS + plain text fallback
```

---

## 📚 See Also

- **Full Guide:** `EMAIL_SERVICE_GUIDE.md`
- **Implementation:** `EMAIL_SERVICE_IMPLEMENTATION.md`
- **Code:** `internal/service/email_service.go`

---

**Questions?** Check the full documentation or review the implementation code.

**Ready to deploy?** Add SMTP credentials to `.env` and you're done!

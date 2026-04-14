package service

import (
	"context"
	"fmt"
	"log"
	"net/smtp"
	"time"

	"github.com/gonext-ecommerce/backend/internal/config"
	"github.com/gonext-ecommerce/backend/internal/domain"
)

// EmailService handles email sending for the application
type EmailService struct {
	cfg *config.Config
}

// EmailPayload represents data for sending emails
type EmailPayload struct {
	To       string
	Subject  string
	HTMLBody string
	TextBody string
}

// formatAddress builds a complete address string from address components
func (s *EmailService) formatAddress(addr *domain.Address) string {
	if addr == nil {
		return "Address not available"
	}
	return fmt.Sprintf("%s, %s, %s, %s, %s, %s",
		addr.FullName, addr.Phone, addr.AddressLine1,
		addr.AddressLine2, addr.City, addr.District)
}

// NewEmailService creates a new email service
func NewEmailService(cfg *config.Config) *EmailService {
	return &EmailService{cfg: cfg}
}

// SendOrderConfirmationEmail sends order confirmation to customer
// This is called after successful order creation
func (s *EmailService) SendOrderConfirmationEmail(ctx context.Context, order *domain.Order, items []domain.OrderItem) error {
	email := order.GuestEmail
	if email == "" && order.UserID != nil {
		// In production, fetch user email from database
		// For now, we'll skip if no email available
		return nil
	}

	html := s.buildOrderConfirmationHTML(order, items)
	text := s.buildOrderConfirmationText(order, items)

	payload := EmailPayload{
		To:       email,
		Subject:  fmt.Sprintf("অর্ডার নিশ্চিতকরণ - অর্ডার নম্বর: %s | Order Confirmation #%s", order.OrderNumber, order.OrderNumber),
		HTMLBody: html,
		TextBody: text,
	}

	// Send email in background to not block the API response
	go s.sendEmail(ctx, payload)

	return nil
}

// SendShippingNotificationEmail notifies customer when order ships
func (s *EmailService) SendShippingNotificationEmail(ctx context.Context, order *domain.Order) error {
	email := order.GuestEmail
	if email == "" {
		return nil
	}

	html := s.buildShippingNotificationHTML(order)
	text := s.buildShippingNotificationText(order)

	payload := EmailPayload{
		To:       email,
		Subject:  fmt.Sprintf("আপনার অর্ডার পাঠানো হয়েছে | Your Order Shipped #%s", order.OrderNumber),
		HTMLBody: html,
		TextBody: text,
	}

	go s.sendEmail(ctx, payload)
	return nil
}

// sendEmail privately sends the email using SMTP
func (s *EmailService) sendEmail(ctx context.Context, payload EmailPayload) {
	// Skip if SMTP not configured
	if s.cfg.SMTPHost == "" || s.cfg.SMTPUsername == "" {
		log.Printf("⚠️  Email not configured. Would send to: %s", payload.To)
		return
	}

	// Create MIME message
	headers := map[string]string{
		"From":                      s.cfg.EmailFrom,
		"To":                        payload.To,
		"Subject":                   payload.Subject,
		"MIME-Version":              "1.0",
		"Content-Type":              "text/html; charset=\"UTF-8\"",
		"Content-Transfer-Encoding": "quoted-printable",
	}

	message := ""
	for k, v := range headers {
		message += fmt.Sprintf("%s: %s\r\n", k, v)
	}
	message += "\r\n" + payload.HTMLBody

	// SMTP Configuration
	addr := fmt.Sprintf("%s:%s", s.cfg.SMTPHost, s.cfg.SMTPPort)
	auth := smtp.PlainAuth("", s.cfg.SMTPUsername, s.cfg.SMTPPassword, s.cfg.SMTPHost)

	// Send email with timeout
	sendCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	done := make(chan error, 1)
	go func() {
		err := smtp.SendMail(addr, auth, s.cfg.EmailFrom, []string{payload.To}, []byte(message))
		done <- err
	}()

	select {
	case err := <-done:
		if err != nil {
			log.Printf("❌ Failed to send email to %s: %v", payload.To, err)
		} else {
			log.Printf("✅ Email sent successfully to %s", payload.To)
		}
	case <-sendCtx.Done():
		log.Printf("⏱️  Email send timeout for %s", payload.To)
	}
}

// buildOrderConfirmationHTML creates HTML for order confirmation email
// Bengali + English for Bangladesh market
func (s *EmailService) buildOrderConfirmationHTML(order *domain.Order, items []domain.OrderItem) string {
	itemsHTML := ""

	for _, item := range items {
		itemsHTML += fmt.Sprintf(`
			<tr style="border-bottom: 1px solid #eee; padding: 10px 0;">
				<td style="padding: 8px; text-align: left;">%s</td>
				<td style="padding: 8px; text-align: center;">%d</td>
				<td style="padding: 8px; text-align: right;">৳ %s</td>
				<td style="padding: 8px; text-align: right;">৳ %s</td>
			</tr>
		`, item.ProductName, item.Quantity, item.UnitPrice, item.TotalPrice.String())
	}

	// Get tracking URL - for order confirmation we provide order number for tracking
	trackingURL := fmt.Sprintf("%s/order-confirmation?order=%s", s.cfg.FrontendURL, order.OrderNumber)

	html := fmt.Sprintf(`
<!DOCTYPE html>
<html dir="ltr" lang="bn">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<style>
		body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
		.container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
		.header { background: #1a1916; color: #fff; padding: 20px; text-align: center; }
		.content { background: #fff; padding: 20px; margin: 10px 0; border-radius: 5px; }
		.footer { background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; }
		.gold { color: #c9a96e; font-weight: bold; }
		table { width: 100%%; border-collapse: collapse; margin: 15px 0; }
		th { background: #f5f5f5; padding: 10px; text-align: left; border-bottom: 2px solid #c9a96e; }
		.button { background: #c9a96e; color: #1a1916; padding: 10px 20px; text-decoration: none; display: inline-block; margin: 10px 0; border-radius: 3px; font-weight: bold; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>%s</h1>
			<p>আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে</p>
			<p>Your Order Has Been Confirmed</p>
		</div>

		<div class="content">
			<h2>নমস্কার / Hello,</h2>
			<p>আপনার অর্ডারের জন্য ধন্যবাদ! আমরা আপনার অর্ডার প্রক্রিয়া করছি এবং শীঘ্রই পাঠাব।</p>
			<p>Thank you for your order! We are processing your order and will ship it soon.</p>

			<h3>অর্ডার বিবরণ / Order Details</h3>
			<p><strong>অর্ডার নম্বর / Order Number:</strong> <span class="gold">%s</span></p>
			<p><strong>অর্ডারের তারিখ / Order Date:</strong> %s</p>
			<p><strong>ডেলিভারি ঠিকানা / Delivery Address:</strong><br>%s</p>

			<h3>পণ্য / Items</h3>
			<table>
				<thead>
					<tr style="border-bottom: 2px solid #c9a96e;">
						<th>পণ্য / Product</th>
						<th>পরিমাণ / Qty</th>
						<th>মূল্য / Price</th>
						<th>সর্বমোট / Total</th>
					</tr>
				</thead>
				<tbody>
					%s
				</tbody>
			</table>

			<h3 style="text-align: right; font-size: 18px;">মোট / Total: <span class="gold">৳ %s</span></h3>

			<h3>পরবর্তী পদক্ষেপ / Next Steps</h3>
			<ul>
				<li>আমরা আপনার অর্ডার প্রস্তুত করছি / We are preparing your order</li>
				<li>আপনি একটি শিপিং বিজ্ঞপ্তি পাবেন / You will receive a shipping notification</li>
				<li>ট্র্যাক করুন আপনার অর্ডার / Track your order: <a href="%s" class="button">ট্র্যাক করুন / Track</a></li>
			</ul>

			<h3>যোগাযোগ / Need Help?</h3>
			<p>
				<strong>ফোন / Phone:</strong> %s<br>
				<strong>ইমেইল / Email:</strong> %s
			</p>
		</div>

		<div class="footer">
			<p>© %d %s. সর্বাধিকার সংরক্ষিত। All rights reserved.</p>
			<p>এই ইমেইল স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে। অনুগ্রহ করে উত্তর দিবেন না।</p>
			<p>This email was sent automatically. Please do not reply.</p>
		</div>
	</div>
</body>
</html>
	`, s.cfg.StoreName, order.OrderNumber, order.CreatedAt.Format("02 Jan 2006 15:04"),
		s.formatAddress(order.ShippingAddress), itemsHTML, order.Subtotal.String(), trackingURL,
		s.cfg.StorePhone, s.cfg.EmailFrom, time.Now().Year(), s.cfg.StoreName)

	return html
}

// buildOrderConfirmationText creates plain text version
func (s *EmailService) buildOrderConfirmationText(order *domain.Order, items []domain.OrderItem) string {
	text := fmt.Sprintf(`
আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে
Your Order Has Been Confirmed

অর্ডার নম্বর: %s
Order Number: %s

অর্ডারের তারিখ: %s
Order Date: %s

পণ্য:
Items:
`, order.OrderNumber, order.OrderNumber, order.CreatedAt.Format("02 Jan 2006"), order.CreatedAt.Format("02 Jan 2006"))

	for _, item := range items {
		text += fmt.Sprintf("- %s (পরিমাণ: %d) = ৳ %s\n", item.ProductName, item.Quantity, item.UnitPrice)
	}

	text += fmt.Sprintf(`
ডেলিভারি ঠিকানা: %s
Delivery Address: %s

যোগাযোগ: %s
Contact: %s

আপনার অর্ডার শীঘ্রই পাঠানো হবে।
Your order will be shipped soon.
`, s.formatAddress(order.ShippingAddress), s.formatAddress(order.ShippingAddress), s.cfg.StorePhone, s.cfg.StorePhone)

	return text
}

// buildShippingNotificationHTML creates shipping notification email
func (s *EmailService) buildShippingNotificationHTML(order *domain.Order) string {
	trackingURL := fmt.Sprintf("%s/order-confirmation?order=%s", s.cfg.FrontendURL, order.OrderNumber)

	html := fmt.Sprintf(`
<!DOCTYPE html>
<html dir="ltr" lang="bn">
<head>
	<meta charset="UTF-8">
	<style>
		body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
		.container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
		.header { background: #1a1916; color: #fff; padding: 20px; text-align: center; }
		.content { background: #fff; padding: 20px; }
		.button { background: #c9a96e; color: #1a1916; padding: 10px 20px; text-decoration: none; display: inline-block; margin: 10px 0; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>🚚 আপনার অর্ডার পাঠানো হয়েছে</h1>
			<p>Your Order Has Shipped</p>
		</div>

		<div class="content">
			<p>আপনার অর্ডার পাঠানো হয়েছে এবং শীঘ্রই আসছে।</p>
			<p>Your order has been shipped and arriving soon.</p>

			<p><strong>অর্ডার নম্বর / Order #:</strong> %s</p>

			<h3>ট্র্যাকিং / Tracking</h3>
			<a href="%s" class="button">আপডেট দেখুন / View Updates</a>

			<p><strong>প্রত্যাশিত ডেলিভারি / Expected Delivery:</strong> 2-3 ব্যবসায়িক দিন / business days</p>

			<p>ধন্যবাদ আপনার ক্রয়ের জন্য!</p>
			<p>Thank you for your purchase!</p>
		</div>
	</div>
</body>
</html>
	`, order.OrderNumber, trackingURL)

	return html
}

// buildShippingNotificationText creates plain text shipping notification
func (s *EmailService) buildShippingNotificationText(order *domain.Order) string {
	return fmt.Sprintf(`
আপনার অর্ডার পাঠানো হয়েছে
Your Order Has Shipped

অর্ডার নম্বর: %s
Order Number: %s

আপনার অর্ডার শীঘ্রই আসছে।
Your order is on the way and arriving soon.

প্রত্যাশিত ডেলিভারি: 2-3 ব্যবসায়িক দিন
Expected Delivery: 2-3 business days
`, order.OrderNumber, order.OrderNumber)
}

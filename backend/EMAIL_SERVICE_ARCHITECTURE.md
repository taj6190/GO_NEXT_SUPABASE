# Email Service Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         API Client / Frontend                        │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ POST /api/v1/orders
                                  ↓
                    ┌─────────────────────────────┐
                    │   Order Handler             │
                    │  (order_handler.go)         │
                    └─────────────────────────────┘
                                  │
                                  ↓
                    ┌─────────────────────────────┐
                    │   Order Service             │
                    │  (order_service.go)         │
                    └─────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ↓             ↓             ↓
            ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
            │  DB: Create  │ │  Stock:      │ │  Email Service   │
            │  Order       │ │  Update      │ │  (email_service) │
            │              │ │  Inventory   │ │                  │
            └──────────────┘ └──────────────┘ └──────────────────┘
                                                      │
                                                      │ [GOROUTINE]
                                                      │ (Non-blocking)
                                                      ↓
                                ┌─────────────────────────────────────┐
                                │   Build Email HTML + Text           │
                                │   - Order details                   │
                                │   - Item list                       │
                                │   - Delivery address                │
                                │   - Tracking link                   │
                                └─────────────────────────────────────┘
                                                      │
                                                      ↓
                                ┌─────────────────────────────────────┐
                                │   SMTP Client (TLS/SSL)             │
                                │   - tcp.Dial to SMTP server         │
                                │   - 10-second timeout               │
                                │   - Send RFC 2822 message           │
                                │   - Handle errors gracefully        │
                                └─────────────────────────────────────┘
                                                      │
                    ┌─────────────────────────────────┼──────────────────────────────────┐
                    │                                 │                                  │
                    ↓                                 ↓                                  ↓
        ┌──────────────────────┐        ┌──────────────────────┐        ┌──────────────────────┐
        │ Success ✅           │        │ Error ❌             │        │ Timeout ⏱️           │
        │ Email sent to        │        │ Failed to send:      │        │ 10-second timeout    │
        │ customer@gmail.com   │        │ Auth failed          │        │ exceeded             │
        │                      │        │ Network error        │        │                      │
        │ Log: ✅ Email sent   │        │ SMTP server error    │        │ Log: ⏱️ Timeout     │
        │ successfully         │        │                      │        │                      │
        │                      │        │ Log: ❌ Failed       │        │                      │
        └──────────────────────┘        └──────────────────────┘        └──────────────────────┘
                    │                                 │                                  │
                    └─────────────────────────────────┼──────────────────────────────────┘
                                                      │
                                 ┌────────────────────┘
                                 ↓
                    ┌─────────────────────────────┐
                    │  API Response Returned      │
                    │  Immediately                │
                    │  (Email sending continues   │
                    │   in background)            │
                    └─────────────────────────────┘
                                  │
                                  ↓
                    ┌─────────────────────────────┐
                    │  Frontend Shows Success     │
                    │  ✓ Order Created           │
                    │  ✓ Confirmation Email Sent │
                    └─────────────────────────────┘
```

---

## Data Flow: Order Confirmation Email

```
Order Creation Request
│
├─ Validate input
├─ Check cart items
├─ Calculate totals
├─ Apply coupon
├─ Create Order → DB
├─ Create OrderItems → DB
├─ Update Stock → DB
├─ Create Payment → DB
├─ Clear Cart → DB
│
└─> EmailService.SendOrderConfirmationEmail()
    │
    ├─ Extract order details
    ├─ Get shipping address
    ├─ Format address string
    ├─ Build item list (loop through OrderItems)
    │  └─ ProductName, Quantity, UnitPrice, TotalPrice
    ├─ Build HTML template (Bengali/English)
    ├─ Build plain text template
    │
    └─> go sendEmail() [GOROUTINE - NON-BLOCKING]
        │
        ├─ Parse SMTP config
        ├─ Create TLS connection (10s timeout)
        ├─ Authenticate (SMTP credentials)
        ├─ Build RFC 2822 message
        ├─ Add MIME headers
        ├─ Send HTML body
        │
        └─> Log result
            ├─ ✅ Success: "Email sent to customer@example.com"
            ├─ ❌ Error: "Failed to send email: {error}"
            └─ ⏱️ Timeout: "Email send timeout"
```

---

## Email Service Components

```
┌───────────────────────────────────────────────────────┐
│              EmailService Struct                      │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Fields:                                         │  │
│  │  - cfg *config.Config                         │  │
│  │    (SMTP host, port, username, password)      │  │
│  │    (Email from, store name, phone)            │  │
│  │    (Frontend URL for tracking links)          │  │
│  └─────────────────────────────────────────────────┘  │
│                                                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Public Methods:                                 │  │
│  │  - SendOrderConfirmationEmail()                │  │
│  │  - SendShippingNotificationEmail()             │  │
│  └─────────────────────────────────────────────────┘  │
│                                                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Private Methods:                                │  │
│  │  - sendEmail()                    [SMTP logic] │  │
│  │  - buildOrderConfirmationHTML()    [Template] │  │
│  │  - buildOrderConfirmationText()    [Template] │  │
│  │  - buildShippingNotificationHTML() [Template] │  │
│  │  - buildShippingNotificationText() [Template] │  │
│  │  - formatAddress()                [Helper]   │  │
│  └─────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────┘
```

---

## Integration Points

```
┌──────────────────────────────────────────────────────────┐
│  main.go (cmd/api/main.go)                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │ func main() {                                      │ │
│  │   ...                                              │ │
│  │   emailService := service.NewEmailService(cfg)    │ │
│  │   orderService := service.NewOrderService(        │ │
│  │     orderRepo,                                    │ │
│  │     cartRepo,                                     │ │
│  │     productRepo,                                  │ │
│  │     couponRepo,                                   │ │
│  │     paymentRepo,                                  │ │
│  │     addressRepo,                                  │ │
│  │     emailService,    ← INJECTED              │ │
│  │     rdb,                                          │ │
│  │   )                                               │ │
│  │   ...                                              │ │
│  │ }                                                  │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
                        │
                        │
      ┌─────────────────┴─────────────────┐
      │                                   │
      ↓                                   ↓
┌────────────────────────────┐   ┌──────────────────────────┐
│  OrderService              │   │  OrderHandler            │
│  (order_service.go)        │   │  (order_handler.go)      │
│                            │   │                          │
│  CreateOrder() {           │   │  CreateOrder() {         │
│   ...                      │   │   input := ...           │
│   order := ...             │   │   order := service.      │
│   ...                      │   │     CreateOrder(...)     │
│   emailService.Send        │   │   return order           │
│     OrderConfirmation()    │   │  }                       │
│  }                         │   │                          │
└────────────────────────────┘   └──────────────────────────┘
```

---

## Configuration Flow

```
┌─────────────────────────────────┐
│  .env File                      │
│  SMTP_HOST=smtp.gmail.com       │
│  SMTP_PORT=587                  │
│  SMTP_USERNAME=...              │
│  SMTP_PASSWORD=...              │
│  EMAIL_FROM=...                 │
│  STORE_NAME=...                 │
│  STORE_PHONE=...                │
│  FRONTEND_URL=...               │
└─────────────────────────────────┘
         │
         │ godotenv.Load()
         ↓
┌─────────────────────────────────┐
│  config.Load()                  │
│  (config/config.go)             │
│                                 │
│  cfg := &Config{                │
│    SMTPHost: "...",             │
│    SMTPPort: "587",             │
│    SMTPUsername: "...",         │
│    SMTPPassword: "...",         │
│    EmailFrom: "...",            │
│    StoreName: "...",            │
│    StorePhone: "...",           │
│    FrontendURL: "...",          │
│  }                              │
└─────────────────────────────────┘
         │
         │ Pass to constructor
         ↓
┌─────────────────────────────────┐
│  EmailService                   │
│  emailService := New(cfg)       │
│                                 │
│  Uses:                          │
│  - cfg.SMTPHost                 │
│  - cfg.SMTPPort                 │
│  - cfg.SMTPUsername             │
│  - cfg.SMTPPassword             │
│  - cfg.EmailFrom                │
│  - cfg.StoreName                │
│  - cfg.StorePhone               │
│  - cfg.FrontendURL              │
└─────────────────────────────────┘
```

---

## Email Template Structure

```
┌─────────────────────────────────────────────────────────┐
│  Email Payload                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ To: "customer@gmail.com"                         │ │
│  │ Subject: "অর্ডার নিশ্চিতকরণ - Order Confirmation" │ │
│  │ HTMLBody: "<html>...</html>"  [Responsive HTML]  │ │
│  │ TextBody: "Plain text version..." [UTF-8]        │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
         │
         │
         ↓
┌─────────────────────────────────────────────────────────┐
│  HTML Email (Responsive Design)                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  [HEADER: Store Logo/Name]                       │ │
│  │  [GREETING: Bengali + English]                   │ │
│  │                                                   │ │
│  │  Order Details:                                  │ │
│  │  - Order Number: #ORD-2024...                    │ │
│  │  - Order Date: 15 Jan 2024                       │ │
│  │  - Delivery Address: Full address               │ │
│  │                                                   │ │
│  │  Items Table:                                    │ │
│  │  Product | Qty | Price | Total                   │ │
│  │  ─────────────────────────────────                │ │
│  │  Phone   │ 2   │ 15999 │ 31998                   │ │
│  │                                                   │ │
│  │  Total: ৳ 31,998.00                              │ │
│  │                                                   │ │
│  │  [ACTION BUTTON: Track Order]                    │ │
│  │  [FOOTER: Contact Info & Copyright]              │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
         │
         │
         ↓
┌─────────────────────────────────────────────────────────┐
│  Plain Text Email (Fallback)                            │
│  ┌───────────────────────────────────────────────────┐ │
│  │ আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে              │ │
│  │ Your Order Has Been Confirmed                   │ │
│  │                                                   │ │
│  │ Order Number: #ORD-2024...                       │ │
│  │ Order Date: 15 Jan 2024                          │ │
│  │                                                   │ │
│  │ Items:                                           │ │
│  │ - Phone (Qty: 2) = ৳ 31,998                      │ │
│  │                                                   │ │
│  │ Delivery Address: Full address                   │ │
│  │ Contact: +880-1X-XXX-XXXX                        │ │
│  │                                                   │ │
│  │ আপনার অর্ডার শীঘ্রই পাঠানো হবে।                  │ │
│  │ Your order will be shipped soon.                │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Error Handling Flow

```
┌──────────────────────────────────────────────────┐
│  SendOrderConfirmationEmail()                    │
│                                                  │
│  if email == "" {                               │
│      return nil  ← Skip if no email             │
│  }                                              │
│                                                  │
│  go sendEmail(ctx, payload)  ← Start goroutine │
└──────────────────────────────────────────────────┘
         │
         │
         ↓
┌──────────────────────────────────────────────────┐
│  sendEmail() [GOROUTINE]                        │
│                                                  │
│  go func() {                                   │
│      select {                                  │
│          case err := <-done:                   │
│              if err != nil {                   │
│                  log.Printf("❌ Failed: %v") │
│              } else {                          │
│                  log.Printf("✅ Email sent")  │
│              }                                 │
│                                                │
│          case <-sendCtx.Done():               │
│              log.Printf("⏱️ Timeout")         │
│      }                                         │
│  }()                                           │
└──────────────────────────────────────────────────┘
         │
    ┌────┴────┬────────┐
    │         │        │
    ↓         ↓        ↓
 Success   Error   Timeout
   ✅        ❌       ⏱️
```

---

## Performance Characteristics

```
Order API Response Time: ~100-200ms (depends on DB)
├─ Database operations: ~50-100ms
│  └─ Create order
│  └─ Create items
│  └─ Update stock
│  └─ Create payment
├─ Email service spawn: <1ms
│  └─ Just spawns goroutine
└─ Return response: <10ms

Email Sending (Background): 1-10 seconds
├─ SMTP connection: ~500ms
├─ SMTP auth: ~200ms
├─ Build headers/message: ~50ms
├─ Send message: ~200ms
└─ SMTP disconnect: ~50ms

Key Point: Email sending doesn't block API response!
The order is returned to client instantly while email
sends in the background.
```

---

## Deployment Architecture

```
┌────────────────────────────────┐
│     Production Environment     │
│                                │
│  ┌─────────────────────────┐   │
│  │  Application Server     │   │
│  │  - OrderService         │   │
│  │  - EmailService         │   │
│  │  - handlers             │   │
│  └─────────────────────────┘   │
│            │                   │
│  ┌─────────┴──────────────┐    │
│  │                        │    │
│  ↓                        ↓    │
│ PostgreSQL             Redis   │
│ (orders, items)    (caching)   │
│                                │
│  ┌─────────────────────────┐   │
│  │  SMTP Outbound          │   │
│  │  - Gmail: tcp:587       │   │
│  │  - Fallback: tcp:25/2525│   │
│  │  - Rate limit: check    │   │
│  └─────────────────────────┘   │
└────────────────────────────────┘
             │
             │ TLS/SSL
             │
    ┌────────┴────────┐
    │                 │
    ↓                 ↓
SMTP Server      Recipient Inbox
(gmail.com)      (customer email)
```

---

## Integration Timeline

```
T+0s   Order POST /api/v1/orders
T+50ms Create order in database
T+100ms Create items, update stock, create payment
T+101ms Spawn SendOrderConfirmationEmail() goroutine
T+102ms Return 201 Created response to client

[Meanwhile, in background gorutine...]

T+102ms SMTP connection starts
T+500ms Connected to SMTP server
T+700ms Authenticated
T+800ms Built and sent email
T+850ms Confirm receipt from server
T+851ms Log: ✅ Email sent successfully

Total: Client sees response in 102ms
Email actually sent in ~750ms
No impact on API response time
```

---

**This architecture ensures:**

- ✅ Fast API responses
- ✅ Reliable email delivery
- ✅ Non-blocking operations
- ✅ Graceful error handling
- ✅ Scalability for concurrent orders

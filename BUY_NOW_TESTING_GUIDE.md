# Buy Now Feature - Testing Guide

## Quick Test Checklist

### 1. Product Listing Page Testing

**URL:** `http://localhost:3000/products`

- [ ] See two buttons on each product card: "Buy Now" (orange) and "Cart" (black)
- [ ] "Buy Now" button disabled when product is out of stock
- [ ] Click "Buy Now" → Modal opens
- [ ] Modal shows correct product image, name, and price
- [ ] Modal shows correct quantity (defaults to 1)

### 2. Product Detail Page Testing

**URL:** `http://localhost:3000/products/[product-slug]`

- [ ] "Buy Now" button visible in action area (orange gradient)
- [ ] "Buy Now" button positioned between quantity selector and "Add to Cart"
- [ ] Can adjust quantity with +/- buttons before clicking "Buy Now"
- [ ] With product variants, "Buy Now" opens modal after variant selection
- [ ] "Buy Now" disabled when out of stock
- [ ] Click "Buy Now" with quantity 3 → Modal shows quantity 3

### 3. Modal Display Testing

#### Product Information Section

- [ ] Product image displays correctly
- [ ] Product name visible
- [ ] Selected quantity shown
- [ ] Current price displayed (with discount if applicable)
- [ ] Original price shown crossed out (if on sale)

#### Price Breakdown Section

- [ ] Subtotal = Price × Quantity
- [ ] Shipping cost = 60 (BDT)
- [ ] Total = Subtotal + Shipping

#### Form Fields Testing

- [ ] **Full Name field:**
  - [ ] Pre-filled with user name when logged in
  - [ ] Can edit the field
  - [ ] Required (shows error if empty)

- [ ] **Phone Number field:**
  - [ ] Empty by default (even when logged in)
  - [ ] Can enter phone number
  - [ ] Required (shows error if empty)

- [ ] **Email field:**
  - [ ] Pre-filled with user email when logged in
  - [ ] Optional (can be left blank)
  - [ ] Accepts valid email format

- [ ] **Delivery Address field:**
  - [ ] Optional
  - [ ] Textarea with 5 line height
  - [ ] Can enter multi-line address

#### Payment Method Selection

- [ ] Three options visible: COD, bKash, Nagad
- [ ] Each option is clickable
- [ ] COD is selected by default
- [ ] Can switch between methods
- [ ] Selected method shows proper radio button state

### 4. Form Validation Testing

**With all fields empty:**

- [ ] Click "Place Order Now"
- [ ] See error: "Please enter your name"
- [ ] Form doesn't submit

**With name filled, no phone:**

- [ ] Fill name field
- [ ] Click "Place Order Now"
- [ ] See error: "Please enter your phone number"

**With both required fields filled:**

- [ ] Fill name and phone
- [ ] Optional fields can be left empty
- [ ] Click "Place Order Now"
- [ ] Should process (see loading state)

### 5. Order Placement Testing

**Successful Order:**

- [ ] Fill required fields (Name + Phone)
- [ ] Click "Place Order Now"
- [ ] Button shows loading state with spinner
- [ ] Success toast appears: "Order placed successfully!"
- [ ] Modal closes
- [ ] Redirected to `/orders` page
- [ ] New order visible in orders page

**Failed Order (if backend returns error):**

- [ ] Fill form with incorrect data (if applicable)
- [ ] See error toast with error message

### 6. Modal Interactions

- [ ] Click X button to close modal
- [ ] Click backdrop (outside modal) to close
- [ ] Closing doesn't create an order
- [ ] Can reopen modal by clicking "Buy Now" again
- [ ] Form resets between modal open/closes (new instance)

### 7. Authentication State Testing

**When Logged Out:**

- [ ] Full Name field: empty
- [ ] Email field: empty
- [ ] Phone field: empty
- [ ] Can still place order with valid data

**When Logged In:**

- [ ] Full Name field: pre-filled with user's full_name
- [ ] Email field: pre-filled with user's email
- [ ] Phone field: empty (user must fill)
- [ ] Can edit any pre-filled fields

### 8. Variant Testing (If Product Has Variants)

**On Product Detail Page with Variants:**

- [ ] Select a variant (e.g., size, color)
- [ ] Click "Buy Now"
- [ ] Modal opens with selected variant's price
- [ ] Modal shows variant details

### 9. Stock Validation Testing

**Out of Stock Product:**

- [ ] "Buy Now" button disabled (greyed out)
- [ ] Button shows "Out of Stock" text
- [ ] Cannot click button
- [ ] Modal doesn't open

**In Stock with Limited Quantity:**

- [ ] Set quantity to 5
- [ ] Product only has 3 in stock
- [ ] Click "Buy Now"
- [ ] See error: "Not enough stock"
- [ ] Modal doesn't open

### 10. Responsive Design Testing

**Mobile (< 640px):**

- [ ] Modal fits on screen (width = 90vw)
- [ ] Buttons stack vertically
- [ ] Form fields are full width
- [ ] Can scroll form if needed

**Tablet (640px - 1024px):**

- [ ] Modal displays properly
- [ ] Buttons might be side by side
- [ ] Form elements readable

**Desktop (> 1024px):**

- [ ] Modal centered on screen
- [ ] Good spacing around content
- [ ] All elements properly aligned

---

## Manual Testing Scenarios

### Scenario 1: Quick Purchase (Guest)

1. Browse products page
2. Find interesting product
3. Click "Buy Now"
4. Enter name: "Ahmed Khan"
5. Enter phone: "01712345678"
6. Select COD
7. Click "Place Order Now"
8. ✅ Should see order in `/orders` page

### Scenario 2: Logged-in User Purchase

1. Log in to account
2. Go to product detail page
3. Note: Name and email are pre-filled
4. Change quantity to 2
5. Click "Buy Now"
6. Verify pre-filled data
7. Add delivery address
8. Select Nagad
9. Click "Place Order Now"
10. ✅ Order should include quantity 2 and selected payment method

### Scenario 3: Compare Buy Now vs Add to Cart

1. Click "Buy Now" → Quick checkout in modal
2. Open another product
3. Click "Cart" → Added to cart, redirects to cart/checkout
4. Compare workflow: Buy Now is faster/fewer steps ✅

### Scenario 4: Variant Purchase

1. Go to product with colors/sizes
2. Select: Color: Red, Size: Large
3. Click "Buy Now"
4. Verify modal shows selected variant
5. Complete purchase
6. ✅ Order should reflect selected variant

---

## Expected Behaviors

✅ Modal opens smoothly with fade-in animation
✅ Form validation prevents incomplete submissions
✅ Pre-filled data respects logged-in user
✅ Optional fields truly optional (can submit empty)
✅ All payment methods (COD, bKash, Nagad) selectable
✅ Loading state shows during order creation
✅ Errors display as toasts
✅ Success redirects to orders page
✅ Modal closes on success or manual close
✅ Button shows correct state (enabled/disabled based on stock)

---

## Debugging Tips

If modal doesn't open:

- Check browser console for errors
- Verify `useUIStore` is imported correctly
- Check if `BuyNowModal` is added to `Providers.tsx`

If form doesn't submit:

- Verify required fields are filled
- Check network tab for API errors
- Ensure `/orders` endpoint is working on backend

If modal doesn't pre-fill data:

- Verify user is logged in (`useAuthStore`)
- Check if user object has `full_name` and `email` fields
- Verify backend returns user data on /auth/me

If styles are off:

- Clear browser cache (hard refresh: Ctrl+Shift+R)
- Check if Tailwind CSS is being loaded
- Verify no CSS conflicts with existing styles

---

## Performance Considerations

- Modal uses lazy loading (only renders when opened)
- Image optimization via Next.js Image component
- Smooth animations using GPU-accelerated transforms
- Form validation is instant (no API calls)

---

## Accessibility Checklist

- [ ] Modal is keyboard navigable (Tab through fields)
- [ ] Close button (X) is accessible
- [ ] Form labels visible and associated with inputs
- [ ] Error messages announced to screen readers
- [ ] Focus management when modal opens/closes
- [ ] Loading state communicated clearly

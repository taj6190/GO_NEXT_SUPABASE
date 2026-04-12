$BaseUrl = "http://localhost:8080/api/v1"
$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "=== CHECKOUT FLOW E2E TEST ===" -ForegroundColor Cyan

# 1. Login as admin
$login = Invoke-RestMethod -Method POST -Uri "$BaseUrl/auth/login" -ContentType "application/json" -Body '{"email":"admin@gonext.com","password":"admin123456"}'
$adminToken = $login.data.tokens.access_token
Write-Host "1. Admin Login: OK" -ForegroundColor Green

# 2. Register a fresh test user
$ts = (Get-Date).Ticks.ToString().Substring(14)
$regBody = '{"email":"checkout' + $ts + '@test.com","password":"test123456","full_name":"Checkout Tester","phone":"01800' + $ts + '"}'
$reg = Invoke-RestMethod -Method POST -Uri "$BaseUrl/auth/register" -ContentType "application/json" -Body $regBody
$userToken = $reg.data.tokens.access_token
Write-Host "2. User Register: OK" -ForegroundColor Green

# 3. Create category
$adminH = @{ "Authorization" = "Bearer $adminToken" }
$catBody = '{"name":"CheckoutTest ' + $ts + '","description":"Test","is_active":true}'
$cat = Invoke-RestMethod -Method POST -Uri "$BaseUrl/admin/categories" -ContentType "application/json" -Body $catBody -Headers $adminH
$catId = $cat.data.id
Write-Host "3. Category Created: $catId" -ForegroundColor Green

# 4. Create a product
$prodBody = @{
    category_id = $catId
    name = "Test Product $ts"
    description = "Test product for checkout"
    short_description = "Test"
    price = 1500
    discount_price = 1200
    stock_quantity = 10
    sku = "CHK-$ts"
    is_active = $true
    is_featured = $false
    weight = 0.5
} | ConvertTo-Json
$prod = Invoke-RestMethod -Method POST -Uri "$BaseUrl/admin/products" -ContentType "application/json" -Body $prodBody -Headers $adminH
$prodId = $prod.data.id
$prodStock = $prod.data.stock_quantity
Write-Host "4. Product Created: $prodId (stock: $prodStock)" -ForegroundColor Green

# === GUEST CHECKOUT FLOW ===
Write-Host ""
Write-Host "--- Guest Checkout Flow ---" -ForegroundColor Yellow
$sessionId = [guid]::NewGuid().ToString()
$guestH = @{ "X-Session-ID" = $sessionId }

# 5. Add to cart as guest
$cartBody = "{`"product_id`":`"$prodId`",`"quantity`":2}"
$cartAdd = Invoke-RestMethod -Method POST -Uri "$BaseUrl/cart/items" -ContentType "application/json" -Body $cartBody -Headers $guestH
Write-Host "5. Add to Cart (Guest): item_id=$($cartAdd.data.id)" -ForegroundColor Green

# 6. Get cart and verify
$cart = Invoke-RestMethod -Method GET -Uri "$BaseUrl/cart" -Headers $guestH
$cartTotal = $cart.data.total
$cartItems = $cart.data.items.Count
Write-Host "6. Get Cart: $cartItems item(s), total=$cartTotal" -ForegroundColor Green

# 7. Create shipping address (guest)
$addrBody = '{"full_name":"Guest Buyer","phone":"01712345000","address_line1":"456 Test St","city":"Dhaka","district":"Dhaka","postal_code":"1207","is_default":true}'
$addr = Invoke-RestMethod -Method POST -Uri "$BaseUrl/addresses" -ContentType "application/json" -Body $addrBody -Headers $guestH
$addrId = $addr.data.id
Write-Host "7. Address Created: $addrId" -ForegroundColor Green

# 8. Create order (guest checkout)
$orderBody = @{
    guest_email = "guestchk$ts@test.com"
    guest_phone = "01800$ts"
    shipping_address_id = $addrId
    payment_method = "cod"
    notes = "E2E test order"
} | ConvertTo-Json

try {
    $order = Invoke-RestMethod -Method POST -Uri "$BaseUrl/orders" -ContentType "application/json" -Body $orderBody -Headers $guestH
    $orderId = $order.data.id
    $orderNum = $order.data.order_number
    $orderStatus = $order.data.status
    $orderTotal = $order.data.total_amount
    Write-Host "8. Guest Order Created!" -ForegroundColor Green
    Write-Host "   Order ID: $orderId" -ForegroundColor DarkGray
    Write-Host "   Order Number: $orderNum" -ForegroundColor DarkGray
    Write-Host "   Status: $orderStatus" -ForegroundColor DarkGray
    Write-Host "   Total Amount: $orderTotal" -ForegroundColor DarkGray
} catch {
    Write-Host "8. FAIL: Guest Order - $($_.Exception.Message)" -ForegroundColor Red
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    Write-Host "   Detail: $($reader.ReadToEnd())" -ForegroundColor Red
    $reader.Close()
    exit 1
}

# 9. Track order
$track = Invoke-RestMethod -Method GET -Uri "$BaseUrl/orders/track/$orderNum"
Write-Host "9. Track Order: status=$($track.data.status), items=$($track.data.items.Count)" -ForegroundColor Green

# 10. Verify cart is empty after order
$cartAfter = Invoke-RestMethod -Method GET -Uri "$BaseUrl/cart" -Headers $guestH
$itemsAfter = 0
if ($cartAfter.data.items) { $itemsAfter = $cartAfter.data.items.Count }
if ($itemsAfter -eq 0) {
    Write-Host "10. Cart After Order: EMPTY (correct!)" -ForegroundColor Green
} else {
    Write-Host "10. Cart After Order: $itemsAfter items (should be 0!)" -ForegroundColor Red
}

# === USER CHECKOUT FLOW ===
Write-Host ""
Write-Host "--- User Checkout Flow ---" -ForegroundColor Yellow
$userH = @{ "Authorization" = "Bearer $userToken" }

# 11. Add to cart as user
$cartBody2 = "{`"product_id`":`"$prodId`",`"quantity`":1}"
$cartAdd2 = Invoke-RestMethod -Method POST -Uri "$BaseUrl/cart/items" -ContentType "application/json" -Body $cartBody2 -Headers $userH
Write-Host "11. Add to Cart (User): item_id=$($cartAdd2.data.id)" -ForegroundColor Green

# 12. Create user address
$addr2 = Invoke-RestMethod -Method POST -Uri "$BaseUrl/addresses" -ContentType "application/json" -Body '{"full_name":"Auth User","phone":"01712345001","address_line1":"789 Auth St","city":"Dhaka","district":"Dhaka","postal_code":"1208","is_default":true}' -Headers $userH
$userAddrId = $addr2.data.id
Write-Host "12. User Address Created: $userAddrId" -ForegroundColor Green

# 13. Create order (user checkout)
$userOrderBody = @{
    shipping_address_id = $userAddrId
    payment_method = "cod"
    notes = "User E2E test"
} | ConvertTo-Json

try {
    $userOrder = Invoke-RestMethod -Method POST -Uri "$BaseUrl/orders" -ContentType "application/json" -Body $userOrderBody -Headers $userH
    $userOrderId = $userOrder.data.id
    $userOrderNum = $userOrder.data.order_number
    Write-Host "13. User Order Created!" -ForegroundColor Green
    Write-Host "    Order ID: $userOrderId" -ForegroundColor DarkGray
    Write-Host "    Order Number: $userOrderNum" -ForegroundColor DarkGray
    Write-Host "    Status: $($userOrder.data.status)" -ForegroundColor DarkGray
    Write-Host "    Total: $($userOrder.data.total_amount)" -ForegroundColor DarkGray
} catch {
    Write-Host "13. FAIL: User Order - $($_.Exception.Message)" -ForegroundColor Red
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    Write-Host "    Detail: $($reader.ReadToEnd())" -ForegroundColor Red
    $reader.Close()
    exit 1
}

# 14. Get user orders
$myOrders = Invoke-RestMethod -Method GET -Uri "$BaseUrl/orders" -Headers $userH
Write-Host "14. Get My Orders: $($myOrders.data.Count) order(s)" -ForegroundColor Green

# 15. Get order detail
$orderDetail = Invoke-RestMethod -Method GET -Uri "$BaseUrl/orders/$userOrderId" -Headers $userH
Write-Host "15. Order Detail: items=$($orderDetail.data.items.Count), status=$($orderDetail.data.status)" -ForegroundColor Green

# === ADMIN ORDER MANAGEMENT ===
Write-Host ""
Write-Host "--- Admin Order Status Flow ---" -ForegroundColor Yellow

# 16-19. Walk through all statuses
$statuses = @("confirmed", "processing", "shipped", "delivered")
$step = 16
foreach ($s in $statuses) {
    try {
        $statusBody = "{`"status`":`"$s`"}"
        $upd = Invoke-RestMethod -Method PUT -Uri "$BaseUrl/admin/orders/$orderId/status" -ContentType "application/json" -Body $statusBody -Headers $adminH
        Write-Host "$step. Status -> $($upd.data.status): OK" -ForegroundColor Green
    } catch {
        Write-Host "$step. Status -> $s : FAIL" -ForegroundColor Red
    }
    $step++
}

# 20. Final verification via tracking
$finalTrack = Invoke-RestMethod -Method GET -Uri "$BaseUrl/orders/track/$orderNum"
if ($finalTrack.data.status -eq "delivered") {
    Write-Host "20. Final Track: status=delivered (correct!)" -ForegroundColor Green
} else {
    Write-Host "20. Final Track: status=$($finalTrack.data.status) (expected delivered)" -ForegroundColor Red
}

# 21. Check stock was reduced
$prodAfter = Invoke-RestMethod -Method GET -Uri "$BaseUrl/admin/products/$prodId" -Headers $adminH
$expectedStock = 10 - 3  # 2 from guest + 1 from user
$actualStock = $prodAfter.data.stock_quantity
if ($actualStock -eq $expectedStock) {
    Write-Host "21. Stock Check: was=10, now=$actualStock (correct! reduced by 3)" -ForegroundColor Green
} else {
    Write-Host "21. Stock Check: was=10, now=$actualStock (expected $expectedStock)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== CHECKOUT E2E TEST COMPLETE ===" -ForegroundColor Cyan
Write-Host ""

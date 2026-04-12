$BaseUrl = "http://localhost:8080/api/v1"
$ErrorActionPreference = "Continue"

function Test-API {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [string]$Body = "",
        [hashtable]$Headers = @{}
    )
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            ContentType = "application/json"
            Headers = $Headers
            TimeoutSec = 15
        }
        if ($Body -ne "") {
            $params.Body = [System.Text.Encoding]::UTF8.GetBytes($Body)
        }
        
        $response = Invoke-WebRequest @params -UseBasicParsing
        $status = $response.StatusCode
        $content = $response.Content
        Write-Host "PASS [$status] $Name" -ForegroundColor Green
        return $content | ConvertFrom-Json
    }
    catch {
        $status = $_.Exception.Response.StatusCode.Value__
        $detail = ""
        if ($_.Exception.Response) {
            $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
            $detail = $reader.ReadToEnd()
            $reader.Close()
        }
        if ($status -ge 400 -and $status -lt 500) {
            Write-Host "WARN [$status] $Name - $detail" -ForegroundColor Yellow
        } else {
            Write-Host "FAIL [$status] $Name - $($_.Exception.Message) - $detail" -ForegroundColor Red
        }
        return $null
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   GoNext Backend API Test Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# --- 1. Health Check ---
Write-Host "--- 1. Health Check ---" -ForegroundColor Cyan
Test-API "Health Check" "GET" "http://localhost:8080/health"

# --- 2. Auth ---
Write-Host ""
Write-Host "--- 2. Authentication ---" -ForegroundColor Cyan

$U = (Get-Date).Ticks.ToString().Substring(12)

# Login as admin
$loginBody = '{"email":"admin@gonext.com","password":"admin123456"}'
$loginResult = Test-API "Admin Login" "POST" "$BaseUrl/auth/login" $loginBody
$adminToken = ""
if ($loginResult) {
    $adminToken = $loginResult.data.tokens.access_token
    Write-Host "  Admin Token: $($adminToken.Substring(0, 20))..." -ForegroundColor DarkGray
}

# Register a test user
$regBody = '{"email":"testuser' + $U + '@test.com","password":"test123456","full_name":"Test User","phone":"017000' + $U + '"}'
$regResult = Test-API "Register User" "POST" "$BaseUrl/auth/register" $regBody
$userToken = ""
if ($regResult) {
    $userToken = $regResult.data.tokens.access_token
    Write-Host "  User Token: $($userToken.Substring(0, 20))..." -ForegroundColor DarkGray
}

# If registration failed (duplicate), try logging in
if (-not $userToken) {
    $userLoginBody = '{"email":"testuser' + $U + '@test.com","password":"test123456"}'
    $userLoginResult = Test-API "User Login (fallback)" "POST" "$BaseUrl/auth/login" $userLoginBody
    if ($userLoginResult) {
        $userToken = $userLoginResult.data.tokens.access_token
    }
}

# Get Me
if ($adminToken) {
    $authHeaders = @{ "Authorization" = "Bearer $adminToken" }
    Test-API "Get Me (Admin)" "GET" "$BaseUrl/auth/me" "" $authHeaders
}

# Refresh Token
if ($loginResult) {
    $refreshBody = "{`"refresh_token`":`"$($loginResult.data.tokens.refresh_token)`"}"
    Test-API "Refresh Token" "POST" "$BaseUrl/auth/refresh" $refreshBody
}

# --- 3. Categories ---
Write-Host ""
Write-Host "--- 3. Categories ---" -ForegroundColor Cyan
$authHeaders = @{ "Authorization" = "Bearer $adminToken" }

# Create categories
$catBody = '{"name":"Electronics ' + $U + '","description":"Electronic devices and gadgets","is_active":true}'
$catResult = Test-API "Create Category (Electronics)" "POST" "$BaseUrl/admin/categories" $catBody $authHeaders
$electronicsId = ""
if ($catResult) { $electronicsId = $catResult.data.id }

$catBody2 = '{"name":"Phones ' + $U + '","description":"Mobile phones","is_active":true,"parent_id":"' + $electronicsId + '"}'
$catResult2 = Test-API "Create Sub-Category (Phones)" "POST" "$BaseUrl/admin/categories" $catBody2 $authHeaders
$phonesId = ""
if ($catResult2) { $phonesId = $catResult2.data.id }

$catBody3 = '{"name":"Clothing ' + $U + '","description":"Fashion and apparel","is_active":true}'
$catResult3 = Test-API "Create Category (Clothing)" "POST" "$BaseUrl/admin/categories" $catBody3 $authHeaders
$clothingId = ""
if ($catResult3) { $clothingId = $catResult3.data.id }

# List categories
Test-API "Get Category Tree" "GET" "$BaseUrl/categories"
Test-API "Admin List Categories" "GET" "$BaseUrl/admin/categories" "" $authHeaders

if ($electronicsId) {
    Test-API "Get Category by Slug" "GET" "$BaseUrl/categories/electronics-$U"
}

# --- 4. Products ---
Write-Host ""
Write-Host "--- 4. Products (Simple) ---" -ForegroundColor Cyan

# Create a simple product
$categoryToUse = $electronicsId
if (-not $categoryToUse) { $categoryToUse = $phonesId }
if (-not $categoryToUse) {
    Write-Host "SKIP - No category available" -ForegroundColor Yellow
} else {
    $prodBody = @{
        category_id = $categoryToUse
        name = "iPhone 15 Pro $U"
        description = "Latest Apple smartphone with A17 Pro chip"
        short_description = "Premium smartphone"
        price = 149999
        discount_price = 159999
        stock_quantity = 50
        sku = "IPH15PRO-001-$U"
        is_active = $true
        is_featured = $true
        weight = 0.221
        image_urls = @("https://example.com/iphone15.jpg", "https://example.com/iphone15-2.jpg")
    } | ConvertTo-Json -Depth 5
    
    $prodResult = Test-API "Create Simple Product" "POST" "$BaseUrl/admin/products" $prodBody $authHeaders
    $productId = ""
    $productSlug = ""
    if ($prodResult) { 
        $productId = $prodResult.data.id 
        $productSlug = $prodResult.data.slug
    }

    # Create another product
    $prodBody2 = @{
        category_id = $categoryToUse
        name = "Samsung Galaxy S24 $U"
        description = "Samsung flagship phone"
        short_description = "Android flagship"
        price = 119999
        discount_price = 129999
        stock_quantity = 30
        sku = "SAM-S24-001-$U"
        is_active = $true
        is_featured = $true
        weight = 0.195
        image_urls = @("https://example.com/s24.jpg")
    } | ConvertTo-Json -Depth 5
    
    $prodResult2 = Test-API "Create Simple Product 2" "POST" "$BaseUrl/admin/products" $prodBody2 $authHeaders
    $productId2 = ""
    if ($prodResult2) { $productId2 = $prodResult2.data.id }
}

# --- 5. Variable Products ---
Write-Host ""
Write-Host "--- 5. Variable Products ---" -ForegroundColor Cyan

$varCatToUse = $clothingId
if (-not $varCatToUse) { $varCatToUse = $categoryToUse }
if (-not $varCatToUse) {
    Write-Host "SKIP - No category available" -ForegroundColor Yellow
} else {
    $varProdBody = @{
        category_id = $varCatToUse
        name = "Classic Cotton T-Shirt $U"
        description = "Premium cotton t-shirt available in multiple colors and sizes"
        short_description = "Comfortable everyday tee"
        price = 1500
        discount_price = 2000
        stock_quantity = 100
        sku = "TSHIRT-001-$U"
        is_active = $true
        is_featured = $true
        weight = 0.2
        image_urls = @("https://example.com/tshirt-main.jpg")
        option_groups = @(
            @{
                name = "Color"
                sort_order = 0
                values = @(
                    @{ value = "Red"; color_hex = "#FF0000"; sort_order = 0 }
                    @{ value = "Blue"; color_hex = "#0000FF"; sort_order = 1 }
                    @{ value = "Black"; color_hex = "#000000"; sort_order = 2 }
                )
            }
            @{
                name = "Size"
                sort_order = 1
                values = @(
                    @{ value = "S"; sort_order = 0 }
                    @{ value = "M"; sort_order = 1 }
                    @{ value = "L"; sort_order = 2 }
                    @{ value = "XL"; sort_order = 3 }
                )
            }
        )
    } | ConvertTo-Json -Depth 10
    
    $varProdResult = Test-API "Create Variable Product (T-Shirt)" "POST" "$BaseUrl/admin/products" $varProdBody $authHeaders
    $varProductId = ""
    $varProductSlug = ""
    if ($varProdResult) {
        $varProductId = $varProdResult.data.id
        $varProductSlug = $varProdResult.data.slug
        Write-Host "  Variable Product ID: $varProductId" -ForegroundColor DarkGray
        Write-Host "  Option Groups: $($varProdResult.data.option_groups.Count)" -ForegroundColor DarkGray
        
        # Now create variants using the returned option value IDs
        $optionGroups = $varProdResult.data.option_groups
        if ($optionGroups -and $optionGroups.Count -ge 2) {
            $colorValues = $optionGroups[0].values
            $sizeValues = $optionGroups[1].values
            
            # Create variants: Red-M, Red-L, Blue-M, Blue-L, Black-M
            $variants = @()
            $variantIndex = 0
            foreach ($color in $colorValues) {
                foreach ($size in $sizeValues) {
                    if ($variantIndex -lt 5) {
                        $variants += @{
                            sku = "TSHIRT-$($color.value)-$($size.value)-$U"
                            price = 1500
                            discount_price = 2000
                            stock_quantity = 20
                            weight = 0.2
                            is_active = $true
                            sort_order = $variantIndex
                            option_values = @($color.id, $size.id)
                            image_urls = @("https://example.com/tshirt-$($color.value.ToLower()).jpg")
                        }
                        $variantIndex++
                    }
                }
            }
            
            # Update product with variants
            $updateBody = @{
                variants = $variants
            } | ConvertTo-Json -Depth 10
            
            $updateResult = Test-API "Update Product with Variants" "PUT" "$BaseUrl/admin/products/$varProductId" $updateBody $authHeaders
            if ($updateResult) {
                Write-Host "  Variants Created: $($updateResult.data.variants.Count)" -ForegroundColor DarkGray
            }
        }
    }
}

# --- 6. Product Reading APIs ---
Write-Host ""
Write-Host "--- 6. Product Reading ---" -ForegroundColor Cyan

Test-API "List Products (Public)" "GET" "$BaseUrl/products"
Test-API "Get Featured Products" "GET" "$BaseUrl/products/featured"
Test-API "Search Products" "GET" "$BaseUrl/products/search?q=iphone"
Test-API "Admin List Products" "GET" "$BaseUrl/admin/products" "" $authHeaders

if ($productSlug) {
    $slugResult = Test-API "Get Product by Slug" "GET" "$BaseUrl/products/$productSlug"
}
if ($varProductSlug) {
    $varSlugResult = Test-API "Get Variable Product by Slug" "GET" "$BaseUrl/products/$varProductSlug"
    if ($varSlugResult) {
        Write-Host "  -> Option Groups: $($varSlugResult.data.option_groups.Count), Variants: $($varSlugResult.data.variants.Count)" -ForegroundColor DarkGray
    }
}
if ($productId) {
    Test-API "Get Product by ID (Admin)" "GET" "$BaseUrl/admin/products/$productId" "" $authHeaders
    Test-API "Get Related Products" "GET" "$BaseUrl/products/$productSlug/related"
}

# --- 7. Cart (Guest) ---
Write-Host ""
Write-Host "--- 7. Cart (Guest Session) ---" -ForegroundColor Cyan

$sessionId = [guid]::NewGuid().ToString()
$sessionHeaders = @{ "X-Session-ID" = $sessionId }

if ($productId) {
    $cartBody = "{`"product_id`":`"$productId`",`"quantity`":2}"
    $cartResult = Test-API "Add to Cart (Guest)" "POST" "$BaseUrl/cart/items" $cartBody $sessionHeaders
    $cartItemId = ""
    if ($cartResult) { $cartItemId = $cartResult.data.id }
    
    # Get cart
    Test-API "Get Cart (Guest)" "GET" "$BaseUrl/cart" "" $sessionHeaders
    
    # Update cart item
    if ($cartItemId) {
        $updateCartBody = '{"quantity":3}'
        Test-API "Update Cart Item" "PUT" "$BaseUrl/cart/items/$cartItemId" $updateCartBody $sessionHeaders
    }
    
    # Add another product
    if ($productId2) {
        $cartBody2 = "{`"product_id`":`"$productId2`",`"quantity`":1}"
        Test-API "Add Second Item to Cart" "POST" "$BaseUrl/cart/items" $cartBody2 $sessionHeaders
    }
    
    Test-API "Get Cart (with 2 items)" "GET" "$BaseUrl/cart" "" $sessionHeaders
}

# --- 8. Cart (Authenticated) ---
Write-Host ""
Write-Host "--- 8. Cart (Authenticated User) ---" -ForegroundColor Cyan

if ($userToken -and $productId) {
    $userAuthHeaders = @{ "Authorization" = "Bearer $userToken" }
    
    $cartBody = "{`"product_id`":`"$productId`",`"quantity`":1}"
    Test-API "Add to Cart (User)" "POST" "$BaseUrl/cart/items" $cartBody $userAuthHeaders
    Test-API "Get Cart (User)" "GET" "$BaseUrl/cart" "" $userAuthHeaders
}

# --- 9. Addresses ---
Write-Host ""
Write-Host "--- 9. Addresses ---" -ForegroundColor Cyan

# Create address with session
$addrBody = '{"full_name":"Test Guest","phone":"01712345678","address_line1":"123 Main St","address_line2":"Apt 4B","city":"Dhaka","district":"Dhaka","postal_code":"1205","is_default":true}'
$addrResult = Test-API "Create Address (Guest)" "POST" "$BaseUrl/addresses" $addrBody $sessionHeaders
$addressId = ""
if ($addrResult) { $addressId = $addrResult.data.id }

# Create address with auth
if ($userToken) {
    $userAuthHeaders = @{ "Authorization" = "Bearer $userToken" }
    $addrResult2 = Test-API "Create Address (User)" "POST" "$BaseUrl/addresses" $addrBody $userAuthHeaders
    $userAddressId = ""
    if ($addrResult2) { $userAddressId = $addrResult2.data.id }
    
    Test-API "Get User Addresses" "GET" "$BaseUrl/addresses" "" $userAuthHeaders
}

# --- 10. Orders (Guest Checkout) ---
Write-Host ""
Write-Host "--- 10. Orders (Guest Checkout) ---" -ForegroundColor Cyan

if ($addressId -and $productId) {
    $orderBody = @{
        guest_email = "guest$U@test.com"
        guest_phone = "017000$U"
        shipping_address_id = $addressId
        payment_method = "cod"
        notes = "Test guest order"
    } | ConvertTo-Json
    
    $orderResult = Test-API "Create Order (Guest)" "POST" "$BaseUrl/orders" $orderBody $sessionHeaders
    $orderId = ""
    $orderNumber = ""
    if ($orderResult) {
        $orderId = $orderResult.data.id
        $orderNumber = $orderResult.data.order_number
        Write-Host "  Order ID: $orderId" -ForegroundColor DarkGray
        Write-Host "  Order Number: $orderNumber" -ForegroundColor DarkGray
    }
    
    # Track order by number
    if ($orderNumber) {
        Test-API "Track Order" "GET" "$BaseUrl/orders/track/$orderNumber"
    }
}

# --- 11. Orders (User Checkout) ---
Write-Host ""
Write-Host "--- 11. Orders (User Checkout) ---" -ForegroundColor Cyan

if ($userToken -and $userAddressId -and $productId) {
    $userAuthHeaders = @{ "Authorization" = "Bearer $userToken" }
    
    # Add product to user cart first
    $cartBody = "{`"product_id`":`"$productId`",`"quantity`":1}"
    Test-API "Add to Cart for Order" "POST" "$BaseUrl/cart/items" $cartBody $userAuthHeaders
    
    $userOrderBody = @{
        shipping_address_id = $userAddressId
        payment_method = "cod"
        notes = "Test user order"
    } | ConvertTo-Json
    
    $userOrderResult = Test-API "Create Order (User)" "POST" "$BaseUrl/orders" $userOrderBody $userAuthHeaders
    $userOrderId = ""
    if ($userOrderResult) {
        $userOrderId = $userOrderResult.data.id
    }
    
    Test-API "Get User Orders" "GET" "$BaseUrl/orders" "" $userAuthHeaders
    if ($userOrderId) {
        Test-API "Get Order by ID" "GET" "$BaseUrl/orders/$userOrderId" "" $userAuthHeaders
    }
}

# --- 12. Admin Order Management ---
Write-Host ""
Write-Host "--- 12. Admin Order Management ---" -ForegroundColor Cyan

Test-API "Admin List Orders" "GET" "$BaseUrl/admin/orders" "" $authHeaders
if ($orderId) {
    Test-API "Admin Get Order" "GET" "$BaseUrl/admin/orders/$orderId" "" $authHeaders
    $statusBody = '{"status":"confirmed"}'
    Test-API "Admin Update Order Status" "PUT" "$BaseUrl/admin/orders/$orderId/status" $statusBody $authHeaders
}

# --- 13. Dashboard ---
Write-Host ""
Write-Host "--- 13. Admin Dashboard ---" -ForegroundColor Cyan
$dashResult = Test-API "Get Dashboard Stats" "GET" "$BaseUrl/admin/dashboard" "" $authHeaders
if ($dashResult) {
    Write-Host "  Total Orders: $($dashResult.data.total_orders), Revenue: $($dashResult.data.total_revenue)" -ForegroundColor DarkGray
}

# --- 14. Coupons ---
Write-Host ""
Write-Host "--- 14. Coupons ---" -ForegroundColor Cyan

$couponBody = @{
    code = "SAVE10$U"
    type = "percentage"
    value = 10
    min_order_amount = 500
    max_discount = 5000
    usage_limit = 100
    valid_from = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    valid_to = (Get-Date).AddDays(30).ToString("yyyy-MM-ddTHH:mm:ssZ")
    is_active = $true
} | ConvertTo-Json

$couponResult = Test-API "Create Coupon" "POST" "$BaseUrl/admin/coupons" $couponBody $authHeaders
$couponId = ""
if ($couponResult) { $couponId = $couponResult.data.id }

Test-API "List Coupons" "GET" "$BaseUrl/admin/coupons" "" $authHeaders

$validateBody = '{"code":"SAVE10' + $U + '","order_total":"5000"}'
Test-API "Validate Coupon" "POST" "$BaseUrl/coupons/validate" $validateBody $sessionHeaders

# --- 15. Reviews ---
Write-Host ""
Write-Host "--- 15. Reviews ---" -ForegroundColor Cyan

if ($userToken -and $productId) {
    $userAuthHeaders = @{ "Authorization" = "Bearer $userToken" }
    $reviewBody = @{
        product_id = $productId
        rating = 5
        title = "Amazing phone!"
        comment = "Best phone I have ever used. Highly recommended."
    } | ConvertTo-Json
    
    Test-API "Create Review" "POST" "$BaseUrl/reviews" $reviewBody $userAuthHeaders
    Test-API "Get Product Reviews" "GET" "$BaseUrl/reviews/product/$productId"
    Test-API "Get Review Summary" "GET" "$BaseUrl/reviews/product/$productId/summary"
}

# --- 16. Wishlist ---
Write-Host ""
Write-Host "--- 16. Wishlist ---" -ForegroundColor Cyan

if ($userToken -and $productId) {
    $userAuthHeaders = @{ "Authorization" = "Bearer $userToken" }
    $wishBody = "{`"product_id`":`"$productId`"}"
    Test-API "Add to Wishlist" "POST" "$BaseUrl/wishlist/items" $wishBody $userAuthHeaders
    Test-API "Get Wishlist" "GET" "$BaseUrl/wishlist" "" $userAuthHeaders
    if ($productId2) {
        $wishBody2 = "{`"product_id`":`"$productId2`"}"
        Test-API "Add Second to Wishlist" "POST" "$BaseUrl/wishlist/items" $wishBody2 $userAuthHeaders
    }
    Test-API "Remove from Wishlist" "DELETE" "$BaseUrl/wishlist/items/$productId" "" $userAuthHeaders
    Test-API "Get Wishlist (after remove)" "GET" "$BaseUrl/wishlist" "" $userAuthHeaders
}

# --- 17. Admin Users ---
Write-Host ""
Write-Host "--- 17. Admin Users ---" -ForegroundColor Cyan
Test-API "Admin List Users" "GET" "$BaseUrl/admin/users" "" $authHeaders

# --- 18. Product Update & Delete ---
Write-Host ""
Write-Host "--- 18. Product Update & Delete ---" -ForegroundColor Cyan

if ($productId2) {
    $updateBody = '{"name":"Samsung Galaxy S24 Ultra ' + $U + '","price":139999,"is_featured":false}'
    Test-API "Update Product" "PUT" "$BaseUrl/admin/products/$productId2" $updateBody $authHeaders
}

# --- 19. Payments ---
Write-Host ""
Write-Host "--- 19. Payments ---" -ForegroundColor Cyan
Test-API "Admin List Payments" "GET" "$BaseUrl/admin/payments" "" $authHeaders

# --- Summary ---
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Test Suite Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

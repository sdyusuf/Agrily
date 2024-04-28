# Agrily REST API Specification & Endpoint Documentation

This document provides complete reference documentation for all public, authenticated, and administrative HTTP endpoints exposed by the Agrily REST API (`v1`).

---

## Global API Conventions

- **Base URL:** `http://localhost:5000/api` (or `/api` when accessed via the Nginx reverse proxy)
- **Content-Type:** `application/json` (except multipart file upload endpoints which use `multipart/form-data`)
- **Authentication:** `Authorization: Bearer <jwt_token>` header required for protected routes
- **Security Headers:** All responses include OWASP-recommended Helmet HTTP headers
- **Rate Limits:** 100 requests per 15-minute sliding window on authentication routes

---

## 1. Authentication & Identity Endpoints

### 1.1 User Registration
- **Endpoint:** `POST /api/signup`
- **Access:** Public (Rate Limited)
- **Description:** Registers a new agricultural producer or commercial buyer account.
- **Request Body:**
```json
{
  "email": "farmer.kwame@agrily.com",
  "password": "SecurePassword123!",
  "fullName": "Kwame Mensah"
}
```
- **Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "User registered successfully! Please check your email for verification."
}
```
- **Error Codes:** `400 Bad Request` (validation failure), `409 Conflict` (email already exists).

---

### 1.2 User Login
- **Endpoint:** `POST /api/login`
- **Access:** Public (Rate Limited)
- **Description:** Authenticates user credentials and issues a signed JWT token.
- **Request Body:**
```json
{
  "email": "farmer.kwame@agrily.com",
  "password": "SecurePassword123!"
}
```
- **Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
- **Error Codes:** `400 Bad Request` (missing fields), `401 Unauthorized` (invalid credentials).

---

### 1.3 Verify Email Address
- **Endpoint:** `PUT /verify`
- **Access:** Public (Rate Limited)
- **Description:** Validates an email confirmation code and marks the account as verified.
- **Request Body:**
```json
{
  "verificationString": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```
- **Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Email verified successfully!"
}
```

---

## 2. Farmer & User Profile Endpoints

### 2.1 Get Farmer Public Profile
- **Endpoint:** `GET /api/users/profile/:email`
- **Access:** Public
- **Description:** Retrieves public farmer credentials, trust score, farm size, and location coordinates.
- **Response (200 OK):**
```json
{
  "fullName": "Kwame Mensah",
  "email": "farmer.kwame@agrily.com",
  "farmProfile": {
    "farmName": "Golden Valley Organic Farm",
    "location": "Sunyani, Bono Region",
    "coordinates": { "lat": 7.3399, "lng": -2.3268 },
    "hectares": 12.5,
    "establishedYear": 2018,
    "primaryCrops": ["Maize", "Cassava", "Yam"],
    "bio": "Certified organic grain and tuber farm operating with climate-smart irrigation.",
    "verificationStatus": "verified",
    "trustScore": 94
  }
}
```

---

### 2.2 Update Farm Profile
- **Endpoint:** `PUT /api/users/profile`
- **Access:** Authenticated (`Authorization: Bearer <token>`)
- **Description:** Updates the authenticated farmer's agronomic profile and farm metadata.
- **Request Body:**
```json
{
  "email": "farmer.kwame@agrily.com",
  "farmName": "Golden Valley Organic Farm",
  "location": "Sunyani, Bono Region",
  "coordinates": { "lat": 7.3399, "lng": -2.3268 },
  "hectares": 15.0,
  "establishedYear": 2018,
  "primaryCrops": ["Maize", "Cassava", "Yam", "Soybeans"],
  "bio": "Certified organic grain and tuber farm expanding into regenerative soil management."
}
```
- **Response (200 OK):**
```json
{
  "message": "Farm profile updated successfully!",
  "profile": { ... }
}
```

---

## 3. Categories & Agricultural Taxonomy

### 3.1 Get Produce Categories
- **Endpoint:** `GET /api/categories`
- **Access:** Public
- **Description:** Returns the standard taxonomy of agricultural produce categories and recommended measurement units.
- **Response (200 OK):**
```json
[
  {
    "id": "grains",
    "label": "Grains & Cereals",
    "icon": "wheat",
    "description": "Maize, rice, millet, sorghum, and other cereal grains",
    "recommendedUnits": ["bag", "kg", "ton"]
  },
  {
    "id": "tubers",
    "label": "Tubers & Roots",
    "icon": "root",
    "description": "Yam, cassava, sweet potatoes, cocoyam, and Irish potatoes",
    "recommendedUnits": ["bag", "ton", "piece"]
  }
]
```

---

## 4. Produce Inventory & Marketplace Endpoints

### 4.1 Browse Marketplace Listings
- **Endpoint:** `GET /api/marketplace`
- **Access:** Public
- **Query Parameters:**
  - `page` (integer, default: 1)
  - `limit` (integer, default: 12)
  - `search` (string, optional)
  - `category` (string, optional: `grains`, `tubers`, `fruits`, `vegetables`, etc.)
  - `minPrice` (number, optional)
  - `maxPrice` (number, optional)
  - `unit` (string, optional: `kg`, `bag`, `ton`, `crate`)
- **Response (200 OK):**
```json
{
  "products": [
    {
      "_id": "6614a8f9c2d1e001a1b2c3d4",
      "name": "White Maize (Grade 1)",
      "category": "grains",
      "unit": "bag",
      "quantity": 150,
      "minOrderQuantity": 5,
      "price": 42.50,
      "imageUrl": "http://localhost:5000/images/maize_1712654400.jpg",
      "ownerEmail": "farmer.kwame@agrily.com",
      "harvestDate": "2024-03-25T00:00:00.000Z"
    }
  ],
  "total": 48,
  "page": 1,
  "totalPages": 4
}
```

---

### 4.2 Create Produce Listing
- **Endpoint:** `POST /api/product`
- **Access:** Authenticated (`Authorization: Bearer <token>`)
- **Content-Type:** `multipart/form-data`
- **Form Fields:**
  - `name` (string, required): Produce title
  - `category` (string, required): Category slug
  - `unit` (string, required): Unit of measure
  - `quantity` (number, required): Available harvest stock
  - `minOrderQuantity` (number, optional, default: 1): Minimum order threshold
  - `price` (number, required): Unit price in platform currency
  - `harvestDate` (ISO date string, optional)
  - `description` (string, optional)
  - `image` (file, optional): JPEG/PNG/WebP image (max 5MB)
- **Response (201 Created):**
```json
{
  "message": "Product listing created successfully!",
  "product": { ... }
}
```

---

### 4.3 Update Produce Listing
- **Endpoint:** `PUT /api/product/:id`
- **Access:** Authenticated (Owner Only)
- **Content-Type:** `multipart/form-data`
- **Description:** Updates produce attributes and optionally replaces listing photo.
- **Response (200 OK):**
```json
{
  "message": "Product listing updated successfully!",
  "product": { ... }
}
```

---

### 4.4 Delete Produce Listing
- **Endpoint:** `DELETE /api/product/:id`
- **Access:** Authenticated (Owner Only)
- **Description:** Deletes a produce item from the marketplace catalog.
- **Response (200 OK):**
```json
{
  "message": "Product deleted successfully!"
}
```

---

## 5. Orders & Logistics Lifecycle Endpoints

### 5.1 Create Procurement Order
- **Endpoint:** `POST /api/orders`
- **Access:** Public or Authenticated
- **Description:** Submits a batch purchase order for produce line items across one or multiple farmers.
- **Request Body:**
```json
{
  "buyerEmail": "buyer.procurement@agrihub.com",
  "buyerName": "Ama Asantewaa",
  "buyerPhone": "+233241234567",
  "deliveryAddress": {
    "street": "45 Independence Avenue",
    "city": "Accra",
    "state": "Greater Accra",
    "country": "Ghana",
    "postalCode": "GA-183-9022"
  },
  "items": [
    {
      "productId": "6614a8f9c2d1e001a1b2c3d4",
      "name": "White Maize (Grade 1)",
      "category": "grains",
      "unit": "bag",
      "quantity": 20,
      "price": 42.50,
      "ownerEmail": "farmer.kwame@agrily.com"
    }
  ],
  "paymentMethod": "escrow",
  "notes": "Please deliver to warehouse loading bay 2."
}
```
- **Response (201 Created):**
```json
{
  "message": "Order placed successfully!",
  "order": {
    "_id": "6614bb22c2d1e001a1b2c3e5",
    "status": "pending",
    "subtotal": 850.00,
    "logisticsFee": 55.00,
    "totalAmount": 905.00,
    "createdAt": "2024-04-18T10:15:30.000Z"
  }
}
```

---

### 5.2 Transition Order Status
- **Endpoint:** `PATCH /api/orders/:id/status`
- **Access:** Authenticated (Farmer or Logistics Officer)
- **Description:** Updates the lifecycle state of an order following strict validation rules.
- **Permitted Transitions:**
  - `pending` -> `confirmed` or `cancelled`
  - `confirmed` -> `dispatched` or `cancelled`
  - `dispatched` -> `in_transit`
  - `in_transit` -> `delivered` or `disputed`
  - `delivered` -> `settled`
- **Request Body:**
```json
{
  "status": "dispatched",
  "notes": "Loaded onto truck registration GT-4820-22"
}
```
- **Response (200 OK):**
```json
{
  "message": "Order status updated to dispatched",
  "order": { ... }
}
```

---

## 6. Agricultural Revenue & Analytics Endpoints

### 6.1 Get Farmer Sales Metrics
- **Endpoint:** `GET /api/analytics/farmer/:email`
- **Access:** Public or Authenticated
- **Description:** Computes aggregated gross earnings, pending escrow balances, settled payouts, and sales distribution by produce category.
- **Response (200 OK):**
```json
{
  "totalOrders": 18,
  "grossRevenue": 14250.00,
  "settledRevenue": 11800.00,
  "pendingRevenue": 2450.00,
  "volumeByCrop": {
    "grains": { "totalQuantity": 280, "unit": "bag", "revenue": 11900.00 },
    "tubers": { "totalQuantity": 45, "unit": "bag", "revenue": 2350.00 }
  }
}
```

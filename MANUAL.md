# Smart ERP — User Manual

## Table of Contents
1. [Login & Access](#1-login--access)
2. [Dashboard](#2-dashboard)
3. [POS Terminal](#3-pos-terminal)
4. [Inventory Management](#4-inventory-management)
5. [Purchases](#5-purchases)
6. [Sales](#6-sales)
7. [Customers](#7-customers)
8. [Gallery](#8-gallery)
9. [Reports](#9-reports)
10. [Web Store](#10-web-store)
11. [Admin](#11-admin)

---

## 1. Login & Access

**URL:** `http://localhost:3000`

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@smart.com | Admin123! |
| Branch Manager | manager@smart.com | Manager123! |
| Sales Person | sales@smart.com | Sales123! |

- After login, you are redirected to the **Dashboard**
- Click **View Website** in the header to visit the public storefront
- Click your name in the top-right to logout

---

## 2. Dashboard

The dashboard shows:
- **Total Products** — active product count
- **Today's Sales** — POS + online sales for today
- **Low Stock Items** — products below minimum stock threshold
- **Pending Orders** — web orders not yet fulfilled
- **Recent Activity** — latest transactions

---

## 3. POS Terminal

**Path:** `POS Terminal` in sidebar

### Making a Sale

1. **Select Customer** (optional) — type to search existing customers. Walk-in sales are allowed but walk-in customers **cannot** have due amounts (must pay full).
2. **Add Products** — click "Add Item", search by name/SKU, select product, enter quantity
3. **Bulk Discounts** — automatically applied if quantity meets discount rules
4. **Remove Items** — click the trash icon on any cart item
5. **Hold Order** — saves the cart to resume later
6. **New Order** — clears current cart
7. **Checkout** — select payment method:
   - **Cash** — full payment upfront
   - **Credit** — for registered customers only (adds due amount)
   - **Partial** — enter cash amount, remainder becomes due
8. **Confirm** — processes sale, deducts stock, generates invoice

### Keyboard Shortcut
- Press `Ctrl+Enter` to quick checkout (if all items valid)

---

## 4. Inventory Management

### 4.1 Products

**Path:** `Inventory → Products`

**Adding a Product:**
1. Click **Add Product**
2. Fill in: Category, Brand, Product Name, SKU (auto-generated if empty)
3. Set Size, Unit/Variant, Storage Location
4. Upload product image (from computer or gallery)
5. Set Min Stock Alert threshold
6. Click **Save**

**Editing:** Click the pencil icon on any product row

**Image Upload:**
- **Upload** — pick a file from your computer (stored in gallery bucket)
- **Gallery Icon** — pick an existing image from the gallery

### 4.2 Categories

**Path:** `Inventory → Categories`

- View all categories with active/inactive status
- **Add Category** — enter name, optionally set a parent category
- **Edit** — click pencil icon
- **Delete** — click trash icon (confirm required)
- Categories are used in Products, POS, Discount Rules, and Purchase Entry

### 4.3 Brands

**Path:** `Inventory → Brands`

- Same operations as Categories
- Brands are assigned to products

### 4.4 Stock Journal

**Path:** `Inventory → Stock Journal`

- View all stock movements (purchases, sales, adjustments, damages, returns)
- Shows: Product, Movement Type, Quantity Change, Running Balance, Reference, Date

### 4.5 Damages

**Path:** `Inventory → Damages`

**Recording a Damage:**
1. Click **Record Damage**
2. Select Product from dropdown
3. Enter Quantity damaged
4. Enter Reason (e.g. "Water damage", "Expired")
5. Click **Save**
6. Stock is automatically deducted and logged in stock journal

---

## 5. Purchases

### 5.1 New Purchase

**Path:** `Purchases → New Purchase`

**Steps:**
1. **Purchase No.** — auto-generated
2. **Memo No.** — optional supplier reference
3. **Purchase Date** — defaults to today
4. **Payment Type** — Cash / Credit / Partial
5. **Supplier** — select from dropdown, or click **+** to add new supplier
6. **Add Items:**
   - Click **Add Item**
   - Filter by Category and Brand (optional)
   - Search existing products by name/SKU
   - Or click **+** next to Product to create a new product (with image upload)
   - Enter Size, Unit, Storage Location
   - Enter Quantity and Purchase Price
   - Sell Price Ratio auto-calculates selling price
   - Click **Add to Purchase**
7. **Save Purchase & Update Stock** — creates purchase record, deducts stock, updates product cost/selling prices

### 5.2 Purchase History

**Path:** `Purchases → Purchase History`

- View all purchases with Invoice #, Date, Supplier, Payment Type, Total
- Click any row or **View** button to see item details:
  - Product name, SKU, Size, Unit, Location
  - Quantity, Cost Price, Line Total

### 5.3 Suppliers

**Path:** `Purchases → Suppliers`

- View all suppliers with name, company, phone
- **Add Supplier** — enter name, company, phone, email, address
- **Edit/Delete** existing suppliers

---

## 6. Sales

### 6.1 POS Invoices

**Path:** `Sales → POS Invoices`

- View all POS invoices with Invoice #, Date, Customer, Payment Status, Total
- Click **View** to see:
  - Customer info, payment breakdown (cash paid, due amount)
  - Original items purchased
  - **Returned items** (shown in red, with return date and reason)

### 6.2 Online Orders

**Path:** `Sales → Online Orders`

- View all web orders with Order #, Customer, Phone, Payment, Total, Status
- Click **View** to see:
  - Customer shipping info
  - Courier service and payment method
  - **Product names** (from order items)
  - Items table with quantities and prices

### 6.3 Returns

**Path:** `Sales → Returns`

**Recording a Return:**
1. Click **Record Return**
2. Select **Source** — POS Invoice or Web Order
3. Select Invoice/Order from dropdown (fully returned invoices are hidden)
4. Products from that invoice load automatically
5. Enter **Return Quantity** for each product (cannot exceed original quantity)
6. Enter **Reason** (e.g. "Defective", "Wrong size")
7. Click **Save Return**
8. Stock is automatically added back
9. Invoice/Order total, paid amount, and due amount are recalculated
10. Payment status updates (Cash → Partial Due → Due)

---

## 7. Customers

### 7.1 All Customers

**Path:** `Customers → All Customers`

- View all customers with name, phone, email, address
- **Add Customer** — enter details
- **Edit/Delete** existing customers

### 7.2 Due Ledger

**Path:** `Customers → Due Ledger`

- View all customers with outstanding dues
- Shows: Customer, Total Invoiced, Total Paid, Due Amount
- Filter by customer name
- Only shows invoices with due_amount > 0

---

## 8. Gallery

**Path:** `Gallery`

- **Upload Images** — click upload area or drag & drop
- **Grid/List View** — toggle between grid and list layout
- **Preview** — click any image to view full size
- **Copy URL** — copy image URL to clipboard
- **Delete** — remove image from gallery

**Image Editor:** `Gallery → Edit Image`
- Upload an image to edit
- **Background Removal** — remove image background
- **Resize** — adjust dimensions
- **Color Picker** — pick colors from image
- **Print Layout** — format for printing

---

## 9. Reports

### 9.1 Sales Report

**Path:** `Reports → Sales Report`

- **Date Filter** — select From/To dates, click Filter
- Shows:
  - Total Sales (POS + Online)
  - POS Sales, Online Sales, Total Orders
  - Cash vs Credit breakdown

### 9.2 Inventory Movement

**Path:** `Reports → Inventory Movement`

- View stock movements for any product
- Filter by product
- Shows: Date, Type, Quantity In/Out, Balance, Reference

### 9.3 Customer Due Report

**Path:** `Reports → Customer Due`

- View customers with outstanding dues
- Shows: Customer, Invoice #, Date, Total, Paid, Due

---

## 10. Web Store

### 10.1 Storefront Pages

- **Home** (`/`) — Hero banner, golden title, features section
- **Shop** (`/shop`) — Product grid with search and category filter
- **Product Detail** (`/product/[id]`) — Full product info, Add to Cart
- **Cart** (`/cart`) — View cart items with serial numbers, subtotal, bulk discount, total
- **Checkout** (`/checkout`) — Shipping form, courier service, payment method, place order
- **Order Confirmation** (`/checkout/confirmation`) — Order summary after placement
- **About** (`/about`) — Company info
- **Contact** (`/contact`) — Contact form

### 10.2 Web Store Settings

**Path:** `Web Store → Settings`

**5 Tabs:**
1. **Hero** — Banner image, title, subtitle
2. **Features** — Feature cards
3. **Products** — Featured products
4. **About** — Company description
5. **Contact** — Contact info, social links

Each tab has a **Gallery Picker** to select images from the gallery.

### 10.3 Page Sections

**Path:** `Web Store → Page Sections`

- Edit content sections for storefront pages
- Changes reflect on the public website

---

## 11. Admin

### 11.1 Users

**Path:** `Admin → Users`

- View all users with name, email, role, status
- **Add User** — enter details, assign role
- **Edit/Delete** users

### 11.2 Roles & Permissions

**Path:** `Admin → Roles & Permissions`

- Manage user roles and their permissions
- Roles: Sales Person, Branch Manager, Super Admin

### 11.3 Bulk Discount Rules

**Path:** `Admin → Bulk Discount Rules`

**Adding a Rule:**
1. Click **Add Rule**
2. Select **Category** from dropdown (pulled from categories table)
3. Select **Item Name** — defaults to "ALL" (applies to all items in category), or select specific product
4. Enter **Min Quantity** — minimum units to trigger discount
5. Enter **Discount Percent**
6. Click **Create**

**Example:** Category = Perfume, Item = ALL, Min Qty = 5, Discount = 10%
→ Buying 5+ perfumes gives 10% off

### 11.4 Stock Alert Rules

**Path:** `Admin → Stock Alert Rules`

**Adding a Rule:**
1. Click **Add Rule**
2. Enter **Name** (e.g. "Low Stock Warning", "Critical Items")
3. Enter **Threshold** — stock level that triggers alert
4. Enter **Notify Email** — where to send alert
5. Click **Create**

### 11.5 Audit Log

**Path:** `Admin → Audit Log`

- View system activity trail
- Columns: User, Action (INSERT/UPDATE/DELETE), Table, Record ID, Time
- Tracks changes to: Products, Sales Invoices, Web Orders, Purchases, Customers, Suppliers
- Searchable by user email

---

## Key Features Summary

| Feature | Description |
|---------|-------------|
| **POS** | Split-layout terminal with cart, customer lookup, bulk discounts, stock deduction |
| **Walk-in Sales** | No customer required, must pay full amount |
| **Bulk Discounts** | Automatic quantity-based discounts per category/item |
| **Stock Management** | Auto-deduct on sales, auto-add on purchases/returns, stock journal tracking |
| **Returns** | POS and web order returns, stock restored, invoice totals recalculated |
| **Damages** | Record damaged stock, auto-deduct from inventory |
| **Purchase Entry** | Supplier management, product creation inline, cost/sell price ratio |
| **Gallery** | Upload, manage, pick images for products and web store |
| **Web Store** | Full e-commerce: shop, cart, checkout, order tracking |
| **Audit Log** | Track all database changes for accountability |
| **Reports** | Sales, inventory movement, customer due reports with date filters |

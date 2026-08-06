# Smart ERP — User Manual

**Maruf Enterprise · Feni Garden City**

This manual explains how to use every part of the software — from logging in to managing products, sales, purchases, money, and your online store.

---

## Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard](#2-dashboard)
3. [Products & Inventory](#3-products--inventory)
4. [Add/Remove](#4-addremove)
5. [Purchases](#5-purchases)
6. [POS Terminal (Counter Sales)](#6-pos-terminal-counter-sales)
7. [Sales](#7-sales)
8. [Customers](#8-customers)
9. [Accounts & Money](#9-accounts--money)
10. [Web Store (Online Shop)](#10-web-store-online-shop)
11. [Gallery](#11-gallery)
12. [Reports](#12-reports)
13. [Admin](#13-admin)
14. [Using the Software on Mobile](#14-using-the-software-on-mobile)
15. [Frequently Asked Questions](#15-frequently-asked-questions)

---

## 1. Getting Started

### 1.1 Logging In
1. Open your website URL (e.g. `https://easy-solution.vercel.app`) in a browser.
2. Click **Login** (top-right).
3. Enter your **email** and **password** (created by the admin/owner).
4. After login you land on the **Dashboard**.

> Tip: If you forget your password, contact the system admin. Password reset can be enabled through Supabase Auth.

### 1.2 Understanding the Screen
- **Sidebar (left):** all modules. Click a menu name to expand its submenu.
- **Top bar:** your name/role, notifications, **View Website** (opens your online shop), and a menu button on mobile.
- **Main area:** the page you selected.

---

## 2. Dashboard

The home page shows:
- Welcome message with your name.
- Your **role**, **username**, **nickname**, and **status**.
- **Quick Start** links to common tasks (add products, open POS, store settings, manage users).

---

## 3. Products & Inventory

**Menu:** Inventory → Display Products

This is your product list. Columns:
| Column | Meaning |
|---|---|
| Image | Product photo. Click it to **change the image** (upload or pick from gallery). |
| Product | Product name. |
| SKU | Unique code for the product. |
| Size / Unit | e.g. size `XL`, unit `pcs`. |
| Location | Storage location (e.g. Self). |
| P Price | Purchase/cost price (what you pay). |
| S Ratio | **Sales ratio** (how many times cost you sell for). Default is **1**. |
| S Price | Selling price. |
| Stock | Current stock level. Turns orange when low. |

### 3.1 Setting the Selling Price using S Ratio
S Ratio is the **main price control**:

- Type a ratio in the **S Ratio** box (default `1`).
- Press **Enter** or click away.
- The **S Price automatically becomes Cost Price × Ratio**.

Examples:
- Cost ৳1,000, ratio `1.5` → Selling price ৳1,500.
- Cost ৳500, ratio `2` → Selling price ৳1,000.
- Ratio `1` → Selling price equals cost.

### 3.2 Changing a Product Photo
1. Click the small image (or photo placeholder) next to the product name.
2. Either **Upload New** (choose a file from your phone/computer) or **pick an image from the Gallery**.
3. The photo updates immediately and also appears on your online store.

### 3.3 Viewing Purchase History of a Product
Click the **eye icon** next to the SKU to show the purchase invoice numbers for that product. Click again to hide.

### 3.4 Stock Journal / Damages
- **Stock Journal:** see every stock movement (sales, purchases, adjustments).
- **Damages:** record damaged/expired products.

---

## 4. Add/Remove

**Menu:** Add/Remove → Suppliers / Categories / Brands / Products / Sizes / Units

This is the fastest way to build your master data.

### 4.1 Adding a Product
1. Go to **Add/Remove → Products**.
2. Click **Add Product**.
3. Fill in:
   - **Category** (required)
   - **Brand** (required)
   - **Product Name** (required)
   - **SKU** (leave blank to auto-generate)
   - **Product Image** (optional — click to upload, preview shown)
4. Click **Add Product**. The new product appears in the list with its photo.
5. Set its prices later under **Inventory → Display Products** using the S Ratio.

### 4.2 Removing a Product
In the Products list, click the **trash icon**. Confirm the delete. This cannot be undone.

> Note: other Add/Remove pages (Suppliers, Categories, Brands, Sizes, Units) work the same way — add a new record or delete an existing one.

---

## 5. Purchases

**Menu:** Purchases → New Purchase / History / Suppliers / Supplier Ledger

### 5.1 New Purchase (buying stock from a supplier)
1. Choose a **Supplier** (or add one with the + button).
2. Purchase No. is auto-filled. Add a **Memo No.** (supplier's reference) if you like.
3. Pick the **Purchase Date**.
4. Choose **Payment Type**:
   - **Cash** — you paid everything today.
   - **Credit / Due** — you will pay later.
   - **Cash + Credit** — paid part now, rest later (enter both amounts).
5. Click **Add Item** to add products:
   - Search/select a product, enter **quantity**, **unit cost**, and **selling price**.
6. The table shows all items; use the **pencil** to edit or **trash** to remove.
7. Grand Total updates automatically.
8. Click **Save Purchase**. Stock increases automatically.

### 5.2 Purchase History
List of all purchases. Shows date, purchase no., supplier, amount, paid, due, and payment type.

### 5.3 Supplier Ledger
This is the **money you owe each supplier**.
1. Search a supplier by **name or phone**.
2. See three summary cards: **Total Purchases**, **Total Paid**, **Current Due**.
3. **Purchase History** — every purchase with its due.
4. **Payment History** — every payment you made (date, purchase no., amount, mode, remarks).

### 5.4 Paying a Supplier (making due payments)
Use the **Cash Register → Money Out → Supplier Due Paid** (see [section 9](#9-accounts--money)). It records the payment and clears the supplier's due.

---

## 6. POS Terminal (Counter Sales)

**Menu:** POS (use for quick counter selling)

### 6.1 On a Computer
- **Left side:** product grid with photo, name, and price. Use **Category** and **Brand** dropdowns, then the **Search** box to find a product fast.
- **Right side:** the cart panel.

### 6.2 On a Mobile/Tablet
- Product grid fills the screen.
- Tap the **View Cart (n)** button to open the cart as a bottom drawer.
- Tap the **X** to close it and keep adding products.

### 6.3 Making a Sale
1. Tap/click products to add them to the cart.
2. In the cart, adjust **quantity** with + / − or remove items.
3. Enter the **customer's mobile number** — the system finds the customer and shows their **previous due** (if any).
4. Bulk discounts apply automatically (based on your rules in Admin → Discount Rules).
5. Add a **manual discount** if needed.
6. Enter the **paid amount**. If it is less than the total, the rest becomes **due** for that customer.
   - Walk-in (no customer selected) customers **cannot** get due — they must pay in full.
7. Add **notes** if needed, then click **Place Order**.
8. Stock is reduced and a sale invoice is created automatically.

### 6.4 Hold / Recall an Order
- **Hold** — saves the current cart and clears the screen (customer is still deciding).
- A small badge appears with the held order; tap it to **recall** and continue.
- **New Order** — clears everything for the next customer.

---

## 7. Sales

**Menu:** Sales → Invoices / Online Orders / Returns

- **Invoices:** every sale made at the counter (POS) with payment status (Cash / Due / Partial Due).
- **Online Orders:** orders placed by customers on your website. See customer details and order status.
- **Returns:** process returned products and add stock back.

---

## 8. Customers

**Menu:** Customers

- View all customers with their **previous due**.
- **Due Ledger / Ledger** — search a customer to see their full payment history and what they owe.
- **Groups** — organise customers.

> When a customer pays you, record it in **Cash Register → Money In → Customer Due Received** (see section 9).

---

## 9. Accounts & Money

**Menu:** Accounts → Cash Register / Journal / Chart of Accounts / Trial Balance / Profit & Loss / Balance Sheet

### 9.1 Cash Register (Money In / Money Out)
This is where you record money coming in and going out. Every entry is saved as a proper accounting entry.

#### Money In / Receive
Choose a category:
- **Income accounts** (e.g. Sales Revenue, Service Revenue, Other Income)
- **Customer Due Received** — a customer pays an old bill. Select the customer; their total due is shown. The amount is applied to their oldest bills automatically.
- **Owner Investment** — you put your own money into the business.
- **Loan Received** — money borrowed.
- **Bank Withdrawal** — you take money out of the bank and into cash.

#### Money Out / Pay
Choose a category:
- **Expense accounts** (Rent, Salaries, Utilities, Transport, General & Admin, Other Expense…)
- **Supplier Due Paid** — you pay a supplier's old bill. Select the supplier; their due is shown. Applied to oldest purchases first.
- **Bank Deposit** — you put cash into the bank.
- **Owner Receive / Drawings** — you take money out of the business for yourself.

**To record:** pick a date, amount, category, note, then click **Receive Money** or **Pay Money**. The totals at the top update instantly.

### 9.2 Journal
Every transaction in the company (sales, purchases, cash entries) appears here as a dated journal entry.

### 9.3 Chart of Accounts
The full list of accounts used for bookkeeping (Cash, Bank, Receivables, Payables, Equity, Revenue, Expenses).

### 9.4 Trial Balance / Profit & Loss / Balance Sheet
- **Trial Balance:** checks that your books are balanced (debits = credits).
- **Profit & Loss:** your income minus expenses — how much profit you made in a period.
- **Balance Sheet:** what the business owns (assets), owes (liabilities), and the owner's equity.

---

## 10. Web Store (Online Shop)

**Menu:** Web Store → Settings / Pages / Contacts / Couriers

### 10.1 Home Banner & Hero
1. **Web Store → Settings** (or Pages).
2. Edit the home **banner image** (upload or browse the gallery), hero title, and subtitle.
3. Click **Save**.

### 10.2 Storefront Pages
- **Pages:** manage banners/titles for home sections.
- **Contacts:** phone, WhatsApp, address shown to customers.
- **Couriers:** delivery services and their charges.

### 10.3 Product Visibility
Products added with **Display Products** and set **Active** automatically appear on the online shop. Products with **0 stock** show as "Coming Soon" / "Out of Stock".

### 10.4 How Customers Buy
1. Customer opens your site on mobile.
2. Shops by category/brand, taps a product, chooses quantity, **Add to Cart**.
3. Goes to **Cart** → **Checkout**, enters name/phone/address, picks courier, chooses **Cash on Delivery** or **Instant Payment**.
4. Order is created, stock is reduced, and the order appears in **Sales → Online Orders**.

---

## 11. Gallery

**Menu:** Gallery

Upload product/banner photos once here, then reuse them anywhere:
- Product images (Inventory → Display Products, or Add Product dialog)
- Home banner (Web Store)
- Any page banner

You can upload multiple images and delete unused ones.

---

## 12. Reports

**Menu:** Reports → Sales / Inventory / Customer Due

- **Sales Report:** total sales over time.
- **Inventory Report:** current stock and product values.
- **Customer Due Report:** who owes you money and how much.

---

## 13. Admin

**Menu:** Admin → Users / Roles / Stock Alerts / Audit Log / Discount Rules

- **Users:** create accounts for staff (email + password), assign roles.
- **Roles:** what each user can do.
- **Stock Alerts:** low-stock warnings.
- **Audit Log:** a record of important actions (who did what, when).
- **Discount Rules:** set bulk discount rules (e.g. 20% off when buying 6+ items) used by the POS and online store.

---

## 14. Using the Software on Mobile

The software is fully mobile-friendly for your 90+ customers and for you.

- **Sidebar** becomes a drawer — tap the **☰** menu button to open it.
- **Tables** scroll sideways; swipe to see all columns.
- **POS** shows a **View Cart** button to open the cart drawer.
- **Product grids** show 2 columns so browsing is fast.

### Online store for customers
Just share your site URL. Customers get a mobile-optimised shop with easy cart + cash-on-delivery checkout.

---

## 15. Frequently Asked Questions

**Q: How do I change a product's selling price?**
Set the **S Ratio** under Inventory → Display Products. Selling price = cost × ratio. Or update the product directly.

**Q: How do I record that a customer paid their due?**
Cash Register → **Money In → Customer Due Received** → select customer → enter amount.

**Q: How do I record paying my supplier?**
Cash Register → **Money Out → Supplier Due Paid** → select supplier → enter amount.

**Q: Can a walk-in customer buy on credit?**
No. Credit (due) is only allowed for registered customers.

**Q: Where do my online orders appear?**
Sales → **Online Orders**.

**Q: Why isn't my product showing on the online store?**
Check it is **Active** (not deleted) and has stock, under Inventory → Display Products.

**Q: How do I see my profit?**
Accounts → **Profit & Loss**.

**Q: How do staff log in?**
Admin → **Users** → create a user with email/password, then they log in at the Login page.

---

_End of manual — keep this file with your project so new staff can read it anytime._

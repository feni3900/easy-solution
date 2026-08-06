export type Locale = "en" | "bn";

export const LOCALE_COOKIE = "locale";

export function isLocale(v: string | undefined): v is Locale {
  return v === "en" || v === "bn";
}

export function getClientLocale(): Locale {
  if (typeof document === "undefined") return "en";
  const m = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
  return m && isLocale(m[1]) ? m[1] : "en";
}

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function toBn(str: string): string {
  return str.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

export function fmtMoney(n: number, locale: Locale): string {
  const s = (Math.round(n * 100) / 100).toFixed(2);
  return `৳${locale === "bn" ? toBn(s) : s}`;
}

export function fmtInt(n: number, locale: Locale): string {
  const s = String(Math.round(n));
  return locale === "bn" ? toBn(s) : s;
}

export function fmtNum(n: number, locale: Locale): string {
  const s = String(Math.round(n * 100) / 100);
  return locale === "bn" ? toBn(s) : s;
}

export function fmtPct(n: number, locale: Locale): string {
  const s = String(Math.round(n));
  return locale === "bn" ? toBn(s) : s;
}

export function t(key: string, locale: Locale): string {
  const entry = translations[key as keyof typeof translations];
  if (!entry) return key;
  return entry[locale];
}

export const translations = {
  "common.language": { en: "Language", bn: "ভাষা" },
  "common.english": { en: "English", bn: "English" },
  "common.bangla": { en: "Bangla", bn: "বাংলা" },
  "common.viewWebsite": { en: "View Website", bn: "ওয়েবসাইট দেখুন" },
  "common.signOut": { en: "Sign Out", bn: "সাইন আউট" },
  "common.myAccount": { en: "My Account", bn: "আমার অ্যাকাউন্ট" },
  "common.login": { en: "Login", bn: "লগইন" },
  "common.admin": { en: "Admin", bn: "অ্যাডমিন" },
  "common.brand": { en: "Smart ERP", bn: "স্মার্ট ইআরপি" },

  // Sidebar nav
  "nav.dashboard": { en: "Dashboard", bn: "ড্যাশবোর্ড" },
  "nav.pos": { en: "POS Terminal", bn: "পিওএস টার্মিনাল" },
  "nav.inventory": { en: "Inventory", bn: "ইনভেন্টরি" },
  "nav.inventory.displayProducts": { en: "Display Products", bn: "পণ্য তালিকা" },
  "nav.inventory.stockJournal": { en: "Stock Journal", bn: "স্টক জার্নাল" },
  "nav.inventory.damages": { en: "Damages", bn: "ক্ষতিগ্রস্ত পণ্য" },
  "nav.addRemove": { en: "Add/Remove", bn: "যোগ/অপসারণ" },
  "nav.addRemove.suppliers": { en: "Suppliers", bn: "সরবরাহকারী" },
  "nav.addRemove.categories": { en: "Categories", bn: "ক্যাটাগরি" },
  "nav.addRemove.brands": { en: "Brands", bn: "ব্র্যান্ড" },
  "nav.addRemove.products": { en: "Products", bn: "পণ্য" },
  "nav.addRemove.sizes": { en: "Sizes", bn: "সাইজ" },
  "nav.addRemove.units": { en: "Units", bn: "ইউনিট" },
  "nav.purchases": { en: "Purchases", bn: "ক্রয়" },
  "nav.purchases.new": { en: "New Purchase", bn: "নতুন ক্রয়" },
  "nav.purchases.history": { en: "Purchase History", bn: "ক্রয় ইতিহাস" },
  "nav.purchases.suppliers": { en: "Suppliers", bn: "সরবরাহকারী" },
  "nav.purchases.supplierLedger": { en: "Supplier Ledger", bn: "সরবরাহকারী লেজার" },
  "nav.sales": { en: "Sales", bn: "বিক্রয়" },
  "nav.sales.invoices": { en: "POS Invoices", bn: "পিওএস ইনভয়েস" },
  "nav.sales.onlineOrders": { en: "Online Orders", bn: "অনলাইন অর্ডার" },
  "nav.sales.returns": { en: "Returns", bn: "রিটার্ন" },
  "nav.sales.customers": { en: "Customers", bn: "গ্রাহক" },
  "nav.sales.customersLedger": { en: "Customers Ledger", bn: "গ্রাহক লেজার" },
  "nav.gallery": { en: "Gallery", bn: "গ্যালারি" },
  "nav.reports": { en: "Reports", bn: "রিপোর্ট" },
  "nav.reports.sales": { en: "Sales Report", bn: "বিক্রয় রিপোর্ট" },
  "nav.reports.inventory": { en: "Inventory Movement", bn: "ইনভেন্টরি মুভমেন্ট" },
  "nav.reports.customersDue": { en: "Customers Due", bn: "গ্রাহক বকেয়া" },
  "nav.accounts": { en: "Accounts", bn: "হিসাব" },
  "nav.accounts.cashInOut": { en: "Cash In / Out", bn: "নগদ ইন / আউট" },
  "nav.accounts.chartOfAccounts": { en: "Chart of Accounts", bn: "চার্ট অফ একাউন্টস" },
  "nav.accounts.journal": { en: "Journal Entries", bn: "জার্নাল এন্ট্রি" },
  "nav.accounts.trialBalance": { en: "Trial Balance", bn: "ট্রায়াল ব্যালেন্স" },
  "nav.accounts.profitLoss": { en: "Profit & Loss", bn: "লাভ ও ক্ষতি" },
  "nav.accounts.balanceSheet": { en: "Balance Sheet", bn: "ব্যালেন্স শিট" },
  "nav.webStore": { en: "Web Store", bn: "ওয়েব স্টোর" },
  "nav.webStore.settings": { en: "Settings", bn: "সেটিংস" },
  "nav.webStore.pageSections": { en: "Page Sections", bn: "পেজ সেকশন" },
  "nav.webStore.couriers": { en: "Courier Services", bn: "কুরিয়ার সার্ভিস" },
  "nav.webStore.contacts": { en: "Contact Submissions", bn: "যোগাযোগ সাবমিশন" },
  "nav.admin": { en: "Admin", bn: "অ্যাডমিন" },
  "nav.admin.users": { en: "Users", bn: "ইউজার" },
  "nav.admin.roles": { en: "Roles & Permissions", bn: "রোল ও পারমিশন" },
  "nav.admin.discountRules": { en: "Bulk Discount Rules", bn: "বাল্ক ডিসকাউন্ট রুল" },
  "nav.admin.stockAlerts": { en: "Stock Alert Rules", bn: "স্টক অ্যালার্ট রুল" },
  "nav.admin.auditLog": { en: "Audit Log", bn: "অডিট লগ" },

  // Dashboard header
  "header.viewWebsite": { en: "View Website", bn: "ওয়েবসাইট দেখুন" },
  "header.myAccount": { en: "My Account", bn: "আমার অ্যাকাউন্ট" },
  "header.signOut": { en: "Sign Out", bn: "সাইন আউট" },

  // Storefront
  "store.home": { en: "Home", bn: "হোম" },
  "store.shop": { en: "Shop", bn: "শপ" },
  "store.about": { en: "About", bn: "আমাদের সম্পর্কে" },
  "store.contact": { en: "Contact", bn: "যোগাযোগ" },
  "store.whatsapp": { en: "WhatsApp", bn: "হোয়াটসঅ্যাপ" },
  "store.footer": { en: "Smart ERP Store", bn: "স্মার্ট ইআরপি স্টোর" },
  "store.cart": { en: "Cart", bn: "কার্ট" },

  "store.home.welcome": { en: "Welcome to Maruf Enterprise", bn: "মারুফ এন্টারপ্রাইজে স্বাগতম" },
  "store.home.tagline": { en: "Discover Premium Fragrances & Smart Gadgets", bn: "প্রিমিয়াম পারফিউম ও স্মার্ট গ্যাজেট আবিষ্কার করুন" },
  "store.home.shopNow": { en: "Shop Now", bn: "এখনই কেনাকাটা করুন" },
  "store.home.fastDelivery": { en: "Fast Delivery", bn: "দ্রুত ডেলিভারি" },
  "store.home.fastDeliveryDesc": { en: "Quick and reliable courier delivery nationwide", bn: "সারা দেশে দ্রুত ও নির্ভরযোগ্য কুরিয়ার ডেলিভারি" },
  "store.home.authenticProducts": { en: "Authentic Products", bn: "খাঁটি পণ্য" },
  "store.home.authenticProductsDesc": { en: "100% genuine products with warranty", bn: "১০০% খাঁটি পণ্য ও ওয়ারেন্টি" },
  "store.home.securePayment": { en: "Secure Payment", bn: "নিরাপদ পেমেন্ট" },
  "store.home.securePaymentDesc": { en: "Cash on delivery and online payment options", bn: "ক্যাশ অন ডেলিভারি ও অনলাইন পেমেন্ট সুবিধা" },
  "store.home.hotSell": { en: "Hot Sell", bn: "হট সেল" },
  "store.home.viewAll": { en: "View all", bn: "সব দেখুন" },
  "store.home.popular": { en: "Popular Products", bn: "জনপ্রিয় পণ্য" },
  "store.home.topSelling": { en: "Top Selling", bn: "টপ সেলিং" },
  "store.home.browseCatalog": { en: "Browse the Full Catalog", bn: "সম্পূর্ণ ক্যাটালগ ব্রাউজ করুন" },
  "store.home.browseCatalogDesc": { en: "Every product in our catalog is available with cash on delivery.", bn: "আমাদের ক্যাটালগের প্রতিটি পণ্য ক্যাশ অন ডেলিভারিতে অর্ডার করা যায়।" },
  "store.home.goToShop": { en: "Go to Shop", bn: "শপে যান" },

  "store.shop.title": { en: "Shop", bn: "শপ" },
  "store.searchPlaceholder": { en: "Search products...", bn: "পণ্য খুঁজুন..." },
  "store.allCategories": { en: "All Categories", bn: "সব ক্যাটাগরি" },
  "store.allBrands": { en: "All Brands", bn: "সব ব্র্যান্ড" },
  "store.noProducts": { en: "No products found.", bn: "কোনো পণ্য পাওয়া যায়নি।" },
  "store.inStock": { en: "In Stock", bn: "স্টকে আছে" },
  "store.outOfStock": { en: "Out of Stock", bn: "স্টকে নেই" },
  "store.bulkOff": { en: "{p}% off {m}+", bn: "{p}% ছাড় {m}+" },

  "store.product.backToShop": { en: "Back to Shop", bn: "শপে ফিরে যান" },
  "store.product.sku": { en: "SKU", bn: "এসকেইউ" },
  "store.product.variants": { en: "Variants", bn: "ভ্যারিয়েন্ট" },
  "store.product.inStockCount": { en: "{n} in stock", bn: "{n} টি স্টকে" },
  "store.product.outOfStock": { en: "Out of stock", bn: "স্টকে নেই" },
  "store.product.addToCart": { en: "Add to Cart", bn: "কার্টে যোগ করুন" },
  "store.product.added": { en: "Added!", bn: "যোগ হয়েছে!" },
  "store.product.viewCart": { en: "View Cart", bn: "কার্ট দেখুন" },

  "store.cart.title": { en: "Shopping Cart", bn: "শপিং কার্ট" },
  "store.cart.empty": { en: "Your cart is empty", bn: "আপনার কার্ট খালি" },
  "store.cart.emptyDesc": { en: "Add some products to get started.", bn: "শুরু করতে কিছু পণ্য যোগ করুন।" },
  "store.cart.browseShop": { en: "Browse Shop", bn: "শপ ব্রাউজ করুন" },
  "store.cart.each": { en: "each", bn: "প্রতিটি" },
  "store.cart.orderSummary": { en: "Order Summary", bn: "অর্ডার সামারি" },
  "store.cart.subtotal": { en: "Subtotal ({n} pcs)", bn: "সাবটোটাল ({n} টি)" },
  "store.cart.bulkDiscount": { en: "Bulk Discount ({n}%)", bn: "বাল্ক ডিসকাউন্ট ({n}%)" },
  "store.cart.addMore": { en: "Add {n} more for {p}% bulk discount", bn: "আর {n} টি যোগ করলে {p}% বাল্ক ডিসকাউন্ট" },
  "store.cart.total": { en: "Total", bn: "মোট" },
  "store.cart.courierNote": { en: "Courier charge calculated at checkout.", bn: "কুরিয়ার চার্জ চেকআউটে হিসাব করা হবে।" },
  "store.cart.checkout": { en: "Proceed to Checkout", bn: "চেকআউটে যান" },
  "store.cart.continueShopping": { en: "Continue Shopping", bn: "কেনাকাটা চালিয়ে যান" },

  "store.checkout.title": { en: "Checkout", bn: "চেকআউট" },
  "store.checkout.backToCart": { en: "Back to Cart", bn: "কার্টে ফিরে যান" },
  "store.checkout.empty": { en: "Your cart is empty", bn: "আপনার কার্ট খালি" },
  "store.checkout.emptyDesc": { en: "Add some products before checkout.", bn: "চেকআউটের আগে কিছু পণ্য যোগ করুন।" },
  "store.checkout.shippingInfo": { en: "Shipping Information", bn: "শিপিং তথ্য" },
  "store.checkout.fullName": { en: "Full Name *", bn: "পুরো নাম *" },
  "store.checkout.fullNamePlaceholder": { en: "Your full name", bn: "আপনার পুরো নাম" },
  "store.checkout.mobile": { en: "Mobile Number *", bn: "মোবাইল নম্বর *" },
  "store.checkout.address": { en: "Address *", bn: "ঠিকানা *" },
  "store.checkout.addressPlaceholder": { en: "House no, road, area, landmarks", bn: "বাসা নম্বর, রোড, এলাকা, ল্যান্ডমার্ক" },
  "store.checkout.city": { en: "City *", bn: "শহর *" },
  "store.checkout.postal": { en: "Postal Code", bn: "পোস্টাল কোড" },
  "store.checkout.postalPlaceholder": { en: "Optional", bn: "ঐচ্ছিক" },
  "store.checkout.deliveryPayment": { en: "Delivery & Payment", bn: "ডেলিভারি ও পেমেন্ট" },
  "store.checkout.courier": { en: "Courier Service", bn: "কুরিয়ার সার্ভিস" },
  "store.checkout.paymentMethod": { en: "Payment Method", bn: "পেমেন্ট পদ্ধতি" },
  "store.checkout.cod": { en: "Cash on Delivery (COD)", bn: "ক্যাশ অন ডেলিভারি (সিওডি)" },
  "store.checkout.instant": { en: "Instant Payment", bn: "ইনস্ট্যান্ট পেমেন্ট" },
  "store.checkout.orderNotes": { en: "Order Notes", bn: "অর্ডার নোট" },
  "store.checkout.orderNotesPlaceholder": { en: "Any special instructions...", bn: "কোনো বিশেষ নির্দেশনা..." },
  "store.checkout.orderSummary": { en: "Order Summary", bn: "অর্ডার সামারি" },
  "store.checkout.afterDiscount": { en: "After Discount", bn: "ডিসকাউন্টের পর" },
  "store.checkout.courierCharge": { en: "Courier Charge", bn: "কুরিয়ার চার্জ" },
  "store.checkout.grandTotal": { en: "Grand Total", bn: "সর্বমোট" },
  "store.checkout.placeOrder": { en: "Place Order", bn: "অর্ডার করুন" },
  "store.checkout.placing": { en: "Placing Order...", bn: "অর্ডার করা হচ্ছে..." },
  "store.checkout.fillFields": { en: "Please fill in all required shipping fields.", bn: "অনুগ্রহ করে প্রয়োজনীয় শিপিং তথ্য পূরণ করুন।" },
  "store.checkout.cartEmpty": { en: "Your cart is empty.", bn: "আপনার কার্ট খালি।" },
  "store.checkout.error": { en: "Error placing order: ", bn: "অর্ডার করতে সমস্যা: " },
  "store.checkout.courierOption": { en: "({n} days)", bn: "({n} দিন)" },

  "store.confirm.noOrder": { en: "No order number provided.", bn: "কোনো অর্ডার নম্বর দেওয়া হয়নি।" },
  "store.confirm.orderNotFound": { en: "Order not found.", bn: "অর্ডার পাওয়া যায়নি।" },
  "store.confirm.success": { en: "Order Placed Successfully!", bn: "অর্ডার সফলভাবে সম্পন্ন হয়েছে!" },
  "store.confirm.thanks": { en: "Thank you for your order.", bn: "আপনার অর্ডারের জন্য ধন্যবাদ।" },
  "store.confirm.orderNumber": { en: "Order Number", bn: "অর্ডার নম্বর" },
  "store.confirm.name": { en: "Name", bn: "নাম" },
  "store.confirm.phone": { en: "Phone", bn: "ফোন" },
  "store.confirm.address": { en: "Address", bn: "ঠিকানা" },
  "store.confirm.courier": { en: "Courier", bn: "কুরিয়ার" },
  "store.confirm.payment": { en: "Payment", bn: "পেমেন্ট" },
  "store.confirm.total": { en: "Total", bn: "মোট" },
  "store.confirm.continue": { en: "Continue Shopping", bn: "কেনাকাটা চালিয়ে যান" },
  "store.confirm.browse": { en: "Browse Shop", bn: "শপ ব্রাউজ করুন" },

  "store.about.ourStory": { en: "Our Story", bn: "আমাদের গল্প" },
  "store.about.subtitle": { en: "Building trust through quality products", bn: "মানসম্মত পণ্যের মাধ্যমে আস্থা তৈরি" },
  "store.about.featured": { en: "Featured Products", bn: "বৈশিষ্ট্যযুক্ত পণ্য" },

  "store.contact.getInTouch": { en: "Get In Touch", bn: "যোগাযোগ করুন" },
  "store.contact.subtitle": { en: "We are here to help you", bn: "আমরা আপনাকে সাহায্য করতে প্রস্তুত" },
  "store.contact.visitUs": { en: "Visit Us", bn: "আমাদের দেখুন" },
  "store.contact.callUs": { en: "Call Us", bn: "কল করুন" },
  "store.contact.emailUs": { en: "Email Us", bn: "ইমেইল করুন" },
  "store.contact.inquiry": { en: "Send an Inquiry", bn: "একটি জিজ্ঞাসা পাঠান" },
  "store.contact.yourName": { en: "Your Name", bn: "আপনার নাম" },
  "store.contact.phone": { en: "Phone Number", bn: "ফোন নম্বর" },
  "store.contact.emailOptional": { en: "Email (optional)", bn: "ইমেইল (ঐচ্ছিক)" },
  "store.contact.message": { en: "Your Message", bn: "আপনার বার্তা" },
  "store.contact.send": { en: "Send Message", bn: "বার্তা পাঠান" },
  "store.contact.operatingHours": { en: "Operating Hours:", bn: "খোলার সময়:" },

  // POS
  "pos.title": { en: "POS Terminal", bn: "পিওএস টার্মিনাল" },
  "pos.search": { en: "Search products...", bn: "পণ্য খুঁজুন..." },
  "pos.cart": { en: "Cart", bn: "কার্ট" },
  "pos.viewCart": { en: "View Cart", bn: "কার্ট দেখুন" },
  "pos.customerMobile": { en: "Customer Mobile", bn: "গ্রাহকের মোবাইল" },
  "pos.customerName": { en: "Customer Name", bn: "গ্রাহকের নাম" },
  "pos.previousDue": { en: "Previous Due", bn: "পূর্ববর্তী বকেয়া" },
  "pos.manualDiscount": { en: "Manual Discount", bn: "ম্যানুয়াল ডিসকাউন্ট" },
  "pos.paidAmount": { en: "Paid Amount", bn: "পরিশোধিত টাকা" },
  "pos.notes": { en: "Notes", bn: "নোট" },
  "pos.due": { en: "Due", bn: "বকেয়া" },
  "pos.subtotal": { en: "Subtotal", bn: "সাবটোটাল" },
  "pos.bulkDiscount": { en: "Bulk Discount", bn: "বাল্ক ডিসকাউন্ট" },
  "pos.discount": { en: "Discount", bn: "ডিসকাউন্ট" },
  "pos.total": { en: "Total", bn: "মোট" },
  "pos.holdOrder": { en: "Hold Order", bn: "অর্ডার হোল্ড" },
  "pos.newOrder": { en: "New Order", bn: "নতুন অর্ডার" },
  "pos.confirm": { en: "Confirm Sale", bn: "বিক্রয় নিশ্চিত করুন" },
  "pos.products": { en: "Products", bn: "পণ্য" },
  "pos.emptyCart": { en: "Cart is empty. Add products from the list.", bn: "কার্ট খালি। তালিকা থেকে পণ্য যোগ করুন।" },
  "pos.walkinDue": { en: "Walk-in customers must pay full amount. No due allowed.", bn: "ওয়াক-ইন গ্রাহককে পূর্ণ পরিশোধ করতে হবে। বকেয়া অনুমোদিত নয়।" },
  "pos.invoiceCreated": { en: "Invoice {no} created successfully!", bn: "ইনভয়েস {no} সফলভাবে তৈরি হয়েছে!" },
  "pos.error": { en: "Error: ", bn: "ত্রুটি: " },
  "pos.item": { en: "Item", bn: "আইটেম" },
  "pos.price": { en: "Price", bn: "দাম" },
  "pos.qty": { en: "Qty", bn: "পরিমাণ" },
  "pos.action": { en: "Action", bn: "অ্যাকশন" },
  "pos.addCustomer": { en: "Add", bn: "যোগ করুন" },
  "pos.currentStock": { en: "Stock", bn: "স্টক" },
  "pos.searchPlaceholder": { en: "Search SKU or name...", bn: "এসকেইউ বা নাম খুঁজুন..." },
  "pos.viewCartCount": { en: "View Cart ({n})", bn: "কার্ট দেখুন ({n})" },
  "pos.cartTitle": { en: "Cart ({n} items)", bn: "কার্ট ({n} আইটেম)" },
  "pos.heldOrders": { en: "Held Orders ({n}):", bn: "হোল্ড অর্ডার ({n}):" },
  "pos.heldOrderItem": { en: "#{n} ({count} items)", bn: "#{n} ({count} আইটেম)" },
  "pos.each": { en: "each", bn: "প্রতিটি" },
  "pos.placeOrder": { en: "Place Order", bn: "অর্ডার করুন" },
  "pos.allCategories": { en: "All Categories", bn: "সব ক্যাটাগরি" },
  "pos.allBrands": { en: "All Brands", bn: "সব ব্র্যান্ড" },
  "pos.noProducts": { en: "No products found.", bn: "কোনো পণ্য পাওয়া যায়নি।" },
  "pos.customerDue": { en: "Due: {a}", bn: "বকেয়া: {a}" },
  "pos.dueAmount": { en: "Due: {a}", bn: "বকেয়া: {a}" },

  // Store checkout aliases / extras
  "store.checkout.fullNamePh": { en: "Your full name", bn: "আপনার পুরো নাম" },
  "store.checkout.addressPh": { en: "House no, road, area, landmarks", bn: "বাসা নম্বর, রোড, এলাকা, ল্যান্ডমার্ক" },
  "store.checkout.cityPh": { en: "e.g. Dhaka, Chittagong", bn: "যেমন: ঢাকা, চট্টগ্রাম" },
  "store.checkout.optional": { en: "Optional", bn: "ঐচ্ছিক" },
  "store.checkout.days": { en: "days", bn: "দিন" },
  "store.checkout.fillRequired": { en: "Please fill in all required shipping fields.", bn: "অনুগ্রহ করে প্রয়োজনীয় শিপিং তথ্য পূরণ করুন।" },
  "store.checkout.subtotalItems": { en: "Subtotal ({n} items)", bn: "সাবটোটাল ({n} আইটেম)" },
  "store.checkout.placeOrderAmount": { en: "Place Order — {a}", bn: "অর্ডার করুন — {a}" },
  "store.checkout.instantPayment": { en: "Instant Payment", bn: "ইনস্ট্যান্ট পেমেন্ট" },
  "store.checkout.courierService": { en: "Courier Service", bn: "কুরিয়ার সার্ভিস" },
  "store.checkout.postalCode": { en: "Postal Code", bn: "পোস্টাল কোড" },
  "store.checkout.notesPh": { en: "Any special instructions...", bn: "কোনো বিশেষ নির্দেশনা..." },

  // Store about
  "store.about.title": { en: "Our Story", bn: "আমাদের গল্প" },
  "store.about.value1Title": { en: "Direct Sourcing", bn: "সরাসরি সংগ্রহ" },
  "store.about.value1Desc": { en: "We source directly from manufacturers", bn: "আমরা সরাসরি নির্মাতাদের কাছ থেকে সংগ্রহ করি" },
  "store.about.value2Title": { en: "Quality Control", bn: "মান নিয়ন্ত্রণ" },
  "store.about.value2Desc": { en: "Every product passes rigorous QC", bn: "প্রতিটি পণ্য কঠোর মান পরীক্ষায় উত্তীর্ণ হয়" },
  "store.about.value3Title": { en: "Customer Care", bn: "গ্রাহক সেবা" },
  "store.about.value3Desc": { en: "Dedicated support for every customer", bn: "প্রতিটি গ্রাহকের জন্য নিবেদিত সাপোর্ট" },

  // Store confirmation
  "store.confirmation.title": { en: "Order Placed Successfully!", bn: "অর্ডার সফলভাবে সম্পন্ন হয়েছে!" },
  "store.confirmation.thanks": { en: "Thank you for your order.", bn: "আপনার অর্ডারের জন্য ধন্যবাদ।" },
  "store.confirmation.orderNo": { en: "Order Number", bn: "অর্ডার নম্বর" },
  "store.confirmation.name": { en: "Name", bn: "নাম" },
  "store.confirmation.phone": { en: "Phone", bn: "ফোন" },
  "store.confirmation.address": { en: "Address", bn: "ঠিকানা" },
  "store.confirmation.courier": { en: "Courier", bn: "কুরিয়ার" },
  "store.confirmation.payment": { en: "Payment", bn: "পেমেন্ট" },
  "store.confirmation.noOrderNo": { en: "No order number provided.", bn: "কোনো অর্ডার নম্বর প্রদান করা হয়নি।" },
  "store.confirmation.notFound": { en: "Order not found.", bn: "অর্ডার পাওয়া যায়নি।" },

  // Dashboard home
  "dash.welcome": { en: "Welcome back, {name}", bn: "স্বাগতম, {name}" },
  "dash.loaded": { en: "Dashboard loaded successfully. Navigation is in the sidebar.", bn: "ড্যাশবোর্ড সফলভাবে লোড হয়েছে। নেভিগেশন সাইডবারে আছে।" },
  "dash.yourRole": { en: "Your Role", bn: "আপনার রোল" },
  "dash.username": { en: "Username", bn: "ইউজারনেম" },
  "dash.nickname": { en: "Nickname", bn: "নিকনেম" },
  "dash.status": { en: "Status", bn: "অবস্থা" },
  "dash.active": { en: "Active", bn: "সক্রিয়" },
  "dash.quickStart": { en: "Quick Start", bn: "দ্রুত শুরু" },
  "dash.goTo": { en: "Go to {label} to {desc}", bn: "{label} এ যান — {desc}" },
  "dash.quickLinks.inventoryProducts": { en: "Inventory → Products", bn: "ইনভেন্টরি → পণ্য" },
  "dash.quickLinks.pos": { en: "POS Terminal", bn: "পিওএস টার্মিনাল" },
  "dash.quickLinks.webStoreSettings": { en: "Web Store → Settings", bn: "ওয়েব স্টোর → সেটিংস" },
  "dash.quickLinks.adminUsers": { en: "Admin → Users", bn: "অ্যাডমিন → ইউজার" },
  "dash.quickLinks.desc.addProducts": { en: "add products", bn: "পণ্য যোগ করতে" },
  "dash.quickLinks.desc.startSelling": { en: "start selling", bn: "বিক্রি শুরু করতে" },
  "dash.quickLinks.desc.configureStore": { en: "configure your store", bn: "স্টোর কনফিগার করতে" },
  "dash.quickLinks.desc.manageUsers": { en: "manage user accounts", bn: "ইউজার অ্যাকাউন্ট পরিচালনা করতে" },
} as const;

export type TranslationKey = keyof typeof translations;

export function translateWithVars(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

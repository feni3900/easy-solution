export const ROLES = [
  { value: "Salesperson", label: "Salesperson", maxDiscount: 5, allowDue: false },
  { value: "Branch Manager", label: "Branch Manager", maxDiscount: 15, allowDue: true },
  { value: "Admin", label: "Admin", maxDiscount: 100, allowDue: true },
  { value: "Guest", label: "Guest", maxDiscount: 0, allowDue: false },
] as const;

export const PAYMENT_TYPES = [
  { value: "Cash", label: "Cash" },
  { value: "Credit", label: "Credit" },
  { value: "Partial", label: "Partial" },
] as const;

export const SALE_CHANNELS = [
  { value: "POS", label: "POS" },
  { value: "ONLINE", label: "Online" },
] as const;

export const PAYMENT_STATUSES = [
  { value: "Cash", label: "Cash" },
  { value: "Due", label: "Due" },
  { value: "Partial Due", label: "Partial Due" },
  { value: "COD", label: "COD" },
] as const;

export const ORDER_STATUSES = [
  { value: "Pending", label: "Pending" },
  { value: "Confirmed", label: "Confirmed" },
  { value: "Processing", label: "Processing" },
  { value: "Shipped", label: "Shipped" },
  { value: "Out for Delivery", label: "Out for Delivery" },
  { value: "Delivered", label: "Delivered" },
  { value: "Cancelled", label: "Cancelled" },
  { value: "Return_Requested", label: "Return Requested" },
  { value: "Returned", label: "Returned" },
] as const;

export const STOCK_MOVEMENT_TYPES = [
  { value: "Purchase", label: "Purchase" },
  { value: "Sale_POS", label: "Sale (POS)" },
  { value: "Sale_Online", label: "Sale (Online)" },
  { value: "Adjustment", label: "Adjustment" },
  { value: "Return_In", label: "Return In" },
  { value: "Damage", label: "Damage" },
  { value: "Write_Off", label: "Write Off" },
] as const;

export interface NavChild {
  title: string;
  titleKey: string;
  href: string;
  children?: NavChild[];
}

export interface NavItem {
  title: string;
  titleKey: string;
  href: string;
  icon: string;
  children?: NavChild[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    titleKey: "nav.dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
  },
  {
    title: "Maruf Perfume",
    titleKey: "nav.perfume",
    href: "/perfume",
    icon: "FlaskConical",
  },
  {
    title: "POS Terminal",
    titleKey: "nav.pos",
    href: "/pos",
    icon: "Monitor",
  },
  {
    title: "Inventory",
    titleKey: "nav.inventory",
    href: "/inventory",
    icon: "Package",
    children: [
      { title: "Display Products", titleKey: "nav.inventory.displayProducts", href: "/inventory/products" },
      { title: "Stock Journal", titleKey: "nav.inventory.stockJournal", href: "/inventory/stock-journal" },
      { title: "Damages", titleKey: "nav.inventory.damages", href: "/inventory/damages" },
    ],
  },
  {
    title: "Purchases",
    titleKey: "nav.purchases",
    href: "/purchases",
    icon: "Truck",
    children: [
      { title: "New Purchase", titleKey: "nav.purchases.new", href: "/purchases/new" },
      { title: "Purchase History", titleKey: "nav.purchases.history", href: "/purchases/history" },
      { title: "Suppliers", titleKey: "nav.purchases.suppliers", href: "/purchases/suppliers" },
      { title: "Supplier Ledger", titleKey: "nav.purchases.supplierLedger", href: "/purchases/supplier-ledger" },
    ],
  },
  {
    title: "Sales",
    titleKey: "nav.sales",
    href: "/sales",
    icon: "ShoppingCart",
    children: [
      { title: "POS Invoices", titleKey: "nav.sales.invoices", href: "/sales/invoices" },
      { title: "Online Orders", titleKey: "nav.sales.onlineOrders", href: "/sales/online-orders" },
      { title: "Returns", titleKey: "nav.sales.returns", href: "/sales/returns" },
      { title: "Customers", titleKey: "nav.sales.customers", href: "/customers" },
      { title: "Customers Ledger", titleKey: "nav.sales.customersLedger", href: "/customers/ledger" },
    ],
  },
  {
    title: "Gallery",
    titleKey: "nav.gallery",
    href: "/gallery",
    icon: "Image",
  },
  {
    title: "Reports",
    titleKey: "nav.reports",
    href: "/reports",
    icon: "BarChart3",
    children: [
      { title: "Sales Report", titleKey: "nav.reports.sales", href: "/reports/sales" },
      { title: "Inventory Movement", titleKey: "nav.reports.inventory", href: "/reports/inventory" },
      { title: "Customers Due", titleKey: "nav.reports.customersDue", href: "/reports/customer-due" },
    ],
  },
  {
    title: "Accounts",
    titleKey: "nav.accounts",
    href: "/accounts",
    icon: "BookOpen",
    children: [
      { title: "Cash In / Out", titleKey: "nav.accounts.cashInOut", href: "/accounts/cash-register" },
      { title: "Chart of Accounts", titleKey: "nav.accounts.chartOfAccounts", href: "/accounts/chart-of-accounts" },
      { title: "Journal Entries", titleKey: "nav.accounts.journal", href: "/accounts/journal" },
      { title: "Trial Balance", titleKey: "nav.accounts.trialBalance", href: "/accounts/trial-balance" },
      { title: "Profit & Loss", titleKey: "nav.accounts.profitLoss", href: "/accounts/profit-loss" },
      { title: "Balance Sheet", titleKey: "nav.accounts.balanceSheet", href: "/accounts/balance-sheet" },
    ],
  },
  {
    title: "Web Store",
    titleKey: "nav.webStore",
    href: "/web-store",
    icon: "Globe",
    children: [
      { title: "Settings", titleKey: "nav.webStore.settings", href: "/web-store/settings" },
      { title: "Page Sections", titleKey: "nav.webStore.pageSections", href: "/web-store/pages" },
      { title: "Courier Services", titleKey: "nav.webStore.couriers", href: "/web-store/couriers" },
      { title: "Contact Submissions", titleKey: "nav.webStore.contacts", href: "/web-store/contacts" },
    ],
  },
  {
    title: "Admin",
    titleKey: "nav.admin",
    href: "/admin",
    icon: "Shield",
    children: [
      { title: "Users", titleKey: "nav.admin.users", href: "/admin/users" },
      { title: "Roles & Permissions", titleKey: "nav.admin.roles", href: "/admin/roles" },
      { title: "Bulk Discount Rules", titleKey: "nav.admin.discountRules", href: "/admin/discount-rules" },
      { title: "Stock Alert Rules", titleKey: "nav.admin.stockAlerts", href: "/admin/stock-alerts" },
      { title: "Audit Log", titleKey: "nav.admin.auditLog", href: "/admin/audit-log" },
    ],
  },
  {
    title: "Add/Remove",
    titleKey: "nav.addRemove",
    href: "/inventory/add-remove",
    icon: "ListPlus",
    children: [
      { title: "Suppliers", titleKey: "nav.addRemove.suppliers", href: "/inventory/add-remove/suppliers" },
      { title: "Categories", titleKey: "nav.addRemove.categories", href: "/inventory/add-remove/categories" },
      { title: "Brands", titleKey: "nav.addRemove.brands", href: "/inventory/add-remove/brands" },
      { title: "Products", titleKey: "nav.addRemove.products", href: "/inventory/add-remove/products" },
      { title: "Sizes", titleKey: "nav.addRemove.sizes", href: "/inventory/add-remove/sizes" },
      { title: "Units", titleKey: "nav.addRemove.units", href: "/inventory/add-remove/units" },
      { title: "Colors", titleKey: "nav.addRemove.colors", href: "/inventory/add-remove/colors" },
    ],
  },
];

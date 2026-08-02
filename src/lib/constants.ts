export const ROLES = [
  { value: "super_admin", label: "Super Admin" },
  { value: "company_admin", label: "Company Admin" },
  { value: "branch_manager", label: "Branch Manager" },
  { value: "cashier", label: "Cashier" },
  { value: "salesperson", label: "Salesperson" },
  { value: "accountant", label: "Accountant" },
  { value: "warehouse_manager", label: "Warehouse Manager" },
] as const;

export const CURRENCIES = [
  { value: "BDT", label: "Bangladeshi Taka (৳)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "USD", label: "US Dollar ($)" },
] as const;

export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "bn", label: "বাংলা (Bangla)" },
] as const;

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "credit", label: "Credit" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "mobile_payment", label: "Mobile Payment" },
] as const;

export const SALES_CHANNELS = [
  { value: "pos", label: "POS" },
  { value: "online", label: "Online" },
] as const;

export const ORDER_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  children?: { title: string; href: string }[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
  },
  {
    title: "Organization",
    href: "/organization",
    icon: "Building2",
    children: [
      { title: "Companies", href: "/organization/companies" },
      { title: "Branches", href: "/organization/branches" },
      { title: "Business Units", href: "/organization/units" },
      { title: "Warehouses", href: "/organization/warehouses" },
    ],
  },
  {
    title: "User Management",
    href: "/users",
    icon: "Users",
    children: [
      { title: "Users", href: "/users" },
      { title: "Roles", href: "/users/roles" },
      { title: "Activity Logs", href: "/users/activity" },
    ],
  },
  {
    title: "Products",
    href: "/products",
    icon: "Package",
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: "Boxes",
    children: [
      { title: "Ledger", href: "/inventory/ledger" },
      { title: "Adjustments", href: "/inventory/adjustments" },
      { title: "Transfers", href: "/inventory/transfers" },
      { title: "Damages", href: "/inventory/damages" },
    ],
  },
  {
    title: "Sales",
    href: "/sales",
    icon: "ShoppingCart",
    children: [
      { title: "POS", href: "/sales/pos" },
      { title: "Orders", href: "/sales/orders" },
      { title: "Returns", href: "/sales/returns" },
    ],
  },
  {
    title: "Purchases",
    href: "/purchases",
    icon: "Truck",
    children: [
      { title: "Purchases", href: "/purchases" },
      { title: "Returns", href: "/purchases/returns" },
    ],
  },
  {
    title: "Customers",
    href: "/customers",
    icon: "Contact",
    children: [
      { title: "Customers", href: "/customers" },
      { title: "Groups", href: "/customers/groups" },
    ],
  },
  {
    title: "Suppliers",
    href: "/suppliers",
    icon: "Factory",
    children: [
      { title: "Suppliers", href: "/suppliers" },
      { title: "Groups", href: "/suppliers/groups" },
    ],
  },
  {
    title: "Gallery",
    href: "/gallery",
    icon: "Image",
  },
  {
    title: "Accounts",
    href: "/accounts",
    icon: "Wallet",
    children: [
      { title: "Cash Book", href: "/accounts/cashbook" },
      { title: "Bank Accounts", href: "/accounts/banks" },
      { title: "Expenses", href: "/accounts/expenses" },
      { title: "Income", href: "/accounts/income" },
    ],
  },
  {
    title: "Reports",
    href: "/reports",
    icon: "BarChart3",
    children: [
      { title: "Sales", href: "/reports/sales" },
      { title: "Purchases", href: "/reports/purchases" },
      { title: "Inventory", href: "/reports/inventory" },
      { title: "Profit & Loss", href: "/reports/pnl" },
    ],
  },
  {
    title: "Ecommerce",
    href: "/ecommerce",
    icon: "Globe",
    children: [
      { title: "Products", href: "/ecommerce/products" },
      { title: "Coupons", href: "/ecommerce/coupons" },
      { title: "Reviews", href: "/ecommerce/reviews" },
    ],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: "Settings",
  },
];

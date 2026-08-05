export const ROLES = [
  { value: "Salesperson", label: "Salesperson", maxDiscount: 5, allowDue: false },
  { value: "Branch Manager", label: "Branch Manager", maxDiscount: 15, allowDue: true },
  { value: "Admin", label: "Admin", maxDiscount: 100, allowDue: true },
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
    title: "POS Terminal",
    href: "/pos",
    icon: "Monitor",
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: "Package",
    children: [
      { title: "Products", href: "/inventory/products" },
      { title: "Categories", href: "/inventory/categories" },
      { title: "Brands", href: "/inventory/brands" },
      { title: "Stock Journal", href: "/inventory/stock-journal" },
      { title: "Damages", href: "/inventory/damages" },
    ],
  },
  {
    title: "Purchases",
    href: "/purchases",
    icon: "Truck",
    children: [
      { title: "New Purchase", href: "/purchases/new" },
      { title: "Purchase History", href: "/purchases/history" },
      { title: "Suppliers", href: "/purchases/suppliers" },
    ],
  },
  {
    title: "Sales",
    href: "/sales",
    icon: "ShoppingCart",
    children: [
      { title: "POS Invoices", href: "/sales/invoices" },
      { title: "Online Orders", href: "/sales/online-orders" },
      { title: "Returns", href: "/sales/returns" },
    ],
  },
  {
    title: "Customers",
    href: "/customers",
    icon: "Users",
    children: [
      { title: "All Customers", href: "/customers" },
      { title: "Due Ledger", href: "/customers/due-ledger" },
    ],
  },
  {
    title: "Gallery",
    href: "/gallery",
    icon: "Image",
  },
  {
    title: "Reports",
    href: "/reports",
    icon: "BarChart3",
    children: [
      { title: "Sales Report", href: "/reports/sales" },
      { title: "Inventory Movement", href: "/reports/inventory" },
      { title: "Customer Due", href: "/reports/customer-due" },
    ],
  },
  {
    title: "Web Store",
    href: "/web-store",
    icon: "Globe",
    children: [
      { title: "Settings", href: "/web-store/settings" },
      { title: "Page Sections", href: "/web-store/pages" },
      { title: "Courier Services", href: "/web-store/couriers" },
      { title: "Contact Submissions", href: "/web-store/contacts" },
    ],
  },
  {
    title: "Admin",
    href: "/admin",
    icon: "Shield",
    children: [
      { title: "Users", href: "/admin/users" },
      { title: "Roles & Permissions", href: "/admin/roles" },
      { title: "Bulk Discount Rules", href: "/admin/discount-rules" },
      { title: "Stock Alert Rules", href: "/admin/stock-alerts" },
      { title: "Audit Log", href: "/admin/audit-log" },
    ],
  },
];

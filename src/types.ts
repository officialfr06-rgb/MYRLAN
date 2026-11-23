export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  oldPrice?: number;
  image: string;
  rating: number;
  reviewsCount: number;
  stock: number;
  description: string;
  ingredients: string[];
  usage: string;
  tags: ('Bio' | 'Vegan' | 'Sans Paraben' | 'Promo' | 'Best-seller' | 'Hypoallergénique')[];
  volume: string;
  ean: string;
  form: string;
  presentation: string;
  contenance: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  isCompany?: boolean;
  companyName?: string;
  vatNumber?: string;
  useDifferentBilling?: boolean;
  billingAddress?: {
    fullName: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
}

export interface SavedAddress {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export type PaymentMethod = 'card' | 'cod';
export type ShippingCarrier = 'colissimo' | 'chronopost' | 'mondial_relay' | 'click_and_collect';
export type OrderStatus = 'En préparation' | 'Expédié' | 'En cours de livraison' | 'Livré';

export interface ReturnRequest {
  id: string;
  orderId: string;
  reason: string;
  details: string;
  status: 'En cours d\'examen' | 'Approuvé' | 'Remboursé';
  createdAt: string;
}

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  subtotal?: number;
  discountAmount?: number;
  shippingFee?: number;
  promoCode?: string;
  totalAmount: number;
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  carrier: ShippingCarrier;
  status: OrderStatus;
  trackingNumber: string;
  loyaltyPointsEarned: number;
  userId?: string;
  returnRequest?: ReturnRequest;
}

export interface Review {
  id: string;
  productId: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface LoyaltyAccount {
  points: number;
  tier: 'Bronze' | 'Silver' | 'Gold';
  history: {
    id: string;
    date: string;
    description: string;
    points: number;
  }[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'pharmacist';
  senderName?: string;
  text: string;
  timestamp: string;
  createdAt?: string;
}

export interface ChatSession {
  id: string;
  visitorName: string;
  visitorEmail?: string;
  userId?: string;
  status: 'Ouvert' | 'Résolu';
  unreadByAdmin: number;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  skinType?: string;
  concerns?: string[];
  avatar?: string;
  savedAddresses?: SavedAddress[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'customer';
  skinType?: string;
  concerns?: string[];
  savedAddresses?: SavedAddress[];
}

export interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'customer';
  createdAt?: string;
  ordersCount: number;
  totalSpent: number;
}

export interface PromoCode {
  id: string;
  code: string;
  discountPercent: number;
  minOrder: number;
  description: string;
  active: boolean;
  expiresAt?: string;
}

export type PrescriptionStatus = 'En attente' | 'Validée par le pharmacien' | 'Prête en officine' | 'Refusée';

export interface Prescription {
  id: string;
  patientName: string;
  email: string;
  phone: string;
  deliveryMode: 'click_and_collect' | 'delivery';
  notes: string;
  fileUrl: string;
  fileName: string;
  status: PrescriptionStatus;
  pharmacistNote?: string;
  createdAt: string;
  userId?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'Nouveau' | 'Traité';
  createdAt: string;
}

export interface WebmasterRedirect {
  id: string;
  fromPath: string;
  toPath: string;
  statusCode: 301 | 302;
  active: boolean;
  hits: number;
  createdAt: string;
}

export interface WebmasterConfig {
  siteTitle: string;
  siteDescription: string;
  canonicalBaseUrl: string;
  ogImageUrl: string;
  googleSiteVerification: string;
  bingSiteVerification: string;
  gaMeasurementId: string;
  robotsTxt: string;
  sitemapIncludeProducts: boolean;
  sitemapChangeFreq: 'daily' | 'weekly' | 'monthly';
  enablePharmacyJsonLd: boolean;
  enableProductJsonLd: boolean;
  redirects: WebmasterRedirect[];
  updatedAt: string;
}

export interface WebmasterUrlCheck {
  url: string;
  label: string;
  category: 'Fichier SEO' | 'Page' | 'Produit' | 'Média';
  status: number | 'OK' | 'Erreur';
  ok: boolean;
  note: string;
}

export type AppointmentServiceType =
  | 'vaccination'
  | 'trod_angine'
  | 'bilan_medication'
  | 'conseil_dermo'
  | 'suivi_maternite';

export type AppointmentFormat = 'officine' | 'visio';
export type AppointmentStatus = 'Confirmé' | 'Terminé' | 'Annulé';

export interface PharmacyAppointment {
  id: string;
  serviceType: AppointmentServiceType;
  serviceLabel: string;
  durationMinutes: number;
  format: AppointmentFormat;
  date: string;
  timeSlot: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  notes?: string;
  pharmacistNote?: string;
  status: AppointmentStatus;
  createdAt: string;
  userId?: string;
}

export type SafetySensitivityProfile = 'standard' | 'pregnancy' | 'sensitive' | 'child';

export interface SafetyFinding {
  id: string;
  severity: 'info' | 'warning';
  title: string;
  detail: string;
  productIds: string[];
}

export interface ProductSafetySummary {
  pregnancyStatus: 'compatible' | 'caution';
  pregnancyNote: string;
  minimumAgeLabel: string;
  sensitiveSkinNote: string;
  keyActives: string[];
  findings: SafetyFinding[];
}

export interface CartSafetyReport {
  profile: SafetySensitivityProfile;
  findings: SafetyFinding[];
  timingTips: string[];
  checkedCount: number;
}

export type SecurityEventSeverity = 'info' | 'warning' | 'critical';

export interface SecurityLogEntry {
  id: string;
  timestamp: string;
  category: 'auth' | 'anti_sabotage' | 'medical_privacy' | 'admin' | 'phishing_guard';
  severity: SecurityEventSeverity;
  event: string;
  detail: string;
  actor: string;
  ip: string;
}

export interface ActiveRateBlock {
  key: string;
  scope: string;
  ip: string;
  attempts: number;
  blockedUntil: string;
  remainingMinutes: number;
}

export interface SecurityConfig {
  tokenEpoch: number;
  maxCodGuestAmount: number;
  maxOrderQtyPerItem: number;
  maxOrderTotalItems: number;
  officialDomain: string;
}

export interface AdminSecurityOverview {
  config: SecurityConfig;
  stats: {
    activeBlocksCount: number;
    failedLogins24h: number;
    blockedBotsOrFlood24h: number;
    protectedPrescriptionsCount: number;
    weakAdminAccountsCount: number;
  };
  weakAdminEmails: string[];
  activeBlocks: ActiveRateBlock[];
  logs: SecurityLogEntry[];
  securityTxtPreview: string;
  headersEnabled: { name: string; value: string }[];
}



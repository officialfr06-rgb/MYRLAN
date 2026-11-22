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
  text: string;
  timestamp: string;
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

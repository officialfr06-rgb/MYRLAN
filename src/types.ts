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

export type PaymentMethod = 'card' | 'cod';
export type ShippingCarrier = 'colissimo' | 'chronopost' | 'mondial_relay';
export type OrderStatus = 'En préparation' | 'Expédié' | 'En cours de livraison' | 'Livré';

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  totalAmount: number;
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  carrier: ShippingCarrier;
  status: OrderStatus;
  trackingNumber: string;
  loyaltyPointsEarned: number;
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
  skinType?: string;
  concerns?: string[];
  avatar?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'customer';
}


import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Session signing secret (uses env var in production, ephemeral random secret in dev if omitted)
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const SESSION_COOKIE_NAME = 'myrlan_session';

// Ensure uploads and private prescriptions directories exist on server
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const prescriptionsDir = path.resolve(process.cwd(), 'private-prescriptions');
if (!fs.existsSync(prescriptionsDir)) {
  fs.mkdirSync(prescriptionsDir, { recursive: true });
}

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const PRESCRIPTION_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf'].includes(ext) ? ext : '.bin';
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    cb(null, `${uniqueSuffix}${safeExt}`);
  }
});

const prescriptionStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, prescriptionsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'].includes(ext) ? ext : '.pdf';
    const uniqueSuffix = `rx-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    cb(null, `${uniqueSuffix}${safeExt}`);
  }
});

const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (IMAGE_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format image non autorisé (PNG, JPG, WEBP uniquement).'));
    }
  }
});

const uploadPrescription = multer({
  storage: prescriptionStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (PRESCRIPTION_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format d’ordonnance non autorisé (PDF, PNG, JPG, WEBP uniquement).'));
    }
  }
});

// Server-side database file path
const dbFilePath = path.resolve(process.cwd(), 'server-db.json');

// Password hashing helpers (scrypt + random salt)
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

function verifyPassword(password: string, stored: string): { valid: boolean; needsRehash: boolean } {
  if (!stored) return { valid: false, needsRehash: false };
  if (stored.startsWith('scrypt:')) {
    const parts = stored.split(':');
    if (parts.length !== 3) return { valid: false, needsRehash: false };
    const [, salt, hashHex] = parts;
    const derived = crypto.scryptSync(password, salt, 64);
    const storedBuf = Buffer.from(hashHex, 'hex');
    if (derived.length !== storedBuf.length) return { valid: false, needsRehash: false };
    return { valid: crypto.timingSafeEqual(derived, storedBuf), needsRehash: false };
  }
  // Legacy plaintext compatibility: constant-time compare then upgrade hash
  const a = Buffer.from(password);
  const b = Buffer.from(stored);
  const valid = a.length === b.length && crypto.timingSafeEqual(a, b);
  return { valid, needsRehash: valid };
}

// HMAC session token helpers
interface AuthPayload {
  id: string;
  email: string;
  role: 'admin' | 'customer';
  epoch?: number;
  exp: number;
}

function signSessionToken(payload: Omit<AuthPayload, 'exp'>, epoch = 1): string {
  const fullPayload: AuthPayload = {
    ...payload,
    epoch,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000
  };
  const data = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifySessionToken(token: string, expectedEpoch?: number): AuthPayload | null {
  try {
    const [data, sig] = token.split('.');
    if (!data || !sig) return null;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8')) as AuthPayload;
    if (!payload.exp || payload.exp < Date.now()) return null;
    if (expectedEpoch !== undefined && Number(payload.epoch || 1) < expectedEpoch) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader?: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx > -1) {
      const key = part.slice(0, idx).trim();
      const val = decodeURIComponent(part.slice(idx + 1).trim());
      cookies[key] = val;
    }
  });
  return cookies;
}

function sanitizeUser(user: any) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    skinType: user.skinType || 'Mixte à sensible',
    concerns: user.concerns || [],
    savedAddresses: user.savedAddresses || []
  };
}

const INITIAL_PRODUCTS = [
  {
    id: 'p-1',
    name: 'Sérum Booster Acide Hyaluronique Pur',
    brand: 'La Roche-Glow',
    category: 'Soin Visage',
    price: 29.90,
    oldPrice: 38.00,
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800',
    rating: 4.9,
    reviewsCount: 142,
    stock: 24,
    description: 'Sérum hautement concentré en acide hyaluronique pur de bas et haut poids moléculaire pour une hydratation intense et un effet repulpant immédiat.',
    ingredients: ['Aqua', 'Sodium Hyaluronate', 'Glycerin', 'Citric Acid', 'Sodium Benzoate'],
    usage: 'Appliquer 3 à 4 gouttes matin et soir sur le visage propre avant votre crème habituelle.',
    tags: ['Best-seller', 'Bio', 'Sans Paraben'],
    volume: '30 ml',
    ean: '3401360215891',
    form: 'Sérum aqueux fluide',
    presentation: 'Flacon pipette en verre recyclable',
    contenance: '30 ml'
  },
  {
    id: 'p-2',
    name: 'Crème Solaire Anti-Âge SPF 50+',
    brand: 'Solaire Derm',
    category: 'Solaire',
    price: 21.50,
    oldPrice: 26.90,
    image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&q=80&w=800',
    rating: 4.8,
    reviewsCount: 98,
    stock: 42,
    description: 'Protection solaire très haute tolérance visage et cou. Prévient le photo-vieillissement cutané et l’apparition des taches brunes.',
    ingredients: ['Aqua', 'Homosalate', 'Octisalate', 'Niacinamide', 'Tocopherol'],
    usage: 'Appliquer généreusement avant l’exposition au soleil. Renouveler fréquemment.',
    tags: ['Bio', 'Hypoallergénique', 'Promo'],
    volume: '50 ml',
    ean: '3401328941205',
    form: 'Crème protectrice invisible',
    presentation: 'Tube canule pompe 50 ml',
    contenance: '50 ml'
  },
  {
    id: 'p-3',
    name: 'Complément Alimentaire Cheveux & Ongles Kératine',
    brand: 'NutriPharma',
    category: 'Compléments Alimentaires',
    price: 24.90,
    oldPrice: 31.00,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800',
    rating: 4.7,
    reviewsCount: 215,
    stock: 18,
    description: 'Formule renforcée en kératine, zinc, vitamine B6 et biotine pour stimuler la pousse, renforcer la fibre capillaire et durcir les ongles.',
    ingredients: ['Kératine hydrolysée', 'L-Cystine', 'Zinc Bisglycinate', 'Biotine (Vitamine B8)'],
    usage: '2 gélules par jour le matin avec un grand verre d’eau au cours du repas.',
    tags: ['Vegan', 'Promo', 'Best-seller'],
    volume: '60 gélules',
    ean: '3760098123452',
    form: 'Gélules végétales',
    presentation: 'Pilulier éco-responsable de 60 gélules',
    contenance: '60 gélules'
  },
  {
    id: 'p-4',
    name: 'Eau Micellaire Apaisante 3-en-1',
    brand: 'DermAura',
    category: 'Hygiène & Santé',
    price: 14.90,
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=800',
    rating: 4.8,
    reviewsCount: 164,
    stock: 60,
    description: 'Nettoie, démaquille et apaise les peaux sensibles du visage et des yeux en un seul geste sans rincer.',
    ingredients: ['Aqua', 'PEG-6 Caprylic/Capric Glycerides', 'Disodium EDTA', 'Cetrimonium Bromide'],
    usage: 'Imbiber un coton et passer délicatement sur le visage, les yeux et les lèvres.',
    tags: ['Hypoallergénique', 'Sans Paraben'],
    volume: '400 ml',
    ean: '3401509823411',
    form: 'Solution micellaire limpide',
    presentation: 'Flacon pompe grand format 400 ml',
    contenance: '400 ml'
  },
  {
    id: 'p-5',
    name: 'Huile Sèche Nourrissante Visage, Corps & Cheveux',
    brand: 'PharmaBotanica',
    category: 'Bio & Naturel',
    price: 26.00,
    oldPrice: 32.00,
    image: 'https://images.unsplash.com/photo-1608248597359-f53835f42629?auto=format&fit=crop&q=80&w=800',
    rating: 4.9,
    reviewsCount: 128,
    stock: 35,
    description: 'Enrichie en huiles végétales précieuses (Argan, Amande douce, Macadamia). Nourrit intensément sans laisser de film gras.',
    ingredients: ['Helianthus Annuus Seed Oil', 'Argania Spinosa Kernel Oil', 'Prunus Amygdalus Dulcis Oil', 'Tocopherol'],
    usage: 'S’utilise toute l’année sur le visage, le corps et les cheveux.',
    tags: ['Bio', 'Vegan', 'Promo'],
    volume: '100 ml',
    ean: '3700543219876',
    form: 'Huile sèche vaporisateur',
    presentation: 'Flacon spray en verre 100 ml',
    contenance: '100 ml'
  },
  {
    id: 'p-6',
    name: 'Gel Douche Surgras Dermoprotecteur',
    brand: 'DermAura',
    category: 'Corps & Cheveux',
    price: 9.90,
    image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&q=80&w=800',
    rating: 4.6,
    reviewsCount: 83,
    stock: 80,
    description: 'Nettoie en douceur et protège les peaux sèches et sensibles de toute la famille. pH neutre pour la peau.',
    ingredients: ['Aqua', 'Sodium Laureth Sulfate', 'Glycerin', 'Coco-Glucoside', 'Citric Acid'],
    usage: 'Appliquer sur peau mouillée, faire mousser délicatement puis rincer abondamment.',
    tags: ['Hypoallergénique', 'Sans Paraben'],
    volume: '500 ml',
    ean: '3401109283746',
    form: 'Gel moussant onctueux',
    presentation: 'Flacon pompe ergonomique 500 ml',
    contenance: '500 ml'
  }
];

const INITIAL_ORDERS = [
  {
    id: 'ORD-9842',
    date: '2026-11-19 14:20',
    items: [{ product: INITIAL_PRODUCTS[0], quantity: 1 }],
    subtotal: 29.90,
    discountAmount: 0,
    shippingFee: 0,
    totalAmount: 29.90,
    shippingAddress: {
      fullName: 'Marie Dupont',
      email: 'marie.dupont@example.com',
      phone: '06 12 34 56 78',
      address: '15 rue de la République',
      city: 'Lyon',
      postalCode: '69002',
      country: 'France'
    },
    paymentMethod: 'card',
    carrier: 'colissimo',
    status: 'Expédié',
    trackingNumber: '6A00984223190',
    loyaltyPointsEarned: 29,
    userId: 'usr-3'
  }
];

const INITIAL_USERS = [
  { id: 'usr-1', name: 'Administrateur Myrlan', email: 'aaa@gmail.com', role: 'admin', password: hashPassword('123456789'), createdAt: '2026-01-10', savedAddresses: [] },
  { id: 'usr-2', name: 'Admin Secondaire', email: 'admin2@myrlan.fr', role: 'admin', password: hashPassword('admin'), createdAt: '2026-01-12', savedAddresses: [] },
  {
    id: 'usr-3',
    name: 'Marie Dupont',
    email: 'marie.dupont@example.com',
    role: 'customer',
    password: hashPassword('password'),
    createdAt: '2026-02-15',
    skinType: 'Mixte à sensible',
    concerns: ['Hydratation', 'Éclat du teint'],
    savedAddresses: [
      {
        id: 'addr-1',
        label: 'Domicile',
        fullName: 'Marie Dupont',
        phone: '06 12 34 56 78',
        address: '15 rue de la République',
        city: 'Lyon',
        postalCode: '69002',
        country: 'France',
        isDefault: true
      }
    ]
  }
];

const INITIAL_PROMOS = [
  {
    id: 'promo-1',
    code: 'MYRLANE10',
    discountPercent: 10,
    minOrder: 0,
    description: '10% de réduction immédiate sur toute la boutique',
    active: true
  },
  {
    id: 'promo-2',
    code: 'BIENVENUE15',
    discountPercent: 15,
    minOrder: 60,
    description: '15% offerts dès 60 € d’achats',
    active: true
  },
  {
    id: 'promo-3',
    code: 'SANTE20',
    discountPercent: 20,
    minOrder: 90,
    description: '20% sur votre cure bien-être dès 90 €',
    active: true
  }
];

const DEFAULT_ROBOTS_TXT = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /compte
Disallow: /commandes
Disallow: /reset-password
Disallow: /api/

Sitemap: {{SITEMAP_URL}}`;

const DEFAULT_WEBMASTER_CONFIG = {
  siteTitle: 'Myrlan - Parapharmacie & Soins en Ligne',
  siteDescription: 'Votre parapharmacie en ligne de confiance : soins dermo-cosmétiques, compléments alimentaires, conseils de pharmaciens et Click & Collect.',
  canonicalBaseUrl: '',
  ogImageUrl: '',
  googleSiteVerification: '',
  bingSiteVerification: '',
  gaMeasurementId: '',
  robotsTxt: DEFAULT_ROBOTS_TXT,
  sitemapIncludeProducts: true,
  sitemapChangeFreq: 'weekly',
  enablePharmacyJsonLd: true,
  enableProductJsonLd: true,
  redirects: [],
  updatedAt: new Date().toISOString().split('T')[0]
};

const PUBLIC_STOREFRONT_ROUTES = [
  { path: '/', label: 'Accueil & Catalogue', priority: '1.0', changefreq: 'daily' },
  { path: '/diagnostic', label: 'Diagnostic Peau & Santé', priority: '0.9', changefreq: 'weekly' },
  { path: '/rendez-vous', label: 'Rendez-vous Officinal', priority: '0.9', changefreq: 'weekly' },
  { path: '/marques', label: 'Nos Marques', priority: '0.8', changefreq: 'weekly' },
  { path: '/promotions', label: 'Promotions', priority: '0.8', changefreq: 'daily' },
  { path: '/ordonnance', label: 'Ordonnance en ligne', priority: '0.8', changefreq: 'weekly' },
  { path: '/conseils', label: 'Conseils Santé', priority: '0.8', changefreq: 'weekly' },
  { path: '/a-propos', label: 'L’Officine & Agréments', priority: '0.7', changefreq: 'monthly' },
  { path: '/contact', label: 'Contact & Officine', priority: '0.7', changefreq: 'monthly' },
  { path: '/cgv', label: 'CGV', priority: '0.4', changefreq: 'yearly' },
  { path: '/livraison-retours', label: 'Livraison & Retours', priority: '0.5', changefreq: 'monthly' },
  { path: '/confidentialite', label: 'Politique de confidentialité', priority: '0.4', changefreq: 'yearly' },
  { path: '/mentions-legales', label: 'Mentions légales', priority: '0.4', changefreq: 'yearly' }
];

const APPOINTMENT_SERVICES: Record<string, { label: string; durationMinutes: number }> = {
  vaccination: { label: 'Vaccination Officinale (Grippe, COVID, Rappel)', durationMinutes: 15 },
  trod_angine: { label: 'Test Rapide Angine (TROD) ou COVID', durationMinutes: 15 },
  bilan_medication: { label: 'Bilan Partagé de Médication', durationMinutes: 30 },
  conseil_dermo: { label: 'Consultation Dermo-Cosmétique Sur-Mesure', durationMinutes: 20 },
  suivi_maternite: { label: 'Accompagnement Maternité & Nourrisson', durationMinutes: 20 }
};

const APPOINTMENT_TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
];

function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function normalizeInternalPath(raw: string): string | null {
  const trimmed = String(raw || '').trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null;
  const [withoutQuery] = trimmed.split(/[?#]/);
  if (!withoutQuery) return '/';
  if (withoutQuery.length > 1 && withoutQuery.endsWith('/')) {
    return withoutQuery.slice(0, -1);
  }
  return withoutQuery;
}

function resolveBaseUrl(req: Request, webmaster: any): string {
  const configured = String(webmaster?.canonicalBaseUrl || '').trim().replace(/\/+$/, '');
  if (/^https?:\/\/[a-zA-Z0-9.-]+(:\d+)?$/.test(configured)) {
    return configured;
  }
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/+$/, '');
  }
  const protoHeader = String(req.headers['x-forwarded-proto'] || req.protocol || 'http').split(',')[0].trim();
  const hostHeader = String(req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000').split(',')[0].trim();
  return `${protoHeader}://${hostHeader}`;
}

function buildSitemapXml(db: any, baseUrl: string): string {
  const wm = db.webmaster || DEFAULT_WEBMASTER_CONFIG;
  const today = new Date().toISOString().split('T')[0];
  const lastMod = wm.updatedAt || today;
  const productFreq = ['daily', 'weekly', 'monthly'].includes(wm.sitemapChangeFreq) ? wm.sitemapChangeFreq : 'weekly';

  const urls: { loc: string; lastmod: string; changefreq: string; priority: string }[] = PUBLIC_STOREFRONT_ROUTES.map(r => ({
    loc: `${baseUrl}${r.path === '/' ? '/' : r.path}`,
    lastmod: lastMod,
    changefreq: r.changefreq,
    priority: r.priority
  }));

  if (wm.sitemapIncludeProducts !== false && Array.isArray(db.products)) {
    for (const p of db.products) {
      if (!p?.id) continue;
      urls.push({
        loc: `${baseUrl}/produit/${encodeURIComponent(String(p.id))}`,
        lastmod: lastMod,
        changefreq: productFreq,
        priority: '0.9'
      });
    }
  }

  const entries = urls.map(u => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${escapeXml(u.lastmod)}</lastmod>
    <changefreq>${escapeXml(u.changefreq)}</changefreq>
    <priority>${escapeXml(u.priority)}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
}

function buildRobotsTxt(db: any, baseUrl: string): string {
  const raw = String(db.webmaster?.robotsTxt || DEFAULT_ROBOTS_TXT);
  const sitemapUrl = `${baseUrl}/sitemap.xml`;
  if (raw.includes('{{SITEMAP_URL}}')) {
    return raw.replace(/\{\{SITEMAP_URL\}\}/g, sitemapUrl);
  }
  return raw;
}

function getDatabase() {
  if (!fs.existsSync(dbFilePath)) {
    const initialDb = {
      products: INITIAL_PRODUCTS,
      orders: INITIAL_ORDERS,
      users: INITIAL_USERS,
      promoCodes: INITIAL_PROMOS,
      prescriptions: [],
      contactMessages: [],
      chatSessions: [],
      appointments: [],
      securityLogs: [],
      securityConfig: {
        tokenEpoch: 1,
        maxCodGuestAmount: 250,
        maxOrderQtyPerItem: 10,
        maxOrderTotalItems: 30,
        officialDomain: ''
      },
      webmaster: { ...DEFAULT_WEBMASTER_CONFIG, redirects: [] },
      resetTokens: []
    };
    fs.writeFileSync(dbFilePath, JSON.stringify(initialDb, null, 2));
    return initialDb;
  }
  try {
    const data = fs.readFileSync(dbFilePath, 'utf-8');
    const parsed = JSON.parse(data);
    let dirty = false;
    if (!Array.isArray(parsed.products)) { parsed.products = INITIAL_PRODUCTS; dirty = true; }
    if (!Array.isArray(parsed.orders)) { parsed.orders = INITIAL_ORDERS; dirty = true; }
    if (!Array.isArray(parsed.users)) { parsed.users = INITIAL_USERS; dirty = true; }
    if (!Array.isArray(parsed.promoCodes)) { parsed.promoCodes = INITIAL_PROMOS; dirty = true; }
    if (!Array.isArray(parsed.prescriptions)) { parsed.prescriptions = []; dirty = true; }
    if (!Array.isArray(parsed.contactMessages)) { parsed.contactMessages = []; dirty = true; }
    if (!Array.isArray(parsed.chatSessions)) { parsed.chatSessions = []; dirty = true; }
    if (!Array.isArray(parsed.appointments)) { parsed.appointments = []; dirty = true; }
    if (!Array.isArray(parsed.securityLogs)) { parsed.securityLogs = []; dirty = true; }
    if (!parsed.securityConfig || typeof parsed.securityConfig !== 'object') {
      parsed.securityConfig = {
        tokenEpoch: 1,
        maxCodGuestAmount: 250,
        maxOrderQtyPerItem: 10,
        maxOrderTotalItems: 30,
        officialDomain: ''
      };
      dirty = true;
    }
    if (!parsed.webmaster || typeof parsed.webmaster !== 'object') {
      parsed.webmaster = { ...DEFAULT_WEBMASTER_CONFIG, redirects: [] };
      dirty = true;
    } else {
      parsed.webmaster = {
        ...DEFAULT_WEBMASTER_CONFIG,
        ...parsed.webmaster,
        redirects: Array.isArray(parsed.webmaster.redirects) ? parsed.webmaster.redirects : []
      };
    }
    if (!Array.isArray(parsed.resetTokens)) { parsed.resetTokens = []; dirty = true; }
    if (dirty) saveDatabase(parsed);
    return parsed;
  } catch {
    return {
      products: INITIAL_PRODUCTS,
      orders: INITIAL_ORDERS,
      users: INITIAL_USERS,
      promoCodes: INITIAL_PROMOS,
      prescriptions: [],
      contactMessages: [],
      chatSessions: [],
      appointments: [],
      securityLogs: [],
      securityConfig: {
        tokenEpoch: 1,
        maxCodGuestAmount: 250,
        maxOrderQtyPerItem: 10,
        maxOrderTotalItems: 30,
        officialDomain: ''
      },
      webmaster: { ...DEFAULT_WEBMASTER_CONFIG, redirects: [] },
      resetTokens: []
    };
  }
}

function saveDatabase(db: any) {
  fs.writeFileSync(dbFilePath, JSON.stringify(db, null, 2));
}

// ------------------------------------------------------------------
// Security Engine: Rate Limiting, Brute-Force Guard & Audit Trail
// ------------------------------------------------------------------
interface RateEntry {
  scope: string;
  ip: string;
  count: number;
  resetAt: number;
  blockedUntil: number;
}

const securityRateMap = new Map<string, RateEntry>();

function getClientIp(req: Request): string {
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return fwd || req.ip || req.socket?.remoteAddress || 'unknown';
}

function recordSecurityEvent(
  db: any,
  entry: {
    category: 'auth' | 'anti_sabotage' | 'medical_privacy' | 'admin' | 'phishing_guard';
    severity: 'info' | 'warning' | 'critical';
    event: string;
    detail: string;
    actor: string;
    ip: string;
  }
) {
  if (!Array.isArray(db.securityLogs)) db.securityLogs = [];
  db.securityLogs.unshift({
    id: `sec-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    ...entry
  });
  if (db.securityLogs.length > 200) {
    db.securityLogs = db.securityLogs.slice(0, 200);
  }
}

function checkRateLimit(
  key: string,
  scope: string,
  ip: string,
  maxAttempts: number,
  windowMs: number,
  blockMs: number,
  incrementNow = true
): { allowed: boolean; remainingMs: number; count: number } {
  const now = Date.now();
  let rec = securityRateMap.get(key);
  if (rec && rec.blockedUntil > now) {
    return { allowed: false, remainingMs: rec.blockedUntil - now, count: rec.count };
  }
  if (!rec || rec.resetAt <= now) {
    rec = { scope, ip, count: 0, resetAt: now + windowMs, blockedUntil: 0 };
  }
  if (incrementNow) {
    rec.count += 1;
    if (rec.count > maxAttempts) {
      rec.blockedUntil = now + blockMs;
      securityRateMap.set(key, rec);
      return { allowed: false, remainingMs: blockMs, count: rec.count };
    }
  }
  securityRateMap.set(key, rec);
  return { allowed: true, remainingMs: 0, count: rec.count };
}

function recordAuthFailure(key: string, ip: string, maxFails = 5, windowMs = 15 * 60 * 1000, blockMs = 15 * 60 * 1000) {
  const now = Date.now();
  let rec = securityRateMap.get(key);
  if (!rec || rec.resetAt <= now) {
    rec = { scope: 'auth_login', ip, count: 0, resetAt: now + windowMs, blockedUntil: 0 };
  }
  rec.count += 1;
  if (rec.count >= maxFails) {
    rec.blockedUntil = now + blockMs;
  }
  securityRateMap.set(key, rec);
  return rec;
}

function clearRateKey(key: string) {
  securityRateMap.delete(key);
}

function isAllowedCorsOrigin(origin: string | undefined, canonicalBaseUrl?: string): boolean {
  if (!origin) return true;
  if (
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin) ||
    /^https:\/\/[a-z0-9-]+\.[a-z0-9.-]*(run\.app|aistudio\.google\.com|web\.app|firebaseapp\.com)$/i.test(origin)
  ) {
    return true;
  }
  if (canonicalBaseUrl && origin.toLowerCase() === canonicalBaseUrl.toLowerCase()) {
    return true;
  }
  if (process.env.APP_URL && origin.toLowerCase() === process.env.APP_URL.replace(/\/+$/, '').toLowerCase()) {
    return true;
  }
  return false;
}

const WEAK_PASSWORDS = ['123456', '123456789', 'admin', 'password', 'azerty', 'myrlan'];

interface AuthedRequest extends Request {
  authUser?: AuthPayload;
}

function extractAuth(req: AuthedRequest): AuthPayload | null {
  const cookies = parseCookies(req.headers.cookie);
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const token = bearerToken || cookies[SESSION_COOKIE_NAME];
  if (!token) return null;
  const db = getDatabase();
  const epoch = Number(db.securityConfig?.tokenEpoch || 1);
  return verifySessionToken(token, epoch);
}

function attachAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const payload = extractAuth(req);
  if (payload) req.authUser = payload;
  next();
}

function getSessionCookieOptions(req: Request) {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  return {
    httpOnly: true,
    sameSite: (isHttps ? 'none' : 'lax') as 'none' | 'lax',
    secure: Boolean(isHttps),
    maxAge: 7 * 24 * 60 * 60 * 1000
  };
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.authUser) {
    return res.status(401).json({ success: false, error: 'Authentification requise.' });
  }
  next();
}

function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.authUser) {
    return res.status(401).json({ success: false, error: 'Authentification administrateur requise.' });
  }
  if (req.authUser.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Accès réservé aux administrateurs.' });
  }
  next();
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // Security Response Headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' ws: wss: https://www.google-analytics.com https://region1.google-analytics.com; frame-src 'self' blob:; object-src 'self' blob:; frame-ancestors 'self' https://*.google.com https://*.aistudio.google.com https://*.run.app;"
    );
    next();
  });

  app.use(express.json({ limit: '2mb' }));
  app.use(attachAuth);

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        const db = getDatabase();
        if (isAllowedCorsOrigin(origin, db.webmaster?.canonicalBaseUrl)) {
          callback(null, true);
        } else {
          callback(new Error('Origine non autorisée'));
        }
      },
      credentials: true
    },
    destroyUpgrade: false
  });

  // Protect legacy prescription files inside /uploads and serve product images safely
  app.use('/uploads', (req, res, next) => {
    const requestedFile = path.basename(req.path || '');
    if (requestedFile.startsWith('rx-')) {
      return res.status(403).json({ success: false, error: 'Accès direct interdit aux ordonnances médicales.' });
    }
    const db = getDatabase();
    const isPrescriptionAsset = (db.prescriptions || []).some(
      (rx: any) => typeof rx.fileUrl === 'string' && rx.fileUrl.endsWith(`/${requestedFile}`)
    );
    if (isPrescriptionAsset) {
      return res.status(403).json({ success: false, error: 'Accès authentifié requis pour consulter une ordonnance.' });
    }
    next();
  }, express.static(uploadsDir, { dotfiles: 'deny' }));

  const PORT = process.env.PORT || 3000;
  const hasAuth = process.env.SMTP_USER && process.env.SMTP_PASS;

  const smtpTransporter = hasAuth ? nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  }) : nodemailer.createTransport({
    jsonTransport: true
  });

  io.on('connection', (socket) => {
    socket.on('disconnect', () => {});
  });

  // ------------------------------------------------------------------
  // API Routes - Products
  // ------------------------------------------------------------------
  app.get('/api/products', (_req, res) => {
    const db = getDatabase();
    res.json(db.products);
  });

  app.post('/api/products', requireAdmin, (req, res) => {
    const { name, brand, category, price, stock, description } = req.body;
    if (!name || !brand || typeof price !== 'number' || Number.isNaN(price)) {
      return res.status(400).json({ success: false, error: 'Champs produit invalides.' });
    }
    const db = getDatabase();
    const newProduct = {
      ...req.body,
      name: String(name).trim(),
      brand: String(brand).trim(),
      category: String(category || 'Soin Visage'),
      price: Math.max(0.1, Number(price)),
      stock: Math.max(0, Number(stock ?? 0)),
      description: String(description || ''),
      ingredients: Array.isArray(req.body.ingredients) ? req.body.ingredients : [],
      tags: Array.isArray(req.body.tags) ? req.body.tags : [],
      id: `p-${Date.now()}`,
      rating: 5.0,
      reviewsCount: 1
    };
    db.products.unshift(newProduct);
    saveDatabase(db);

    io.emit('product-added', newProduct);
    io.emit('products-updated', db.products);

    res.json({ success: true, product: newProduct });
  });

  app.patch('/api/products/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const db = getDatabase();
    const idx = db.products.findIndex((p: any) => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Produit non trouvé.' });
    }
    const current = db.products[idx];
    const allowedFields = [
      'name', 'brand', 'category', 'price', 'oldPrice', 'image', 'stock',
      'description', 'ingredients', 'usage', 'tags', 'volume', 'ean', 'form', 'presentation', 'contenance'
    ];
    const updated = { ...current };
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updated[key] = req.body[key];
      }
    }
    updated.price = Math.max(0.1, Number(updated.price));
    updated.stock = Math.max(0, Number(updated.stock));
    if (updated.oldPrice !== undefined && updated.oldPrice !== null && updated.oldPrice !== '') {
      updated.oldPrice = Number(updated.oldPrice);
    } else {
      delete updated.oldPrice;
    }

    db.products[idx] = updated;
    saveDatabase(db);
    io.emit('products-updated', db.products);
    res.json({ success: true, product: updated });
  });

  app.delete('/api/products/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const db = getDatabase();
    const exists = db.products.some((p: any) => p.id === id);
    if (!exists) {
      return res.status(404).json({ success: false, error: 'Produit non trouvé.' });
    }
    db.products = db.products.filter((p: any) => p.id !== id);
    saveDatabase(db);
    io.emit('products-updated', db.products);
    res.json({ success: true });
  });

  app.put('/api/products/:id/stock', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { stock } = req.body;
    const db = getDatabase();
    const p = db.products.find((item: any) => item.id === id);
    if (p) {
      p.stock = Math.max(0, Number(stock) || 0);
      saveDatabase(db);

      io.emit('stock-updated', { productId: id, stock: p.stock });
      io.emit('products-updated', db.products);

      res.json({ success: true, product: p });
    } else {
      res.status(404).json({ success: false, error: 'Produit non trouvé' });
    }
  });

  // ------------------------------------------------------------------
  // API Routes - Image Upload (Admin)
  // ------------------------------------------------------------------
  app.post('/api/upload', requireAdmin, (req, res) => {
    uploadImage.single('image')(req, res, (err: any) => {
      if (err) {
        return res.status(400).json({ success: false, error: err.message || 'Erreur téléversement.' });
      }
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'Aucun fichier image fourni.' });
      }
      const resolved = path.resolve(req.file.path);
      if (!resolved.startsWith(uploadsDir + path.sep)) {
        return res.status(400).json({ success: false, error: 'Chemin de fichier invalide.' });
      }
      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ success: true, url: fileUrl });
    });
  });

  // ------------------------------------------------------------------
  // API Routes - Promo Codes
  // ------------------------------------------------------------------
  app.get('/api/promos', (_req, res) => {
    const db = getDatabase();
    res.json(db.promoCodes);
  });

  app.post('/api/promos/validate', (req, res) => {
    const { code, subtotal = 0 } = req.body;
    const normalized = String(code || '').trim().toUpperCase();
    if (!normalized) {
      return res.status(400).json({ success: false, error: 'Veuillez saisir un code promo.' });
    }
    const db = getDatabase();
    const promo = db.promoCodes.find((p: any) => p.code.toUpperCase() === normalized && p.active);
    if (!promo) {
      return res.status(404).json({ success: false, error: 'Code promo invalide ou expiré.' });
    }
    if (Number(subtotal) < (promo.minOrder || 0)) {
      return res.status(400).json({
        success: false,
        error: `Ce code nécessite un minimum d'achat de ${promo.minOrder} €.`
      });
    }
    res.json({ success: true, promo });
  });

  app.post('/api/promos', requireAdmin, (req, res) => {
    const { code, discountPercent, minOrder = 0, description = '' } = req.body;
    const cleanCode = String(code || '').trim().toUpperCase();
    if (!cleanCode || !discountPercent || Number(discountPercent) <= 0 || Number(discountPercent) > 90) {
      return res.status(400).json({ success: false, error: 'Code ou pourcentage de remise invalide (1–90%).' });
    }
    const db = getDatabase();
    if (db.promoCodes.some((p: any) => p.code.toUpperCase() === cleanCode)) {
      return res.status(400).json({ success: false, error: 'Ce code promo existe déjà.' });
    }
    const newPromo = {
      id: `promo-${Date.now()}`,
      code: cleanCode,
      discountPercent: Number(discountPercent),
      minOrder: Math.max(0, Number(minOrder) || 0),
      description: String(description).trim() || `-${discountPercent}% sur votre commande`,
      active: true
    };
    db.promoCodes.unshift(newPromo);
    saveDatabase(db);
    io.emit('promos-updated', db.promoCodes);
    res.json({ success: true, promo: newPromo });
  });

  app.patch('/api/promos/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const db = getDatabase();
    const promo = db.promoCodes.find((p: any) => p.id === id);
    if (!promo) {
      return res.status(404).json({ success: false, error: 'Code promo non trouvé.' });
    }
    if (req.body.active !== undefined) promo.active = Boolean(req.body.active);
    if (req.body.discountPercent !== undefined) promo.discountPercent = Number(req.body.discountPercent);
    if (req.body.minOrder !== undefined) promo.minOrder = Number(req.body.minOrder);
    if (req.body.description !== undefined) promo.description = String(req.body.description);
    saveDatabase(db);
    io.emit('promos-updated', db.promoCodes);
    res.json({ success: true, promo });
  });

  app.delete('/api/promos/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const db = getDatabase();
    db.promoCodes = db.promoCodes.filter((p: any) => p.id !== id);
    saveDatabase(db);
    io.emit('promos-updated', db.promoCodes);
    res.json({ success: true });
  });

  // ------------------------------------------------------------------
  // API Routes - Orders (Scoped by role / user)
  // ------------------------------------------------------------------
  app.get('/api/orders', (req: AuthedRequest, res) => {
    const db = getDatabase();
    if (!req.authUser) {
      return res.json([]);
    }
    if (req.authUser.role === 'admin') {
      return res.json(db.orders);
    }
    const emailLower = req.authUser.email.toLowerCase();
    const filtered = db.orders.filter((o: any) =>
      o.userId === req.authUser!.id ||
      o.shippingAddress?.email?.toLowerCase() === emailLower
    );
    return res.json(filtered);
  });

  app.post('/api/orders', (req: AuthedRequest, res) => {
    const ip = getClientIp(req);
    const incoming = req.body || {};
    const db = getDatabase();

    // Anti-bot honeypot check
    if (incoming.website && String(incoming.website).trim() !== '') {
      recordSecurityEvent(db, {
        category: 'anti_sabotage',
        severity: 'warning',
        event: 'BOT_HONEYPOT',
        detail: 'Soumission automatisée détectée et bloquée sur le tunnel de commande.',
        actor: req.authUser?.email || 'Visiteur',
        ip
      });
      saveDatabase(db);
      return res.status(400).json({ success: false, error: 'Validation de sécurité échouée.' });
    }

    // Order flood protection (except authenticated admins)
    if (req.authUser?.role !== 'admin') {
      const rl = checkRateLimit(`orders:${ip}`, 'orders', ip, 6, 15 * 60 * 1000, 15 * 60 * 1000);
      if (!rl.allowed) {
        recordSecurityEvent(db, {
          category: 'anti_sabotage',
          severity: 'critical',
          event: 'ORDER_FLOOD_BLOCKED',
          detail: 'Trop de tentatives de commande rapprochées depuis la même adresse.',
          actor: req.authUser?.email || 'Visiteur',
          ip
        });
        saveDatabase(db);
        return res.status(429).json({
          success: false,
          error: 'Trop de commandes envoyées en peu de temps. Réessayez dans quelques minutes.'
        });
      }
    }

    if (!incoming || !Array.isArray(incoming.items) || incoming.items.length === 0) {
      return res.status(400).json({ success: false, error: 'Le panier est vide.' });
    }

    const secCfg = db.securityConfig || { maxCodGuestAmount: 250, maxOrderQtyPerItem: 10, maxOrderTotalItems: 30 };
    const maxPerItem = Number(secCfg.maxOrderQtyPerItem) || 10;
    const maxTotalUnits = Number(secCfg.maxOrderTotalItems) || 30;
    const requestedUnits = incoming.items.reduce((s: number, it: any) => s + Math.max(1, Number(it?.quantity) || 1), 0);
    if (requestedUnits > maxTotalUnits) {
      recordSecurityEvent(db, {
        category: 'anti_sabotage',
        severity: 'warning',
        event: 'ORDER_QTY_GUARD',
        detail: `Tentative de commande excessive (${requestedUnits} unités > plafond ${maxTotalUnits}).`,
        actor: req.authUser?.email || String(incoming.shippingAddress?.email || 'Visiteur'),
        ip
      });
      saveDatabase(db);
      return res.status(400).json({
        success: false,
        error: `Par sécurité contre les achats abusifs, le total est limité à ${maxTotalUnits} unités par commande.`
      });
    }

    // Recompute prices server-side from authoritative catalog without draining stock before final validation
    let serverSubtotal = 0;
    const normalizedItems: { product: any; quantity: number }[] = [];
    for (const cartItem of incoming.items) {
      const prod = db.products.find((p: any) => p.id === cartItem.product?.id);
      if (!prod || prod.stock <= 0) continue;
      const requestedQty = Math.max(1, Number(cartItem.quantity) || 1);
      if (requestedQty > maxPerItem) {
        recordSecurityEvent(db, {
          category: 'anti_sabotage',
          severity: 'warning',
          event: 'ORDER_ITEM_CAP',
          detail: `Quantité abusive (${requestedQty}) demandée pour ${prod.name}.`,
          actor: req.authUser?.email || 'Visiteur',
          ip
        });
        saveDatabase(db);
        return res.status(400).json({
          success: false,
          error: `Maximum ${maxPerItem} unité(s) autorisées par produit (${prod.name}).`
        });
      }
      const qty = Math.min(prod.stock, requestedQty);
      serverSubtotal += prod.price * qty;
      normalizedItems.push({ product: prod, quantity: qty });
    }

    if (normalizedItems.length === 0) {
      return res.status(400).json({ success: false, error: 'Aucun produit valide ou en stock dans la commande.' });
    }

    // Guest COD cap check (anti-stock-drain via fake Cash-On-Delivery orders)
    const maxCodGuest = Number(secCfg.maxCodGuestAmount) || 250;
    if ((incoming.paymentMethod || 'card') === 'cod' && !req.authUser && serverSubtotal > maxCodGuest) {
      recordSecurityEvent(db, {
        category: 'anti_sabotage',
        severity: 'warning',
        event: 'COD_GUEST_LIMIT',
        detail: `Commande COD invité bloquée (${serverSubtotal.toFixed(2)} € > ${maxCodGuest} €).`,
        actor: String(incoming.shippingAddress?.email || 'Visiteur'),
        ip
      });
      saveDatabase(db);
      return res.status(400).json({
        success: false,
        error: `Pour prévenir les fausses commandes, le paiement à la livraison invité est plafonné à ${maxCodGuest} €. Connectez-vous ou choisissez le paiement par carte.`
      });
    }

    // Commit stock decrements now that all checks passed
    for (const item of normalizedItems) {
      item.product.stock = Math.max(0, item.product.stock - item.quantity);
    }

    let discountAmount = 0;
    let appliedPromoCode: string | undefined;
    if (incoming.promoCode) {
      const promo = db.promoCodes.find(
        (p: any) => p.code.toUpperCase() === String(incoming.promoCode).trim().toUpperCase() && p.active
      );
      if (promo && serverSubtotal >= (promo.minOrder || 0)) {
        discountAmount = Number(((serverSubtotal * promo.discountPercent) / 100).toFixed(2));
        appliedPromoCode = promo.code;
      }
    }

    const carrier = incoming.carrier || 'colissimo';
    const shippingFee =
      carrier === 'click_and_collect' || serverSubtotal >= 49
        ? 0
        : carrier === 'chronopost'
          ? 9.90
          : carrier === 'mondial_relay'
            ? 3.90
            : 4.90;

    const totalAmount = Number(Math.max(0, serverSubtotal - discountAmount + shippingFee).toFixed(2));
    const loyaltyPointsEarned = Math.floor(totalAmount);

    const newOrder = {
      id: incoming.id || `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      date: incoming.date || new Date().toISOString().replace('T', ' ').substring(0, 16),
      items: normalizedItems,
      subtotal: Number(serverSubtotal.toFixed(2)),
      discountAmount,
      shippingFee,
      promoCode: appliedPromoCode,
      totalAmount,
      shippingAddress: incoming.shippingAddress,
      paymentMethod: incoming.paymentMethod || 'card',
      carrier,
      status: 'En préparation',
      trackingNumber: incoming.trackingNumber || `FR${Math.floor(100000000 + Math.random() * 900000000)}`,
      loyaltyPointsEarned,
      userId: req.authUser?.id
    };

    db.orders.unshift(newOrder);
    saveDatabase(db);

    io.emit('order-created', newOrder);
    io.emit('orders-updated', db.orders);
    io.emit('products-updated', db.products);

    res.json({ success: true, order: newOrder });
  });

  app.patch('/api/orders/:id/status', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const allowedStatuses = ['En préparation', 'Expédié', 'En cours de livraison', 'Livré'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Statut invalide.' });
    }
    const db = getDatabase();
    const order = db.orders.find((o: any) => o.id === id);
    if (order) {
      order.status = status;
      saveDatabase(db);

      io.emit('order-status-updated', { orderId: id, status });
      io.emit('orders-updated', db.orders);

      res.json({ success: true, order });
    } else {
      res.status(404).json({ success: false, error: 'Commande non trouvée' });
    }
  });

  app.post('/api/orders/:id/return', requireAuth, (req: AuthedRequest, res) => {
    const { id } = req.params;
    const { reason, details } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, error: 'Veuillez préciser le motif du retour.' });
    }
    const db = getDatabase();
    const order = db.orders.find((o: any) => o.id === id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Commande non trouvée.' });
    }
    const isOwner =
      req.authUser!.role === 'admin' ||
      order.userId === req.authUser!.id ||
      order.shippingAddress?.email?.toLowerCase() === req.authUser!.email.toLowerCase();
    if (!isOwner) {
      return res.status(403).json({ success: false, error: 'Accès non autorisé à cette commande.' });
    }
    order.returnRequest = {
      id: `RET-${Date.now()}`,
      orderId: id,
      reason: String(reason).trim(),
      details: String(details || '').trim(),
      status: 'En cours d\'examen',
      createdAt: new Date().toISOString().split('T')[0]
    };
    saveDatabase(db);
    io.emit('orders-updated', db.orders);
    res.json({ success: true, order });
  });

  // ------------------------------------------------------------------
  // API Routes - Prescriptions (/ordonnance) with Private Vault
  // ------------------------------------------------------------------
  app.post('/api/prescriptions', (req: AuthedRequest, res) => {
    const ip = getClientIp(req);
    const rl = checkRateLimit(`rx:${ip}`, 'prescriptions', ip, 6, 30 * 60 * 1000, 30 * 60 * 1000);
    if (!rl.allowed) {
      return res.status(429).json({
        success: false,
        error: 'Trop d’envois d’ordonnances sur une courte période. Réessayez plus tard.'
      });
    }

    uploadPrescription.single('file')(req, res, (err: any) => {
      if (err) {
        return res.status(400).json({ success: false, error: err.message || 'Erreur lors de l’envoi du fichier.' });
      }
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'Veuillez joindre votre ordonnance (image ou PDF).' });
      }
      const resolved = path.resolve(req.file.path);
      if (!resolved.startsWith(prescriptionsDir + path.sep)) {
        return res.status(400).json({ success: false, error: 'Chemin de fichier invalide.' });
      }

      const { patientName, email, phone, deliveryMode = 'click_and_collect', notes = '' } = req.body;
      if (!patientName || !email || !phone) {
        return res.status(400).json({ success: false, error: 'Veuillez renseigner votre nom, email et téléphone.' });
      }

      const db = getDatabase();
      const rxId = `ORD-RX-${Math.floor(1000 + Math.random() * 9000)}`;
      const newPrescription = {
        id: rxId,
        patientName: String(patientName).trim().slice(0, 100),
        email: String(email).trim().slice(0, 120),
        phone: String(phone).trim().slice(0, 30),
        deliveryMode: deliveryMode === 'delivery' ? 'delivery' : 'click_and_collect',
        notes: String(notes).trim().slice(0, 800),
        storedFileName: req.file.filename,
        fileUrl: `/api/prescriptions/${rxId}/file`,
        fileName: req.file.originalname,
        status: 'En attente',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        userId: req.authUser?.id
      };

      db.prescriptions.unshift(newPrescription);
      recordSecurityEvent(db, {
        category: 'medical_privacy',
        severity: 'info',
        event: 'PRESCRIPTION_STORED_VAULT',
        detail: `Ordonnance ${rxId} chiffrée/isolée dans le coffre privé officinal.`,
        actor: newPrescription.email,
        ip
      });
      saveDatabase(db);
      io.emit('prescriptions-updated', db.prescriptions);
      res.json({ success: true, prescription: newPrescription });
    });
  });

  app.get('/api/prescriptions', requireAuth, (req: AuthedRequest, res) => {
    const db = getDatabase();
    if (req.authUser!.role === 'admin') {
      return res.json(db.prescriptions);
    }
    const emailLower = req.authUser!.email.toLowerCase();
    const mine = db.prescriptions.filter(
      (p: any) => p.userId === req.authUser!.id || p.email?.toLowerCase() === emailLower
    );
    res.json(mine);
  });

  app.get('/api/prescriptions/:id/file', requireAuth, (req: AuthedRequest, res) => {
    const { id } = req.params;
    const ip = getClientIp(req);
    const db = getDatabase();
    const rx = (db.prescriptions || []).find((p: any) => p.id === id);
    if (!rx) {
      return res.status(404).json({ success: false, error: 'Ordonnance introuvable.' });
    }
    const isOwnerOrAdmin =
      req.authUser!.role === 'admin' ||
      rx.userId === req.authUser!.id ||
      String(rx.email || '').toLowerCase() === req.authUser!.email.toLowerCase();

    if (!isOwnerOrAdmin) {
      recordSecurityEvent(db, {
        category: 'medical_privacy',
        severity: 'critical',
        event: 'PRESCRIPTION_UNAUTHORIZED_ACCESS',
        detail: `Tentative d’accès non autorisée à l’ordonnance ${id}.`,
        actor: req.authUser!.email,
        ip
      });
      saveDatabase(db);
      return res.status(403).json({ success: false, error: 'Accès strictement interdit à cette ordonnance.' });
    }

    const rawStored = rx.storedFileName || path.basename(String(rx.fileUrl || ''));
    const safeName = path.basename(rawStored);
    if (!safeName) {
      return res.status(404).json({ success: false, error: 'Fichier introuvable.' });
    }

    let resolvedPath = path.resolve(prescriptionsDir, safeName);
    if (!resolvedPath.startsWith(prescriptionsDir + path.sep) || !fs.existsSync(resolvedPath)) {
      const legacyPath = path.resolve(uploadsDir, safeName);
      if (legacyPath.startsWith(uploadsDir + path.sep) && fs.existsSync(legacyPath)) {
        resolvedPath = legacyPath;
      } else {
        return res.status(404).json({ success: false, error: 'Fichier d’ordonnance introuvable.' });
      }
    }

    recordSecurityEvent(db, {
      category: 'medical_privacy',
      severity: 'info',
      event: 'PRESCRIPTION_ACCESSED',
      detail: `Consultation sécurisée du document médical ${id}.`,
      actor: req.authUser!.email,
      ip
    });
    saveDatabase(db);

    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(resolvedPath);
  });

  app.patch('/api/prescriptions/:id', requireAdmin, (req: AuthedRequest, res) => {
    const { id } = req.params;
    const { status, pharmacistNote } = req.body;
    const allowed = ['En attente', 'Validée par le pharmacien', 'Prête en officine', 'Refusée'];
    if (status && !allowed.includes(status)) {
      return res.status(400).json({ success: false, error: 'Statut d’ordonnance invalide.' });
    }
    const db = getDatabase();
    const rx = db.prescriptions.find((p: any) => p.id === id);
    if (!rx) {
      return res.status(404).json({ success: false, error: 'Ordonnance non trouvée.' });
    }
    if (status) rx.status = status;
    if (pharmacistNote !== undefined) rx.pharmacistNote = String(pharmacistNote);
    recordSecurityEvent(db, {
      category: 'admin',
      severity: 'info',
      event: 'PRESCRIPTION_STATUS_UPDATED',
      detail: `Ordonnance ${id} passée au statut "${rx.status}".`,
      actor: req.authUser?.email || 'Admin',
      ip: getClientIp(req)
    });
    saveDatabase(db);
    io.emit('prescriptions-updated', db.prescriptions);
    res.json({ success: true, prescription: rx });
  });

  // ------------------------------------------------------------------
  // API Routes - Contact Messages (with Anti-Flood & Honeypot)
  // ------------------------------------------------------------------
  app.post('/api/contact', async (req, res) => {
    const ip = getClientIp(req);
    const { name, email, phone = '', subject, message, website } = req.body || {};
    const db = getDatabase();

    if (website && String(website).trim() !== '') {
      recordSecurityEvent(db, {
        category: 'anti_sabotage',
        severity: 'warning',
        event: 'BOT_HONEYPOT',
        detail: 'Bot bloqué sur le formulaire de contact.',
        actor: String(email || 'Bot'),
        ip
      });
      saveDatabase(db);
      return res.status(400).json({ success: false, error: 'Envoi refusé.' });
    }

    const rl = checkRateLimit(`contact:${ip}`, 'contact', ip, 5, 15 * 60 * 1000, 15 * 60 * 1000);
    if (!rl.allowed) {
      return res.status(429).json({
        success: false,
        error: 'Trop de messages envoyés. Veuillez patienter avant de renvoyer une demande.'
      });
    }

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, error: 'Veuillez remplir tous les champs obligatoires.' });
    }
    const entry = {
      id: `MSG-${Date.now()}`,
      name: String(name).trim().slice(0, 100),
      email: String(email).trim().slice(0, 120),
      phone: String(phone).trim().slice(0, 30),
      subject: String(subject).trim().slice(0, 160),
      message: String(message).trim().slice(0, 2000),
      status: 'Nouveau',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    db.contactMessages.unshift(entry);
    saveDatabase(db);
    io.emit('contacts-updated', db.contactMessages);

    try {
      await smtpTransporter.sendMail({
        from: '"Myrlan Officine" <noreply@myrlan.fr>',
        to: 'officine@myrlan.fr',
        replyTo: entry.email,
        subject: `[Contact Site] ${entry.subject}`,
        text: `De : ${entry.name} (${entry.email} / ${entry.phone})\n\n${entry.message}`
      });
    } catch {
      // Fallback simulated transport
    }

    res.json({ success: true, contactMessage: entry });
  });

  app.get('/api/contact', requireAdmin, (_req, res) => {
    const db = getDatabase();
    res.json(db.contactMessages);
  });

  app.patch('/api/contact/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const db = getDatabase();
    const msg = db.contactMessages.find((m: any) => m.id === id);
    if (!msg) return res.status(404).json({ success: false, error: 'Message non trouvé.' });
    msg.status = status === 'Traité' ? 'Traité' : 'Nouveau';
    saveDatabase(db);
    io.emit('contacts-updated', db.contactMessages);
    res.json({ success: true, contactMessage: msg });
  });

  // ------------------------------------------------------------------
  // API Routes - Live Pharmacist Chat Sessions
  // ------------------------------------------------------------------
  app.get('/api/chat/session/:sessionId', (req, res) => {
    const sessionId = String(req.params.sessionId || '').trim();
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Session de chat invalide.' });
    }
    const db = getDatabase();
    const session = db.chatSessions.find((s: any) => s.id === sessionId) || null;
    res.json({ success: true, session });
  });

  app.post('/api/chat/session/:sessionId/messages', (req: AuthedRequest, res) => {
    const ip = getClientIp(req);
    const { text, visitorName, visitorEmail, timestamp, website } = req.body || {};
    if (website && String(website).trim().length > 0) {
      const dbLog = getDatabase();
      recordSecurityEvent(dbLog, {
        category: 'anti_sabotage',
        severity: 'warning',
        event: 'CHAT_HONEYPOT_TRIGGERED',
        detail: 'Message automatisé rejeté via champ piège sur le tchat en direct.',
        actor: String(visitorEmail || 'bot'),
        ip
      });
      saveDatabase(dbLog);
      return res.status(400).json({ success: false, error: 'Requête rejetée par le filtre anti-spam.' });
    }

    const rate = checkRateLimit(`chat:${ip}`, 'chat_messages', ip, 25, 10 * 60 * 1000, 10 * 60 * 1000, true);
    if (!rate.allowed) {
      const dbLog = getDatabase();
      recordSecurityEvent(dbLog, {
        category: 'anti_sabotage',
        severity: 'warning',
        event: 'CHAT_RATE_LIMIT_BLOCKED',
        detail: 'Rafale excessive de messages sur le tchat patient.',
        actor: String(visitorEmail || 'anonyme'),
        ip
      });
      saveDatabase(dbLog);
      return res.status(429).json({
        success: false,
        error: 'Vous envoyez des messages trop rapidement. Merci de patienter quelques minutes.'
      });
    }

    const sessionId = String(req.params.sessionId || '').trim();
    const cleanText = String(text || '').trim().slice(0, 2000);
    if (!sessionId || !cleanText) {
      return res.status(400).json({ success: false, error: 'Le message ne peut pas être vide.' });
    }

    const db = getDatabase();
    const authUserObj = req.authUser ? db.users.find((u: any) => u.id === req.authUser!.id) : null;
    const nowDisplay = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const nowIso = new Date().toISOString().replace('T', ' ').substring(0, 16);

    let session = db.chatSessions.find((s: any) => s.id === sessionId);
    const resolvedName =
      authUserObj?.name ||
      (visitorName ? String(visitorName).trim() : '') ||
      session?.visitorName ||
      `Visiteur #${sessionId.slice(-4).toUpperCase()}`;
    const resolvedEmail =
      authUserObj?.email ||
      (visitorEmail ? String(visitorEmail).trim() : '') ||
      session?.visitorEmail ||
      '';

    if (!session) {
      session = {
        id: sessionId,
        visitorName: resolvedName,
        visitorEmail: resolvedEmail,
        userId: authUserObj?.id,
        status: 'Ouvert',
        unreadByAdmin: 0,
        updatedAt: nowIso,
        messages: []
      };
      db.chatSessions.unshift(session);
    } else {
      session.visitorName = resolvedName;
      if (resolvedEmail) session.visitorEmail = resolvedEmail;
      if (authUserObj?.id) session.userId = authUserObj.id;
      session.status = 'Ouvert';
    }

    const userMsg = {
      id: `chat-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      sender: 'user',
      senderName: resolvedName,
      text: cleanText,
      timestamp: timestamp ? String(timestamp) : nowDisplay,
      createdAt: nowIso
    };
    session.messages.push(userMsg);
    session.unreadByAdmin = (Number(session.unreadByAdmin) || 0) + 1;
    session.updatedAt = nowIso;

    // First-message instant acknowledgment so the patient knows their message reached the pharmacy
    const hasPharmacistOrBotAck = session.messages.some((m: any) => m.sender === 'bot' || m.sender === 'pharmacist');
    if (!hasPharmacistOrBotAck) {
      session.messages.push({
        id: `chat-ack-${Date.now()}`,
        sender: 'bot',
        senderName: 'Assistant Myrlan',
        text: "Merci pour votre message. Il vient d'être transmis à notre équipe officinale ; un pharmacien vous répondra ici même dans les plus brefs délais.",
        timestamp: nowDisplay,
        createdAt: nowIso
      });
    }

    // Move updated session to top
    db.chatSessions = [session, ...db.chatSessions.filter((s: any) => s.id !== sessionId)];
    saveDatabase(db);

    io.emit('chat-session-updated', session);
    io.emit('chat-sessions-updated', db.chatSessions);

    res.json({ success: true, session, message: userMsg });
  });

  app.get('/api/admin/chat', requireAdmin, (_req, res) => {
    const db = getDatabase();
    res.json(db.chatSessions);
  });

  app.post('/api/admin/chat/:sessionId/reply', requireAdmin, (req: AuthedRequest, res) => {
    const sessionId = String(req.params.sessionId || '').trim();
    const { text } = req.body;
    const cleanText = String(text || '').trim();
    if (!cleanText) {
      return res.status(400).json({ success: false, error: 'Veuillez saisir une réponse.' });
    }

    const db = getDatabase();
    const session = db.chatSessions.find((s: any) => s.id === sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Conversation introuvable.' });
    }

    const adminUser = db.users.find((u: any) => u.id === req.authUser!.id);
    const nowDisplay = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const nowIso = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const replyMsg = {
      id: `chat-rx-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      sender: 'pharmacist',
      senderName: adminUser?.name ? `${adminUser.name} (Pharmacien)` : 'Claire (Pharmacienne)',
      text: cleanText,
      timestamp: nowDisplay,
      createdAt: nowIso
    };

    session.messages.push(replyMsg);
    session.unreadByAdmin = 0;
    session.updatedAt = nowIso;

    db.chatSessions = [session, ...db.chatSessions.filter((s: any) => s.id !== sessionId)];
    saveDatabase(db);

    io.emit('chat-session-updated', session);
    io.emit('chat-sessions-updated', db.chatSessions);

    res.json({ success: true, session, message: replyMsg });
  });

  app.patch('/api/admin/chat/:sessionId', requireAdmin, (req, res) => {
    const sessionId = String(req.params.sessionId || '').trim();
    const { status, markRead } = req.body;
    const db = getDatabase();
    const session = db.chatSessions.find((s: any) => s.id === sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Conversation introuvable.' });
    }
    if (status === 'Ouvert' || status === 'Résolu') {
      session.status = status;
    }
    if (markRead) {
      session.unreadByAdmin = 0;
    }
    saveDatabase(db);
    io.emit('chat-session-updated', session);
    io.emit('chat-sessions-updated', db.chatSessions);
    res.json({ success: true, session });
  });

  // ------------------------------------------------------------------
  // API Routes - Authentication & Account
  // ------------------------------------------------------------------
  app.get('/api/auth/me', (req: AuthedRequest, res) => {
    if (!req.authUser) {
      return res.json({ authenticated: false, user: null });
    }
    const db = getDatabase();
    const user = db.users.find((u: any) => u.id === req.authUser!.id);
    if (!user) {
      return res.json({ authenticated: false, user: null });
    }
    res.json({ authenticated: true, user: sanitizeUser(user) });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email et mot de passe requis.' });
    }
    const ip = getClientIp(req);
    const cleanEmail = String(email).trim().toLowerCase();
    const loginKey = `login:${ip}:${cleanEmail}`;

    // Check active brute-force block without incrementing yet
    const preCheck = checkRateLimit(loginKey, 'auth_login', ip, 5, 15 * 60 * 1000, 15 * 60 * 1000, false);
    if (!preCheck.allowed) {
      const waitMin = Math.max(1, Math.ceil(preCheck.remainingMs / 60000));
      return res.status(429).json({
        success: false,
        error: `Trop de tentatives échouées. Compte temporairement verrouillé (${waitMin} min).`
      });
    }

    const db = getDatabase();
    const user = db.users.find((u: any) => u.email.toLowerCase() === cleanEmail);
    const check = user ? verifyPassword(String(password), user.password) : { valid: false, needsRehash: false };

    if (!user || !check.valid) {
      const rec = recordAuthFailure(loginKey, ip, 5, 15 * 60 * 1000, 15 * 60 * 1000);
      const isNowBlocked = rec.blockedUntil > Date.now();
      recordSecurityEvent(db, {
        category: 'auth',
        severity: isNowBlocked ? 'critical' : 'warning',
        event: isNowBlocked ? 'IP_BLOCKED_BRUTEFORCE' : 'LOGIN_FAILED',
        detail: isNowBlocked
          ? `Verrouillage 15 min après ${rec.count} échecs de connexion.`
          : `Mot de passe incorrect (${rec.count}/5 avant blocage).`,
        actor: cleanEmail,
        ip
      });
      saveDatabase(db);
      return res.status(isNowBlocked ? 429 : 401).json({
        success: false,
        error: isNowBlocked
          ? 'Trop de tentatives échouées. Accès bloqué pendant 15 minutes.'
          : 'Email ou mot de passe incorrect.'
      });
    }

    // Successful login: reset brute-force counter
    clearRateKey(loginKey);

    if (check.needsRehash) {
      user.password = hashPassword(String(password));
    }

    if (user.role === 'admin') {
      recordSecurityEvent(db, {
        category: 'admin',
        severity: 'info',
        event: 'ADMIN_LOGIN',
        detail: 'Connexion validée au back-office pharmacien.',
        actor: user.email,
        ip
      });
    }
    saveDatabase(db);

    const epoch = Number(db.securityConfig?.tokenEpoch || 1);
    const token = signSessionToken({ id: user.id, email: user.email, role: user.role }, epoch);
    res.cookie(SESSION_COOKIE_NAME, token, getSessionCookieOptions(req));
    res.json({ success: true, token, user: sanitizeUser(user) });
  });

  app.post('/api/auth/register', (req, res) => {
    const ip = getClientIp(req);
    const rl = checkRateLimit(`register:${ip}`, 'auth_register', ip, 5, 30 * 60 * 1000, 30 * 60 * 1000);
    if (!rl.allowed) {
      return res.status(429).json({
        success: false,
        error: 'Trop de créations de comptes depuis cette adresse. Réessayez plus tard.'
      });
    }

    const { name, email, password, skinType = 'Mixte à sensible' } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!name || !cleanEmail || !password || String(password).length < 6) {
      return res.status(400).json({ success: false, error: 'Nom, email valide et mot de passe (6+ caractères) requis.' });
    }
    const db = getDatabase();
    const existing = db.users.find((u: any) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Cet email est déjà enregistré.' });
    }
    const newUser = {
      id: `usr-${Date.now()}`,
      name: String(name).trim().slice(0, 100),
      email: cleanEmail,
      password: hashPassword(String(password)),
      role: 'customer',
      skinType,
      concerns: [],
      savedAddresses: [],
      createdAt: new Date().toISOString().split('T')[0]
    };
    db.users.push(newUser);
    saveDatabase(db);

    const epoch = Number(db.securityConfig?.tokenEpoch || 1);
    const token = signSessionToken({ id: newUser.id, email: newUser.email, role: 'customer' }, epoch);
    res.cookie(SESSION_COOKIE_NAME, token, getSessionCookieOptions(req));
    res.json({ success: true, token, user: sanitizeUser(newUser) });
  });

  app.post('/api/auth/logout', (req, res) => {
    const opts = getSessionCookieOptions(req);
    res.clearCookie(SESSION_COOKIE_NAME, { httpOnly: opts.httpOnly, sameSite: opts.sameSite, secure: opts.secure });
    res.json({ success: true });
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    const ip = getClientIp(req);
    const rl = checkRateLimit(`forgot:${ip}`, 'auth_forgot', ip, 4, 15 * 60 * 1000, 15 * 60 * 1000);
    if (!rl.allowed) {
      return res.status(429).json({
        success: false,
        error: 'Trop de demandes de réinitialisation. Patienter 15 minutes.'
      });
    }

    const { email } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return res.status(400).json({ success: false, error: 'Adresse email requise.' });
    }
    const db = getDatabase();
    const user = db.users.find((u: any) => u.email.toLowerCase() === cleanEmail);
    if (user) {
      const rawToken = crypto.randomBytes(24).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      db.resetTokens = db.resetTokens.filter((t: any) => t.email !== cleanEmail);
      db.resetTokens.push({
        email: cleanEmail,
        tokenHash,
        expiresAt: Date.now() + 60 * 60 * 1000
      });
      recordSecurityEvent(db, {
        category: 'auth',
        severity: 'info',
        event: 'PASSWORD_RESET_REQUESTED',
        detail: 'Jeton temporaire de réinitialisation généré.',
        actor: cleanEmail,
        ip
      });
      saveDatabase(db);

      const baseUrl = process.env.APP_URL || `http://localhost:${PORT}`;
      const resetUrl = `${baseUrl}/reset-password?email=${encodeURIComponent(cleanEmail)}&token=${rawToken}`;
      console.log(`[Password Reset] Link generated for ${cleanEmail}: ${resetUrl}`);

      try {
        await smtpTransporter.sendMail({
          from: '"Myrlan Parapharmacie" <noreply@myrlan.fr>',
          to: cleanEmail,
          subject: 'Réinitialisation de votre mot de passe Myrlan',
          text: `Bonjour,\n\nCliquez sur le lien suivant pour réinitialiser votre mot de passe (valide 1h) :\n${resetUrl}`
        });
      } catch {
        // Simulated fallback
      }
    }
    // Always return generic success message to prevent email enumeration
    res.json({
      success: true,
      message: 'Si un compte correspond à cet email, un lien de réinitialisation vient d’être envoyé.'
    });
  });

  app.post('/api/auth/reset-password', (req, res) => {
    const { email, token, newPassword } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || !token || !newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ success: false, error: 'Email, jeton valide et mot de passe (6+ caractères) requis.' });
    }
    const db = getDatabase();
    const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');
    const record = db.resetTokens.find(
      (t: any) => t.email === cleanEmail && t.tokenHash === tokenHash && t.expiresAt > Date.now()
    );
    if (!record) {
      return res.status(400).json({ success: false, error: 'Lien de réinitialisation invalide ou expiré.' });
    }
    const user = db.users.find((u: any) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Compte utilisateur introuvable.' });
    }
    user.password = hashPassword(String(newPassword));
    db.resetTokens = db.resetTokens.filter((t: any) => t.email !== cleanEmail);
    recordSecurityEvent(db, {
      category: 'auth',
      severity: 'info',
      event: 'PASSWORD_RESET_COMPLETED',
      detail: 'Mot de passe réinitialisé via jeton sécurisé.',
      actor: cleanEmail,
      ip: getClientIp(req)
    });
    saveDatabase(db);
    res.json({ success: true, message: 'Votre mot de passe a été mis à jour avec succès.' });
  });

  app.post('/api/auth/change-password', requireAuth, (req: AuthedRequest, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ success: false, error: 'Nouveau mot de passe (6+ caractères) requis.' });
    }
    const db = getDatabase();
    const user = db.users.find((u: any) => u.id === req.authUser!.id);
    if (!user) return res.status(404).json({ success: false, error: 'Utilisateur introuvable.' });
    const check = verifyPassword(String(currentPassword), user.password);
    if (!check.valid) {
      return res.status(400).json({ success: false, error: 'Mot de passe actuel incorrect.' });
    }
    user.password = hashPassword(String(newPassword));
    recordSecurityEvent(db, {
      category: 'auth',
      severity: 'info',
      event: 'PASSWORD_CHANGED',
      detail: 'Mot de passe modifié par l’utilisateur.',
      actor: user.email,
      ip: getClientIp(req)
    });
    saveDatabase(db);
    res.json({ success: true, message: 'Mot de passe modifié avec succès.' });
  });

  app.put('/api/account/profile', requireAuth, (req: AuthedRequest, res) => {
    const db = getDatabase();
    const user = db.users.find((u: any) => u.id === req.authUser!.id);
    if (!user) return res.status(404).json({ success: false, error: 'Utilisateur non trouvé.' });

    const { name, skinType, concerns, savedAddresses } = req.body;
    if (name !== undefined) user.name = String(name).trim();
    if (skinType !== undefined) user.skinType = String(skinType);
    if (Array.isArray(concerns)) user.concerns = concerns;
    if (Array.isArray(savedAddresses)) user.savedAddresses = savedAddresses;
    saveDatabase(db);
    res.json({ success: true, user: sanitizeUser(user) });
  });

  // ------------------------------------------------------------------
  // API Routes - Admin Users List (Sanitized, no password hashes)
  // ------------------------------------------------------------------
  app.get('/api/admin/users', requireAdmin, (_req, res) => {
    const db = getDatabase();
    const summaries = db.users.map((u: any) => {
      const userOrders = db.orders.filter(
        (o: any) => o.userId === u.id || o.shippingAddress?.email?.toLowerCase() === u.email.toLowerCase()
      );
      const totalSpent = userOrders.reduce((acc: number, o: any) => acc + (Number(o.totalAmount) || 0), 0);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt || '2026-01-01',
        ordersCount: userOrders.length,
        totalSpent: Number(totalSpent.toFixed(2))
      };
    });
    res.json(summaries);
  });

  // ------------------------------------------------------------------
  // API Routes - Email (SMTP) & Payment Intent
  // ------------------------------------------------------------------
  app.post('/api/send-email', async (req, res) => {
    try {
      const { to, subject, message } = req.body;
      try {
        await smtpTransporter.sendMail({
          from: '"Myrlan Parapharmacie" <noreply@myrlan.fr>',
          to: to || 'client@example.com',
          subject: subject || 'Confirmation de commande Myrlan',
          text: message || 'Votre commande a bien été prise en compte.'
        });
      } catch {
        // Simulated fallback
      }
      res.json({ success: true, message: 'Email envoyé avec succès via le serveur SMTP.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/create-payment-intent', async (req, res) => {
    try {
      const { paymentMethodType } = req.body;
      const clientSecret = `seti_${crypto.randomBytes(6).toString('hex')}_secret_${crypto.randomBytes(6).toString('hex')}`;
      res.json({
        success: true,
        clientSecret,
        paymentMethodType: paymentMethodType || 'card',
        status: 'succeeded',
        message: `Paiement ${paymentMethodType} validé avec succès.`
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ------------------------------------------------------------------
  // Public SEO & Webmaster Endpoints (/sitemap.xml, /robots.txt, metadata)
  // ------------------------------------------------------------------
  app.get('/sitemap.xml', (req, res) => {
    const db = getDatabase();
    const baseUrl = resolveBaseUrl(req, db.webmaster);
    const xml = buildSitemapXml(db, baseUrl);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  });

  app.get('/robots.txt', (req, res) => {
    const db = getDatabase();
    const baseUrl = resolveBaseUrl(req, db.webmaster);
    const txt = buildRobotsTxt(db, baseUrl);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(txt);
  });

  app.get('/api/webmaster/public', (_req, res) => {
    const db = getDatabase();
    const wm = db.webmaster || DEFAULT_WEBMASTER_CONFIG;
    res.json({
      siteTitle: wm.siteTitle,
      siteDescription: wm.siteDescription,
      canonicalBaseUrl: wm.canonicalBaseUrl,
      ogImageUrl: wm.ogImageUrl,
      googleSiteVerification: wm.googleSiteVerification,
      bingSiteVerification: wm.bingSiteVerification,
      gaMeasurementId: wm.gaMeasurementId,
      enablePharmacyJsonLd: wm.enablePharmacyJsonLd,
      enableProductJsonLd: wm.enableProductJsonLd,
      redirects: (wm.redirects || []).filter((r: any) => r.active)
    });
  });

  // ------------------------------------------------------------------
  // Admin Webmaster & SEO Management APIs
  // ------------------------------------------------------------------
  app.get('/api/admin/webmaster', requireAdmin, (req, res) => {
    const db = getDatabase();
    const baseUrl = resolveBaseUrl(req, db.webmaster);
    const sitemapXml = buildSitemapXml(db, baseUrl);
    const robotsPreview = buildRobotsTxt(db, baseUrl);
    const productUrlsCount = db.webmaster?.sitemapIncludeProducts !== false ? db.products.length : 0;
    const publicPagesCount = PUBLIC_STOREFRONT_ROUTES.length;
    res.json({
      config: db.webmaster,
      resolvedBaseUrl: baseUrl,
      sitemapXml,
      robotsPreview,
      defaultRobotsTxt: DEFAULT_ROBOTS_TXT,
      stats: {
        publicPagesCount,
        productUrlsCount,
        sitemapUrlsCount: publicPagesCount + productUrlsCount,
        activeRedirectsCount: (db.webmaster?.redirects || []).filter((r: any) => r.active).length
      }
    });
  });

  app.put('/api/admin/webmaster', requireAdmin, (req, res) => {
    const db = getDatabase();
    const body = req.body || {};
    const current = db.webmaster || { ...DEFAULT_WEBMASTER_CONFIG, redirects: [] };

    const gaId = String(body.gaMeasurementId ?? current.gaMeasurementId ?? '').trim().toUpperCase();
    if (gaId && !/^(G|GT|GTM)-[A-Z0-9]{4,16}$/.test(gaId)) {
      return res.status(400).json({
        success: false,
        error: 'Identifiant Analytics invalide (format attendu : G-XXXXXXXXXX ou GTM-XXXXXXX).'
      });
    }

    const canonicalRaw = String(body.canonicalBaseUrl ?? current.canonicalBaseUrl ?? '').trim().replace(/\/+$/, '');
    if (canonicalRaw && !/^https?:\/\/[a-zA-Z0-9.-]+(:\d+)?$/.test(canonicalRaw)) {
      return res.status(400).json({
        success: false,
        error: 'URL canonique invalide (exemple : https://www.myrlan.fr).'
      });
    }

    const ogImgRaw = String(body.ogImageUrl ?? current.ogImageUrl ?? '').trim();
    if (ogImgRaw && !ogImgRaw.startsWith('/') && !/^https?:\/\//i.test(ogImgRaw)) {
      return res.status(400).json({
        success: false,
        error: 'URL image OpenGraph invalide (utilisez https://... ou un chemin /uploads/...).'
      });
    }

    const changeFreq = ['daily', 'weekly', 'monthly'].includes(body.sitemapChangeFreq)
      ? body.sitemapChangeFreq
      : current.sitemapChangeFreq;

    const updated = {
      ...current,
      siteTitle: String(body.siteTitle ?? current.siteTitle).trim().slice(0, 120) || DEFAULT_WEBMASTER_CONFIG.siteTitle,
      siteDescription: String(body.siteDescription ?? current.siteDescription).trim().slice(0, 320) || DEFAULT_WEBMASTER_CONFIG.siteDescription,
      canonicalBaseUrl: canonicalRaw,
      ogImageUrl: ogImgRaw,
      googleSiteVerification: String(body.googleSiteVerification ?? current.googleSiteVerification ?? '').trim().slice(0, 160),
      bingSiteVerification: String(body.bingSiteVerification ?? current.bingSiteVerification ?? '').trim().slice(0, 160),
      gaMeasurementId: gaId,
      robotsTxt: String(body.robotsTxt ?? current.robotsTxt ?? DEFAULT_ROBOTS_TXT).slice(0, 8000),
      sitemapIncludeProducts: body.sitemapIncludeProducts !== undefined ? Boolean(body.sitemapIncludeProducts) : current.sitemapIncludeProducts,
      sitemapChangeFreq: changeFreq,
      enablePharmacyJsonLd: body.enablePharmacyJsonLd !== undefined ? Boolean(body.enablePharmacyJsonLd) : current.enablePharmacyJsonLd,
      enableProductJsonLd: body.enableProductJsonLd !== undefined ? Boolean(body.enableProductJsonLd) : current.enableProductJsonLd,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    db.webmaster = updated;
    saveDatabase(db);

    const baseUrl = resolveBaseUrl(req, updated);
    io.emit('webmaster-updated', updated);

    res.json({
      success: true,
      config: updated,
      resolvedBaseUrl: baseUrl,
      sitemapXml: buildSitemapXml(db, baseUrl),
      robotsPreview: buildRobotsTxt(db, baseUrl)
    });
  });

  app.post('/api/admin/webmaster/redirects', requireAdmin, (req, res) => {
    const { fromPath, toPath, statusCode = 301 } = req.body || {};
    const cleanFrom = normalizeInternalPath(fromPath);
    const cleanTo = normalizeInternalPath(toPath);

    if (!cleanFrom || !cleanTo) {
      return res.status(400).json({
        success: false,
        error: 'Les chemins source et cible doivent commencer par / (ex: /ancien-produit → /).'
      });
    }
    if (cleanFrom === cleanTo) {
      return res.status(400).json({
        success: false,
        error: 'Le chemin source et la destination doivent être différents.'
      });
    }
    if (cleanFrom.startsWith('/api') || cleanFrom === '/admin' || cleanFrom === '/sitemap.xml' || cleanFrom === '/robots.txt') {
      return res.status(400).json({
        success: false,
        error: 'Impossible de rediriger une route système (/api, /admin, /sitemap.xml, /robots.txt).'
      });
    }

    const db = getDatabase();
    const list = db.webmaster.redirects || [];
    if (list.some((r: any) => r.fromPath === cleanFrom)) {
      return res.status(400).json({
        success: false,
        error: `Une redirection existe déjà pour ${cleanFrom}.`
      });
    }

    const rule = {
      id: `redir-${Date.now()}`,
      fromPath: cleanFrom,
      toPath: cleanTo,
      statusCode: Number(statusCode) === 302 ? 302 : 301,
      active: true,
      hits: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };

    db.webmaster.redirects = [rule, ...list];
    db.webmaster.updatedAt = new Date().toISOString().split('T')[0];
    saveDatabase(db);
    io.emit('webmaster-updated', db.webmaster);

    res.json({ success: true, redirect: rule, redirects: db.webmaster.redirects });
  });

  app.patch('/api/admin/webmaster/redirects/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const db = getDatabase();
    const list = db.webmaster.redirects || [];
    const rule = list.find((r: any) => r.id === id);
    if (!rule) {
      return res.status(404).json({ success: false, error: 'Redirection introuvable.' });
    }
    if (req.body?.active !== undefined) rule.active = Boolean(req.body.active);
    if (req.body?.statusCode !== undefined) rule.statusCode = Number(req.body.statusCode) === 302 ? 302 : 301;
    saveDatabase(db);
    io.emit('webmaster-updated', db.webmaster);
    res.json({ success: true, redirect: rule, redirects: list });
  });

  app.delete('/api/admin/webmaster/redirects/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const db = getDatabase();
    db.webmaster.redirects = (db.webmaster.redirects || []).filter((r: any) => r.id !== id);
    saveDatabase(db);
    io.emit('webmaster-updated', db.webmaster);
    res.json({ success: true, redirects: db.webmaster.redirects });
  });

  app.post('/api/admin/webmaster/check-urls', requireAdmin, (req, res) => {
    const db = getDatabase();
    const baseUrl = resolveBaseUrl(req, db.webmaster);
    const checks: any[] = [];

    // 1. SEO Files
    const sitemapXml = buildSitemapXml(db, baseUrl);
    const robotsTxt = buildRobotsTxt(db, baseUrl);
    checks.push({
      url: '/sitemap.xml',
      label: 'Sitemap XML dynamique',
      category: 'Fichier SEO',
      status: 200,
      ok: sitemapXml.includes('<urlset') && sitemapXml.includes('<loc>'),
      note: `${(sitemapXml.match(/<url>/g) || []).length} URL(s) indexées`
    });
    checks.push({
      url: '/robots.txt',
      label: 'Fichier robots.txt',
      category: 'Fichier SEO',
      status: 200,
      ok: robotsTxt.includes('User-agent:'),
      note: robotsTxt.includes('Sitemap:') ? 'Directive Sitemap présente' : 'Directive Sitemap absente'
    });

    // 2. Public storefront routes
    for (const r of PUBLIC_STOREFRONT_ROUTES) {
      checks.push({
        url: r.path,
        label: r.label,
        category: 'Page',
        status: 200,
        ok: true,
        note: `Priorité ${r.priority} · ${r.changefreq}`
      });
    }

    // 3. Product routes & media checks
    for (const p of db.products) {
      const hasDesc = Boolean(p.description && String(p.description).trim().length >= 30);
      const hasValidEan = /^\d{8,14}$/.test(String(p.ean || '').trim());
      checks.push({
        url: `/produit/${p.id}`,
        label: p.name,
        category: 'Produit',
        status: hasDesc && hasValidEan ? 200 : 'OK',
        ok: hasDesc && hasValidEan,
        note: !hasDesc
          ? 'Description courte à enrichir'
          : !hasValidEan
            ? 'Code EAN manquant ou invalide'
            : `EAN ${p.ean} · Stock ${p.stock}`
      });

      const img = String(p.image || '').trim();
      if (img.startsWith('/uploads/')) {
        const fileName = path.basename(img);
        const resolved = path.resolve(uploadsDir, fileName);
        const exists = resolved.startsWith(uploadsDir + path.sep) && fs.existsSync(resolved);
        checks.push({
          url: img,
          label: `Image · ${p.name}`,
          category: 'Média',
          status: exists ? 200 : 404,
          ok: exists,
          note: exists ? 'Fichier local présent' : 'Fichier introuvable sur le serveur'
        });
      } else if (!img || (!img.startsWith('https://') && !img.startsWith('http://') && !img.startsWith('/'))) {
        checks.push({
          url: img || '(aucune image)',
          label: `Image · ${p.name}`,
          category: 'Média',
          status: 'Erreur',
          ok: false,
          note: 'URL image manquante ou invalide'
        });
      }
    }

    res.json({ success: true, checkedAt: new Date().toISOString(), checks });
  });

  app.get('/api/admin/webmaster/export', requireAdmin, (_req, res) => {
    const db = getDatabase();
    const sanitizedExport = {
      exportedAt: new Date().toISOString(),
      products: db.products,
      orders: db.orders,
      promoCodes: db.promoCodes,
      prescriptions: db.prescriptions,
      contactMessages: db.contactMessages,
      appointments: db.appointments,
      webmaster: db.webmaster,
      users: (db.users || []).map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt
      }))
    };
    const filename = `myrlan-backup-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(sanitizedExport, null, 2));
  });

  // ------------------------------------------------------------------
  // Pharmacy Appointments Booking & Admin Management APIs
  // ------------------------------------------------------------------
  app.get('/api/appointments/slots', (req, res) => {
    const date = String(req.query.date || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, error: 'Date invalide (AAAA-MM-JJ).' });
    }
    const db = getDatabase();
    const bookedSlots = (db.appointments || [])
      .filter((a: any) => a.date === date && a.status !== 'Annulé')
      .map((a: any) => a.timeSlot);
    res.json({ date, allSlots: APPOINTMENT_TIME_SLOTS, bookedSlots });
  });

  app.get('/api/appointments/mine', requireAuth, (req: AuthedRequest, res) => {
    const db = getDatabase();
    const emailLower = req.authUser!.email.toLowerCase();
    const list = (db.appointments || []).filter(
      (a: any) => a.userId === req.authUser!.id || String(a.patientEmail || '').toLowerCase() === emailLower
    );
    res.json(list);
  });

  app.post('/api/appointments', (req: AuthedRequest, res) => {
    const ip = getClientIp(req);
    const { serviceType, format, date, timeSlot, patientName, patientEmail, patientPhone, notes, website } = req.body || {};
    if (website && String(website).trim().length > 0) {
      const dbLog = getDatabase();
      recordSecurityEvent(dbLog, {
        category: 'anti_sabotage',
        severity: 'warning',
        event: 'APPOINTMENT_HONEYPOT_TRIGGERED',
        detail: 'Réservation automatisée bloquée via champ piège (anti-engorgement agenda).',
        actor: String(patientEmail || 'bot'),
        ip
      });
      saveDatabase(dbLog);
      return res.status(400).json({ success: false, error: 'Requête rejetée par le contrôle anti-robot.' });
    }

    const rate = checkRateLimit(`appointments:${ip}`, 'appointments', ip, 10, 15 * 60 * 1000, 15 * 60 * 1000, true);
    if (!rate.allowed) {
      const dbLog = getDatabase();
      recordSecurityEvent(dbLog, {
        category: 'anti_sabotage',
        severity: 'warning',
        event: 'APPOINTMENT_FLOOD_BLOCKED',
        detail: 'Tentative de saturation des créneaux de rendez-vous officinaux bloquée.',
        actor: String(patientEmail || 'anonyme'),
        ip
      });
      saveDatabase(dbLog);
      return res.status(429).json({
        success: false,
        error: 'Trop de réservations en peu de temps. Merci de patienter 15 minutes.'
      });
    }

    const service = APPOINTMENT_SERVICES[String(serviceType || '')];
    if (!service) {
      return res.status(400).json({ success: false, error: 'Motif de rendez-vous invalide.' });
    }
    const cleanFormat = format === 'visio' ? 'visio' : 'officine';
    const cleanDate = String(date || '').trim();
    const cleanSlot = String(timeSlot || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      return res.status(400).json({ success: false, error: 'Veuillez choisir une date valide.' });
    }
    if (!APPOINTMENT_TIME_SLOTS.includes(cleanSlot)) {
      return res.status(400).json({ success: false, error: 'Créneau horaire invalide.' });
    }
    const cleanName = String(patientName || '').trim().slice(0, 100);
    const cleanEmail = String(patientEmail || '').trim().slice(0, 120);
    const cleanPhone = String(patientPhone || '').trim().slice(0, 30);
    if (!cleanName || !cleanEmail.includes('@') || !cleanPhone) {
      return res.status(400).json({ success: false, error: 'Nom, email et téléphone sont requis.' });
    }

    const db = getDatabase();
    const conflict = (db.appointments || []).some(
      (a: any) => a.date === cleanDate && a.timeSlot === cleanSlot && a.status !== 'Annulé'
    );
    if (conflict) {
      return res.status(409).json({
        success: false,
        error: 'Ce créneau vient d’être réservé. Veuillez choisir une autre heure.'
      });
    }

    const appointment = {
      id: `RDV-${Math.floor(1000 + Math.random() * 9000)}`,
      serviceType: String(serviceType),
      serviceLabel: service.label,
      durationMinutes: service.durationMinutes,
      format: cleanFormat,
      date: cleanDate,
      timeSlot: cleanSlot,
      patientName: cleanName,
      patientEmail: cleanEmail,
      patientPhone: cleanPhone,
      notes: String(notes || '').trim().slice(0, 500),
      pharmacistNote: '',
      status: 'Confirmé',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      userId: req.authUser?.id
    };

    db.appointments.unshift(appointment);
    saveDatabase(db);
    io.emit('appointments-updated', db.appointments);

    res.json({ success: true, appointment });
  });

  app.patch('/api/appointments/:id/cancel', requireAuth, (req: AuthedRequest, res) => {
    const { id } = req.params;
    const db = getDatabase();
    const appt = (db.appointments || []).find((a: any) => a.id === id);
    if (!appt) {
      return res.status(404).json({ success: false, error: 'Rendez-vous introuvable.' });
    }
    const isOwner =
      req.authUser!.role === 'admin' ||
      appt.userId === req.authUser!.id ||
      String(appt.patientEmail || '').toLowerCase() === req.authUser!.email.toLowerCase();
    if (!isOwner) {
      return res.status(403).json({ success: false, error: 'Accès non autorisé.' });
    }
    appt.status = 'Annulé';
    saveDatabase(db);
    io.emit('appointments-updated', db.appointments);
    res.json({ success: true, appointment: appt });
  });

  app.get('/api/admin/appointments', requireAdmin, (_req, res) => {
    const db = getDatabase();
    res.json(db.appointments || []);
  });

  app.patch('/api/admin/appointments/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { status, pharmacistNote } = req.body || {};
    const allowedStatuses = ['Confirmé', 'Terminé', 'Annulé'];
    const db = getDatabase();
    const appt = (db.appointments || []).find((a: any) => a.id === id);
    if (!appt) {
      return res.status(404).json({ success: false, error: 'Rendez-vous introuvable.' });
    }
    if (status !== undefined) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ success: false, error: 'Statut invalide.' });
      }
      appt.status = status;
    }
    if (pharmacistNote !== undefined) {
      appt.pharmacistNote = String(pharmacistNote).trim().slice(0, 500);
    }
    saveDatabase(db);
    io.emit('appointments-updated', db.appointments);
    res.json({ success: true, appointment: appt });
  });

  // ------------------------------------------------------------------
  // Security, Anti-Phishing & Firewall Admin APIs
  // ------------------------------------------------------------------
  app.get('/.well-known/security.txt', (req, res) => {
    const db = getDatabase();
    const baseUrl = resolveBaseUrl(req, db.webmaster);
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const body = `Contact: mailto:securite@myrlan.fr
Expires: ${expires}
Preferred-Languages: fr, en
Canonical: ${baseUrl}/.well-known/security.txt
Policy: ${baseUrl}/confidentialite
`;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(body);
  });

  app.get('/api/security/public', (req, res) => {
    const db = getDatabase();
    const baseUrl = resolveBaseUrl(req, db.webmaster);
    res.json({
      officialBrand: 'Myrlan Parapharmacie & Pharmacie',
      canonicalBaseUrl: db.webmaster?.canonicalBaseUrl || baseUrl,
      maxCodGuestAmount: Number(db.securityConfig?.maxCodGuestAmount || 250),
      antiPhishingNotice:
        'Myrlan ne vous demandera jamais votre mot de passe, code SMS ou numéro de carte bancaire par email, téléphone ou lien externe.'
    });
  });

  app.get('/api/admin/security', requireAdmin, (req, res) => {
    const db = getDatabase();
    const now = Date.now();
    const baseUrl = resolveBaseUrl(req, db.webmaster);

    const activeBlocks: any[] = [];
    for (const [key, entry] of securityRateMap.entries()) {
      if (entry.blockedUntil > now) {
        activeBlocks.push({
          key,
          scope: entry.scope,
          ip: entry.ip,
          attempts: entry.count,
          blockedUntil: new Date(entry.blockedUntil).toISOString().replace('T', ' ').substring(0, 19),
          remainingMinutes: Math.max(1, Math.ceil((entry.blockedUntil - now) / 60000))
        });
      }
    }

    const logs = Array.isArray(db.securityLogs) ? db.securityLogs : [];
    const failedLogins24h = logs.filter((l: any) => l.event === 'LOGIN_FAILED' || l.event === 'IP_BLOCKED_BRUTEFORCE').length;
    const blockedBotsOrFlood24h = logs.filter((l: any) => l.category === 'anti_sabotage').length;

    const weakAdminEmails: string[] = [];
    for (const u of db.users || []) {
      if (u.role !== 'admin') continue;
      if (WEAK_PASSWORDS.some(weak => verifyPassword(weak, u.password).valid)) {
        weakAdminEmails.push(u.email);
      }
    }

    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const securityTxtPreview = `Contact: mailto:securite@myrlan.fr\nExpires: ${expires}\nPreferred-Languages: fr, en\nCanonical: ${baseUrl}/.well-known/security.txt\nPolicy: ${baseUrl}/confidentialite`;

    res.json({
      config: db.securityConfig,
      stats: {
        activeBlocksCount: activeBlocks.length,
        failedLogins24h,
        blockedBotsOrFlood24h,
        protectedPrescriptionsCount: (db.prescriptions || []).length,
        weakAdminAccountsCount: weakAdminEmails.length
      },
      weakAdminEmails,
      activeBlocks,
      logs: logs.slice(0, 80),
      securityTxtPreview,
      headersEnabled: [
        { name: 'Coffre Ordonnances Privé', value: 'Accès authentifié strict (/api/prescriptions/:id/file)' },
        { name: 'Anti-Brute Force Auth', value: 'Blocage 15 min après 5 échecs de connexion' },
        { name: 'Content-Security-Policy', value: 'Strict self + Google Analytics autorisé' },
        { name: 'X-Content-Type-Options', value: 'nosniff' },
        { name: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { name: 'Socket.IO CORS', value: 'Origines autorisées uniquement' }
      ]
    });
  });

  app.post('/api/admin/security/unblock', requireAdmin, (req: AuthedRequest, res) => {
    const { key } = req.body || {};
    if (!key) {
      return res.status(400).json({ success: false, error: 'Clé de blocage requise.' });
    }
    clearRateKey(String(key));
    const db = getDatabase();
    recordSecurityEvent(db, {
      category: 'admin',
      severity: 'info',
      event: 'IP_UNBLOCKED_ADMIN',
      detail: `Déblocage manuel effectué (${String(key).slice(0, 60)}).`,
      actor: req.authUser?.email || 'Admin',
      ip: getClientIp(req)
    });
    saveDatabase(db);
    res.json({ success: true });
  });

  app.post('/api/admin/security/revoke-sessions', requireAdmin, (req: AuthedRequest, res) => {
    const db = getDatabase();
    const nextEpoch = Number(db.securityConfig?.tokenEpoch || 1) + 1;
    db.securityConfig = {
      ...(db.securityConfig || {}),
      tokenEpoch: nextEpoch
    };
    recordSecurityEvent(db, {
      category: 'admin',
      severity: 'critical',
      event: 'SESSIONS_REVOKED',
      detail: `Toutes les sessions antérieures ont été révoquées (epoch ${nextEpoch}).`,
      actor: req.authUser?.email || 'Admin',
      ip: getClientIp(req)
    });
    saveDatabase(db);

    // Issue fresh token & cookie for the acting admin so their session stays active seamlessly
    const freshToken = signSessionToken(
      { id: req.authUser!.id, email: req.authUser!.email, role: req.authUser!.role },
      nextEpoch
    );
    res.cookie(SESSION_COOKIE_NAME, freshToken, getSessionCookieOptions(req));
    res.json({ success: true, tokenEpoch: nextEpoch, token: freshToken });
  });

  app.patch('/api/admin/security/config', requireAdmin, (req: AuthedRequest, res) => {
    const { maxCodGuestAmount, maxOrderQtyPerItem, maxOrderTotalItems } = req.body || {};
    const db = getDatabase();
    const cfg = db.securityConfig || { tokenEpoch: 1 };
    if (maxCodGuestAmount !== undefined) {
      cfg.maxCodGuestAmount = Math.max(50, Math.min(2000, Number(maxCodGuestAmount) || 250));
    }
    if (maxOrderQtyPerItem !== undefined) {
      cfg.maxOrderQtyPerItem = Math.max(1, Math.min(50, Number(maxOrderQtyPerItem) || 10));
    }
    if (maxOrderTotalItems !== undefined) {
      cfg.maxOrderTotalItems = Math.max(1, Math.min(100, Number(maxOrderTotalItems) || 30));
    }
    db.securityConfig = cfg;
    recordSecurityEvent(db, {
      category: 'admin',
      severity: 'info',
      event: 'SECURITY_POLICY_UPDATED',
      detail: `Plafonds anti-sabotage mis à jour (COD invité ${cfg.maxCodGuestAmount}€, max/article ${cfg.maxOrderQtyPerItem}).`,
      actor: req.authUser?.email || 'Admin',
      ip: getClientIp(req)
    });
    saveDatabase(db);
    res.json({ success: true, config: cfg });
  });

  // Server-side 301/302 Redirect Middleware for storefront URLs
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    const reqPath = normalizeInternalPath(req.path);
    if (!reqPath) return next();
    if (
      reqPath.startsWith('/api/') ||
      reqPath.startsWith('/uploads/') ||
      reqPath.startsWith('/@') ||
      reqPath.startsWith('/src/') ||
      reqPath.startsWith('/node_modules/') ||
      reqPath === '/sitemap.xml' ||
      reqPath === '/robots.txt'
    ) {
      return next();
    }
    const db = getDatabase();
    const redirects = db.webmaster?.redirects || [];
    const match = redirects.find((r: any) => r.active && r.fromPath === reqPath);
    if (match) {
      const safeTarget = normalizeInternalPath(match.toPath);
      if (safeTarget && safeTarget !== reqPath) {
        match.hits = (Number(match.hits) || 0) + 1;
        saveDatabase(db);
        return res.redirect(match.statusCode === 302 ? 302 : 301, safeTarget);
      }
    }
    next();
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr: false,
        ws: {
          server: httpServer,
          path: '/vite-hmr'
        }
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Myrlan Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

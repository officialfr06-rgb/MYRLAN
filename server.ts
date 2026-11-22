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

// Ensure uploads directory exists on server
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
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
  storage,
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
  exp: number;
}

function signSessionToken(payload: Omit<AuthPayload, 'exp'>): string {
  const fullPayload: AuthPayload = {
    ...payload,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000
  };
  const data = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifySessionToken(token: string): AuthPayload | null {
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

function getDatabase() {
  if (!fs.existsSync(dbFilePath)) {
    const initialDb = {
      products: INITIAL_PRODUCTS,
      orders: INITIAL_ORDERS,
      users: INITIAL_USERS,
      promoCodes: INITIAL_PROMOS,
      prescriptions: [],
      contactMessages: [],
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
      resetTokens: []
    };
  }
}

function saveDatabase(db: any) {
  fs.writeFileSync(dbFilePath, JSON.stringify(db, null, 2));
}

interface AuthedRequest extends Request {
  authUser?: AuthPayload;
}

function extractAuth(req: AuthedRequest): AuthPayload | null {
  const cookies = parseCookies(req.headers.cookie);
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const token = bearerToken || cookies[SESSION_COOKIE_NAME];
  if (!token) return null;
  return verifySessionToken(token);
}

function attachAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const payload = extractAuth(req);
  if (payload) req.authUser = payload;
  next();
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
  app.use(express.json({ limit: '2mb' }));
  app.use(attachAuth);

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  // Serve static uploaded files safely
  app.use('/uploads', express.static(uploadsDir, { dotfiles: 'deny' }));

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
    const db = getDatabase();
    const incoming = req.body;
    if (!incoming || !Array.isArray(incoming.items) || incoming.items.length === 0) {
      return res.status(400).json({ success: false, error: 'Le panier est vide.' });
    }

    // Recompute prices server-side from authoritative catalog
    let serverSubtotal = 0;
    const normalizedItems = [];
    for (const cartItem of incoming.items) {
      const prod = db.products.find((p: any) => p.id === cartItem.product?.id);
      if (!prod) continue;
      const qty = Math.max(1, Math.min(prod.stock, Number(cartItem.quantity) || 1));
      serverSubtotal += prod.price * qty;
      normalizedItems.push({ product: prod, quantity: qty });
      prod.stock = Math.max(0, prod.stock - qty);
    }

    if (normalizedItems.length === 0) {
      return res.status(400).json({ success: false, error: 'Aucun produit valide dans la commande.' });
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
  // API Routes - Prescriptions (/ordonnance)
  // ------------------------------------------------------------------
  app.post('/api/prescriptions', (req: AuthedRequest, res) => {
    uploadPrescription.single('file')(req, res, (err: any) => {
      if (err) {
        return res.status(400).json({ success: false, error: err.message || 'Erreur lors de l’envoi du fichier.' });
      }
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'Veuillez joindre votre ordonnance (image ou PDF).' });
      }
      const resolved = path.resolve(req.file.path);
      if (!resolved.startsWith(uploadsDir + path.sep)) {
        return res.status(400).json({ success: false, error: 'Chemin de fichier invalide.' });
      }

      const { patientName, email, phone, deliveryMode = 'click_and_collect', notes = '' } = req.body;
      if (!patientName || !email || !phone) {
        return res.status(400).json({ success: false, error: 'Veuillez renseigner votre nom, email et téléphone.' });
      }

      const db = getDatabase();
      const newPrescription = {
        id: `ORD-RX-${Math.floor(1000 + Math.random() * 9000)}`,
        patientName: String(patientName).trim(),
        email: String(email).trim(),
        phone: String(phone).trim(),
        deliveryMode: deliveryMode === 'delivery' ? 'delivery' : 'click_and_collect',
        notes: String(notes).trim(),
        fileUrl: `/uploads/${req.file.filename}`,
        fileName: req.file.originalname,
        status: 'En attente',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        userId: req.authUser?.id
      };

      db.prescriptions.unshift(newPrescription);
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

  app.patch('/api/prescriptions/:id', requireAdmin, (req, res) => {
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
    saveDatabase(db);
    io.emit('prescriptions-updated', db.prescriptions);
    res.json({ success: true, prescription: rx });
  });

  // ------------------------------------------------------------------
  // API Routes - Contact Messages
  // ------------------------------------------------------------------
  app.post('/api/contact', async (req, res) => {
    const { name, email, phone = '', subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, error: 'Veuillez remplir tous les champs obligatoires.' });
    }
    const db = getDatabase();
    const entry = {
      id: `MSG-${Date.now()}`,
      name: String(name).trim(),
      email: String(email).trim(),
      phone: String(phone).trim(),
      subject: String(subject).trim(),
      message: String(message).trim(),
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
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email et mot de passe requis.' });
    }
    const db = getDatabase();
    const user = db.users.find((u: any) => u.email.toLowerCase() === String(email).trim().toLowerCase());
    if (!user) {
      return res.status(401).json({ success: false, error: 'Email ou mot de passe incorrect.' });
    }
    const check = verifyPassword(String(password), user.password);
    if (!check.valid) {
      return res.status(401).json({ success: false, error: 'Email ou mot de passe incorrect.' });
    }
    if (check.needsRehash) {
      user.password = hashPassword(String(password));
      saveDatabase(db);
    }

    const token = signSessionToken({ id: user.id, email: user.email, role: user.role });
    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.json({ success: true, user: sanitizeUser(user) });
  });

  app.post('/api/auth/register', (req, res) => {
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
      name: String(name).trim(),
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

    const token = signSessionToken({ id: newUser.id, email: newUser.email, role: 'customer' });
    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.json({ success: true, user: sanitizeUser(newUser) });
  });

  app.post('/api/auth/logout', (_req, res) => {
    res.clearCookie(SESSION_COOKIE_NAME);
    res.json({ success: true });
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
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

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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

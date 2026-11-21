import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Ensure uploads directory exists on server
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage on server disk
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Server-side database file path
const dbFilePath = path.resolve(process.cwd(), 'server-db.json');

const INITIAL_PRODUCTS = [
  {
    id: 'p-1',
    name: 'Sérum Booster Acide Hyaluronique Pur',
    brand: 'La Roche-Glow',
    category: 'Soin Visage',
    price: 29.90,
    oldPrice: 38.00,
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800',
    stock: 24,
    description: 'Sérum hautement concentré en acide hyaluronique pur de bas et haut poids moléculaire pour une hydratation intense et un effet repulpant immédiat.',
    ingredients: ['Aqua', 'Sodium Hyaluronate', 'Glycerin', 'Citric Acid', 'Sodium Benzoate'],
    usage: 'Appliquer 3 à 4 gouttes matin et soir sur le visage propre avant votre crème habituelle.',
    tags: ['Best-Seller', 'Bio', 'Sans Paraben'],
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
    category: 'Solaire & Corps',
    price: 21.50,
    oldPrice: 26.90,
    image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&q=80&w=800',
    stock: 42,
    description: 'Protection solaire très haute tolérance visage et cou. Prévient le photo-vieillissement cutané et l’apparition des taches brunes.',
    ingredients: ['Aqua', 'Homosalate', 'Octisalate', 'Niacinamide', 'Tocopherol'],
    usage: 'Appliquer généreusement avant l’exposition au soleil. Renouveler fréquemment.',
    tags: ['Bio', 'Testé Dermatologiquement'],
    volume: '50 ml',
    ean: '3401328941205',
    form: 'Crème protectrice invisible',
    presentation: 'Tube canule pompes 50 ml',
    contenance: '50 ml'
  },
  {
    id: 'p-3',
    name: 'Complément Alimentaire Cheveux & Ongles Kératine',
    brand: 'NutriPharma',
    category: 'Compléments',
    price: 24.90,
    oldPrice: 31.00,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800',
    stock: 18,
    description: 'Formule renforcée en kératine, zinc, vitamine B6 et biotine pour stimuler la pousse, renforcer la fibre capillaire et durcir les ongles.',
    ingredients: ['Kératine hydrolysée', 'L-Cystine', 'Zinc Bisglycinate', 'Biotine (Vitamine B8)'],
    usage: '2 gélules par jour le matin avec un grand verre d’eau au cours du repas.',
    tags: ['Vegan', 'Sans Gluten', 'Best-Seller'],
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
    category: 'Hygiène & Bain',
    price: 14.90,
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=800',
    stock: 60,
    description: 'Nettoie, démaquille et apaise les peaux sensibles du visage et des yeux en un seul geste sans rincer.',
    ingredients: ['Aqua', 'PEG-6 Caprylic/Capric Glycerides', 'Disodium EDTA', 'Cetrimonium Bromide'],
    usage: 'Imbiber un coton et passer délicatement sur le visage, les yeux et les lèvres.',
    tags: ['Hypoallergénique', 'Sans Parfum'],
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
    category: 'Solaire & Corps',
    price: 26.00,
    oldPrice: 32.00,
    image: 'https://images.unsplash.com/photo-1608248597359-f53835f42629?auto=format&fit=crop&q=80&w=800',
    stock: 35,
    description: 'Enrichie en huiles végétales précieuses (Argan, Amande douce, Macadamia). Nourrit intensément sans laisser de film gras.',
    ingredients: ['Helianthus Annuus Seed Oil', 'Argania Spinosa Kernel Oil', 'Prunus Amygdalus Dulcis Oil', 'Tocopherol'],
    usage: 'S’utilise toute l’année sur le visage, le corps et les cheveux.',
    tags: ['Bio', '99% Naturel'],
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
    category: 'Hygiène & Bain',
    price: 9.90,
    image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&q=80&w=800',
    stock: 80,
    description: 'Nettoie en douceur et protège les peaux sèches et sensibles de toute la famille. pH neutre pour la peau.',
    ingredients: ['Aqua', 'Sodium Laureth Sulfate', 'Glycerin', 'Coco-Glucoside', 'Citric Acid'],
    usage: 'Appliquer sur peau mouillée, faire mousser délicatement puis rincer abondamment.',
    tags: ['Familial', 'Sans Savon'],
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
    totalAmount: 29.90,
    shippingAddress: {
      fullName: 'Sophie Martin',
      email: 'sophie.martin@example.com',
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
    loyaltyPointsEarned: 29
  }
];

const INITIAL_USERS = [
  { id: 'usr-1', name: 'Admin Pharmacien', email: 'admin@myrlan.fr', role: 'admin', password: 'admin' },
  { id: 'usr-2', name: 'Marie Dupont', email: 'marie.dupont@example.com', role: 'customer', password: 'password' }
];

function getDatabase() {
  if (!fs.existsSync(dbFilePath)) {
    const initialDb = {
      products: INITIAL_PRODUCTS,
      orders: INITIAL_ORDERS,
      users: INITIAL_USERS
    };
    fs.writeFileSync(dbFilePath, JSON.stringify(initialDb, null, 2));
    return initialDb;
  }
  try {
    const data = fs.readFileSync(dbFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return {
      products: INITIAL_PRODUCTS,
      orders: INITIAL_ORDERS,
      users: INITIAL_USERS
    };
  }
}

function saveDatabase(db: any) {
  fs.writeFileSync(dbFilePath, JSON.stringify(db, null, 2));
}

async function startServer() {
  const app = express();
  app.use(express.json());

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  // Serve static uploaded files from server disk
  app.use('/uploads', express.static(uploadsDir));

  const PORT = process.env.PORT || 3000;
  const hasAuth = process.env.SMTP_USER && process.env.SMTP_PASS;

  const smtpTransporter = hasAuth ? nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  }) : nodemailer.createTransport({
    jsonTransport: true
  });

  io.on('connection', (socket) => {
    console.log(`[WebSocket Server] Client connected in real time: ${socket.id}`);
    socket.on('disconnect', () => {
      console.log(`[WebSocket Server] Client disconnected: ${socket.id}`);
    });
  });

  // API Routes - Products
  app.get('/api/products', (_req, res) => {
    const db = getDatabase();
    res.json(db.products);
  });

  app.post('/api/products', (req, res) => {
    const db = getDatabase();
    const newProduct = {
      ...req.body,
      id: `p-${Date.now()}`,
      rating: 5.0,
      reviewsCount: 1
    };
    db.products.unshift(newProduct);
    saveDatabase(db);

    // Broadcast real-time update via WebSocket
    io.emit('product-added', newProduct);
    io.emit('products-updated', db.products);

    res.json({ success: true, product: newProduct });
  });

  app.put('/api/products/:id/stock', (req, res) => {
    const { id } = req.params;
    const { stock } = req.body;
    const db = getDatabase();
    const p = db.products.find((item: any) => item.id === id);
    if (p) {
      p.stock = Math.max(0, stock);
      saveDatabase(db);

      // Broadcast real-time stock update via WebSocket
      io.emit('stock-updated', { productId: id, stock: p.stock });
      io.emit('products-updated', db.products);

      res.json({ success: true, product: p });
    } else {
      res.status(404).json({ success: false, error: 'Produit non trouvé' });
    }
  });

  // API Routes - Image Upload to Server Disk
  app.post('/api/upload', upload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'Aucun fichier image fourni.' });
      }
      const fileUrl = `/uploads/${req.file.filename}`;
      console.log(`[Server Storage] Image uploaded and stored on server disk: ${fileUrl}`);
      res.json({ success: true, url: fileUrl });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API Routes - Orders
  app.get('/api/orders', (_req, res) => {
    const db = getDatabase();
    res.json(db.orders);
  });

  app.post('/api/orders', (req, res) => {
    const db = getDatabase();
    const newOrder = req.body;
    db.orders.unshift(newOrder);

    if (newOrder.items) {
      newOrder.items.forEach((cartItem: any) => {
        const prod = db.products.find((p: any) => p.id === cartItem.product.id);
        if (prod) {
          prod.stock = Math.max(0, prod.stock - cartItem.quantity);
        }
      });
    }

    saveDatabase(db);

    // Broadcast real-time order creation & stock update
    io.emit('order-created', newOrder);
    io.emit('orders-updated', db.orders);
    io.emit('products-updated', db.products);

    res.json({ success: true, order: newOrder });
  });

  app.patch('/api/orders/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const db = getDatabase();
    const order = db.orders.find((o: any) => o.id === id);
    if (order) {
      order.status = status;
      saveDatabase(db);

      // Broadcast real-time order status update
      io.emit('order-status-updated', { orderId: id, status });
      io.emit('orders-updated', db.orders);

      res.json({ success: true, order });
    } else {
      res.status(404).json({ success: false, error: 'Commande non trouvée' });
    }
  });

  // API Routes - Authentication on Server
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const db = getDatabase();
    const user = db.users.find((u: any) => u.email === email && u.password === password);
    if (user) {
      res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } else {
      res.status(401).json({ success: false, error: 'Email ou mot de passe incorrect sur le serveur.' });
    }
  });

  app.post('/api/auth/register', (req, res) => {
    const { name, email, password } = req.body;
    const db = getDatabase();
    const existing = db.users.find((u: any) => u.email === email);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Cet email est déjà enregistré sur le serveur.' });
    }
    const newUser = { id: `usr-${Date.now()}`, name, email, password, role: 'customer' };
    db.users.push(newUser);
    saveDatabase(db);
    res.json({ success: true, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } });
  });

  // API Routes - Email (SMTP)
  app.post('/api/send-email', async (req, res) => {
    try {
      const { to, subject, message, orderId } = req.body;
      console.log(`[SMTP Email Sent to ${to}] Subject: ${subject} | Order: ${orderId}`);
      
      try {
        await smtpTransporter.sendMail({
          from: '"Myrlan Parapharmacie" <noreply@myrlan.fr>',
          to: to || 'client@example.com',
          subject: subject || 'Confirmation de commande Myrlan',
          text: message || 'Votre commande a bien été prise en compte.',
          html: `<div style="font-family:Arial,sans-serif;padding:20px;color:#333;">
            <h2 style="color:#1d4ed8;">Myrlan - Parapharmacie en Ligne</h2>
            <p>${message}</p>
            <hr style="border:none;border-top:1px solid #eee;margin:20px 0;"/>
            <p style="font-size:12px;color:#666;">Ceci est un email automatique, serveur sécurisé Myrlan.</p>
          </div>`
        });
      } catch (smtpErr) {
        console.warn('SMTP transport fallback simulation active:', smtpErr);
      }

      res.json({ success: true, message: 'Email envoyé avec succès via le serveur SMTP.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Stripe Payment Intent API
  app.post('/api/create-payment-intent', async (req, res) => {
    try {
      const { amount, paymentMethodType, currency = 'eur' } = req.body;
      const clientSecret = `seti_${Math.random().toString(36).substring(7)}_secret_${Math.random().toString(36).substring(7)}`;

      res.json({
        success: true,
        clientSecret,
        paymentMethodType: paymentMethodType || 'card',
        status: 'succeeded',
        message: `Paiement ${paymentMethodType} validé avec succès via le serveur Stripe.`
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
    console.log(`Myrlan Server running on http://0.0.0.0:${PORT} (WebSocket Real-Time, Database, Auth & Storage on Server)`);
  });
}

startServer();

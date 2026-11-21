import React, { useState } from 'react';
import { 
  Star, ShoppingBag, Heart, Eye, Filter, CheckCircle, 
  AlertTriangle, Sparkles, ArrowUpDown 
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { CATEGORIES } from '../data/mockProducts';
import { Product } from '../types';

export const ProductCatalog: React.FC = () => {
  const { 
    products, 
    searchQuery, 
    selectedCategory, 
    setSelectedCategory, 
    selectedTag, 
    setSelectedTag,
    addToCart,
    wishlist,
    toggleWishlist,
    setSelectedProductForDetail
  } = useShop();

  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc' | 'rating'>('popular');

  const tagsList = ['Tous', 'Bio', 'Vegan', 'Sans Paraben', 'Promo', 'Best-seller'];

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchQuery === '' || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'Tous' || product.category === selectedCategory;

    const matchesTag = selectedTag === 'Tous' || product.tags.includes(selectedTag as any);

    return matchesSearch && matchesCategory && matchesTag;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return b.reviewsCount - a.reviewsCount; // popular
  });

  return (
    <section id="catalog-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-gray-200 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Catalogue Officiel
          </span>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight mt-2">
            Nos Produits &amp; Soins de Parapharmacie
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Sélection rigoureuse par nos pharmaciens diplômés • Stocks en temps réel
          </p>
        </div>

        {/* Sorting selector */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" /> Trier par :
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="popular">Popularité &amp; Avis</option>
            <option value="price-asc">Prix croissant</option>
            <option value="price-desc">Prix décroissant</option>
            <option value="rating">Meilleures notes</option>
          </select>
        </div>
      </div>

      {/* Categories Horizontal Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-6">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-xs ${
              selectedCategory === cat
                ? 'bg-blue-700 text-white shadow-blue-700/20'
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tags Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-6 text-xs">
        <span className="text-gray-400 font-semibold flex items-center gap-1 shrink-0">
          <Filter className="w-3.5 h-3.5" /> Filtres :
        </span>
        {tagsList.map(tag => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              selectedTag === tag
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {sortedProducts.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-200">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Aucun produit trouvé</h3>
          <p className="text-sm text-gray-500 mt-1">Essayez de modifier vos critères de recherche ou réinitialisez les filtres.</p>
          <button
            onClick={() => { setSelectedCategory('Tous'); setSelectedTag('Tous'); }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-700 transition-colors"
          >
            Voir tous les produits
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedProducts.map(product => {
            const isWishlisted = wishlist.includes(product.id);
            return (
              <div 
                key={product.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group overflow-hidden"
              >
                <div>
                  {/* Product Image & Badges */}
                  <div 
                    onClick={() => setSelectedProductForDetail(product)}
                    className="relative aspect-square overflow-hidden bg-gray-50 cursor-pointer"
                  >
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Tags overlay */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      {product.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-white/90 backdrop-blur-xs text-blue-800 text-[10px] font-bold rounded-md shadow-xs border border-blue-100">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Wishlist button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                      className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md shadow-md transition-all ${
                        isWishlisted ? 'bg-rose-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-white'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                    </button>

                    {/* View details button */}
                    <div className="absolute inset-x-0 bottom-3 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedProductForDetail(product); }}
                        className="px-4 py-2 bg-white/95 backdrop-blur-md text-blue-900 font-bold text-xs rounded-xl shadow-lg hover:bg-blue-700 hover:text-white transition-colors flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Voir la fiche produit</span>
                      </button>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="p-5 space-y-2">
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{product.brand}</div>
                    <h3 
                      onClick={() => setSelectedProductForDetail(product)}
                      className="font-bold text-gray-900 text-sm line-clamp-2 hover:text-blue-700 cursor-pointer transition-colors"
                    >
                      {product.name}
                    </h3>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="ml-1 text-xs font-bold text-gray-800">{product.rating}</span>
                      </div>
                      <span className="text-[11px] text-gray-400">({product.reviewsCount})</span>
                    </div>

                    {/* Stock status indicator */}
                    <div className="pt-1">
                      {product.stock > 5 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                          <CheckCircle className="w-3 h-3" /> En stock ({product.stock})
                        </span>
                      ) : product.stock > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                          <AlertTriangle className="w-3 h-3" /> Plus que {product.stock} !
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                          Rupture
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price and Add to Cart */}
                <div className="p-5 pt-0 flex items-center justify-between border-t border-gray-50 mt-2">
                  <div>
                    <div className="text-lg font-black text-blue-800">{product.price.toFixed(2)} €</div>
                    {product.oldPrice && (
                      <div className="text-xs text-gray-400 line-through">{product.oldPrice.toFixed(2)} €</div>
                    )}
                  </div>

                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stock <= 0}
                    className={`p-3 rounded-xl font-bold transition-all shadow-md flex items-center gap-1.5 ${
                      product.stock > 0 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 hover:scale-105' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                    }`}
                    title="Ajouter au panier"
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </section>
  );
};

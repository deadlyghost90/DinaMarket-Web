import React from "react";
import { Star, ShoppingCart, Percent, Award } from "lucide-react";
import { Product } from "../types";
import { Language, getTranslation } from "../dictionary";

interface ProductCardProps {
  key?: any;
  product: Product;
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product, e?: React.MouseEvent) => void;
  lang: Language;
}

export default function ProductCard({ product, onSelect, onAddToCart, lang }: ProductCardProps) {
  const isOutOfStock = product.stock <= 0;
  const isBoosted = product.boost_score >= 100;

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={() => onSelect(product)}
      className="bg-white rounded-xl overflow-hidden border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group cursor-pointer relative"
    >
      {/* Boost Badge indicator (strictly no emojis) */}
      {isBoosted && (
        <span 
          id={`boost-badge-${product.id}`}
          className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 bg-[#0056B3] text-white text-[10px] font-bold rounded-full tracking-wide shadow"
        >
          <Award className="w-3.5 h-3.5 text-yellow-300" />
          {lang === "en" ? "NEW LAUNCH BOOST" : "نئی دکان فروغ"}
        </span>
      )}

      {/* Product Image Panel container */}
      <div className="relative aspect-square w-full bg-slate-50 overflow-hidden">
        <img
          src={product.images?.[0] || "https://images.unsplash.com/photo-1542838132-92c53300491e"}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center">
            <span className="px-4 py-2 bg-rose-600 text-white font-extrabold text-sm rounded shadow">
              {getTranslation("outOfStock", lang)}
            </span>
          </div>
        )}
      </div>

      {/* Description Content Box */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="mb-2">
          {/* Category */}
          <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
            {lang === "en" ? product.category : product.category}
          </span>
          {/* Title */}
          <h4 id={`product-title-${product.id}`} className="text-slate-800 font-bold text-base line-clamp-1 group-hover:text-[#0056B3] transition-colors mt-0.5">
            {lang === "en" ? product.title : (product.titleUrdu || product.title)}
          </h4>
        </div>

        {/* Realtime Ratings Display */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex items-center text-amber-500">
            <Star className="w-4 h-4 fill-amber-500 stroke-amber-500" />
          </div>
          <span className="text-sm font-bold text-slate-700">
            {product.rating ? product.rating.toFixed(1) : "5.0"}
          </span>
          <span className="text-xs text-slate-400">
            {getTranslation("reviewsCount", lang, { count: product.reviewCount || 0 })}
          </span>
        </div>

        {/* Realtime Buyers Status Display */}
        <div className="flex items-center gap-2 mb-4 bg-slate-50 p-2 rounded-lg text-slate-600">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
            {lang === "en" ? "VOLUME:" : "حجم:"}
          </span>
          <span className="text-xs font-semibold">
            {product.totalBuyers || 0} {getTranslation("buyers", lang)}
          </span>
          <span className="text-xs text-slate-300">|</span>
          <span className="text-xs font-bold text-[#00A86B]">
            {product.monthly_orders || 0} {lang === "en" ? "orders" : "آرڈرز"}
          </span>
        </div>

        {/* Bottom Price & Call-To-Action trigger container */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-slate-400">
              {lang === "en" ? "PRICE" : "قیمت"}
            </span>
            <span id={`price-label-${product.id}`} className="text-lg font-black text-rose-600">
              Rs. {product.price.toLocaleString()}
            </span>
          </div>

          <button
            id={`add-to-cart-btn-${product.id}`}
            disabled={isOutOfStock}
            onClick={(e) => onAddToCart(product, e)}
            className={`p-2.5 rounded-full transition-all duration-300 cursor-pointer ${
              isOutOfStock
                ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                : "bg-emerald-50 text-[#00A86B] hover:bg-[#00A86B] hover:text-white"
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

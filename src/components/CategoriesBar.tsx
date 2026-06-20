import React from "react";
import { 
  ShoppingBag, 
  Shirt, 
  Sparkles, 
  Tv, 
  Car, 
  Utensils, 
  LayoutGrid,
  Trophy
} from "lucide-react";
import { Language } from "../dictionary";

interface Category {
  id: string;
  nameEn: string;
  nameUr: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CATEGORIES: Category[] = [
  { id: "All", nameEn: "All Products", nameUr: "تمام مصنوعات", icon: LayoutGrid },
  { id: "Fast Food", nameEn: "Fast Food", nameUr: "فاسٹ فوڈ", icon: Utensils },
  { id: "Grocery", nameEn: "Grocery", nameUr: "گروسری", icon: ShoppingBag },
  { id: "Clothes", nameEn: "Clothes", nameUr: "ملبوسات", icon: Shirt },
  { id: "Cosmetics", nameEn: "Cosmetics", nameUr: "آرائش و حسن", icon: Sparkles },
  { id: "Sports", nameEn: "Sports", nameUr: "کھیلوں کا سامان", icon: Trophy },
  { id: "Electronics", nameEn: "Electronics", nameUr: "الیکٹرانکس", icon: Tv },
  { id: "Rent-a-Car", nameEn: "Rent-a-Car", nameUr: "رینٹ اے کار", icon: Car },
];

interface CategoriesBarProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  lang: Language;
}

export default function CategoriesBar({ selectedCategory, setSelectedCategory, lang }: CategoriesBarProps) {
  return (
    <div id="categories-container" className="my-8">
      <div className="flex items-center justify-between mb-4">
        <h3 id="categories-header-title" className="text-[#212121] font-bold text-xl tracking-tight flex items-center gap-2">
          <span className="w-2.5 h-6 bg-[#00A86B] rounded-full inline-block"></span>
          {lang === "en" ? "Explore Categories" : "زمرہ جات تلاش کریں"}
        </h3>
      </div>
      
      {/* Scrollable container with hidden scrollbar */}
      <div 
        id="scrollable-categories-rail" 
        className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              id={`cat-button-${cat.id.replace(/\s+/g, "-")}`}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-3 px-5 py-3 rounded-full border transition-all duration-300 shrink-0 select-none cursor-pointer ${
                isSelected
                  ? "bg-[#00A86B] border-[#00A86B] text-white shadow-md shadow-emerald-100 scale-102 font-semibold"
                  : "bg-white border-slate-200 text-[#212121] hover:border-[#0056B3]/60 hover:text-[#0056B3]"
              }`}
            >
              <Icon className={`w-5 h-5 ${isSelected ? "text-white" : "text-slate-500"}`} />
              <span className="text-sm">
                {lang === "en" ? cat.nameEn : cat.nameUr}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

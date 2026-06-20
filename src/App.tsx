import React, { useState, useEffect } from "react";
import { 
  Store, 
  ShoppingCart, 
  Search, 
  Globe, 
  LogOut, 
  Lock, 
  HelpCircle, 
  ShieldAlert, 
  ArrowLeftRight, 
  CheckCircle,
  Clock,
  Briefcase,
  FileText,
  Shield,
  ExternalLink,
  X
} from "lucide-react";
import { auth, rtdb, seedInitialData } from "./firebase";
import { onValue, ref, get } from "firebase/database";
import { Product, CartItem, Seller } from "./types";
import { Language, getTranslation } from "./dictionary";

// Import modular subcomponents
import ShopifySlider from "./components/ShopifySlider";
import CategoriesBar from "./components/CategoriesBar";
import ProductCard from "./components/ProductCard";
import ProductDetailsModal from "./components/ProductDetailsModal";
import CheckoutModal from "./components/CheckoutModal";
import SellerSuite from "./components/SellerSuite";
import NotificationInbox from "./components/NotificationInbox";
import AuthModal from "./components/AuthModal";

export default function App() {
  const [lang, setLang] = useState<Language>("en");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeView, setActiveView] = useState<"buyer" | "seller">("buyer");
  
  // Realtime Database catalog State
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [sellersList, setSellersList] = useState<Record<string, Seller>>({});
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Local shopping cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  // User state
  const [user, setUser] = useState(auth.currentUser);

  // Active floating legal modal subviews
  const [activeLegalModal, setActiveLegalModal] = useState<"terms" | "privacy" | null>(null);

  // Initial seeding and dynamic database listeners
  useEffect(() => {
    // 1. Fire seed controller if database is empty on first boot
    seedInitialData();

    // 2. Setup live database listeners on catalog
    const productsRef = ref(rtdb, "products");
    const unsubProducts = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = Object.values(snapshot.val()) as Product[];
        
        // Smart Boosting sorting logic:
        // Every product node contains fields "monthly_orders" (Int) and "boost_score" (Int).
        // Sort homepage utilizing order criteria where higher boost_score is presented first,
        // and subsequently descending.
        data.sort((a, b) => (b.boost_score || 0) - (a.boost_score || 0));
        setProductsList(data);
      } else {
        setProductsList([]);
      }
    });

    // 3. Setup live database listeners on sellers registry
    const sellersRef = ref(rtdb, "sellers");
    const unsubSellers = onValue(sellersRef, (snapshot) => {
      if (snapshot.exists()) {
        setSellersList(snapshot.val());
      } else {
        setSellersList({});
      }
    });

    // 4. Setup firebase auth observer
    const unsubAuth = auth.onAuthStateChanged((currUser) => {
      setUser(currUser);
    });

    return () => {
      unsubProducts();
      unsubSellers();
      unsubAuth();
    };
  }, []);

  // Update language toggle
  const toggleLanguage = () => {
    setLang((prev) => (prev === "en" ? "ur" : "en"));
  };

  // Switch workspace view - auth enforced
  const handleSwitchView = () => {
    if (activeView === "buyer") {
      if (!user) {
        setIsAuthOpen(true);
      } else {
        setActiveView("seller");
      }
    } else {
      setActiveView("buyer");
    }
  };

  // Add items inside local shopping cart
  const handleAddToCart = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (product.stock <= 0) return;

    setCartItems((prev) => {
      const idx = prev.findIndex((item) => item.product.id === product.id);
      if (idx > -1) {
        const copy = [...prev];
        const newQty = Math.min(product.stock, copy[idx].quantity + 1);
        copy[idx] = { ...copy[idx], quantity: newQty };
        return copy;
      } else {
        return [...prev, { product, quantity: 1 }];
      }
    });
    
    // Auto toggle sliding preview
    setIsCartOpen(true);
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setCartItems((prev) => {
      const idx = prev.findIndex((item) => item.product.id === productId);
      if (idx === -1) return prev;
      
      const copy = [...prev];
      const maxStock = copy[idx].product.stock;
      const nextQty = copy[idx].quantity + delta;

      if (nextQty <= 0) return prev;
      copy[idx] = { ...copy[idx], quantity: Math.min(maxStock, nextQty) };
      return copy;
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setActiveView("buyer");
    } catch (err) {
      console.error("Sign out process failed: ", err);
    }
  };

  // Filter Catalog lists based on horizontal category or search box queries
  const filteredProducts = productsList.filter((p) => {
    const matchesCategory = activeCategory === "All" || p.category === activeCategory;
    const cleanSearch = searchQuery.toLowerCase().trim();
    const titleMatch = p.title?.toLowerCase().includes(cleanSearch) || p.titleUrdu?.includes(cleanSearch);
    const descMatch = p.description?.toLowerCase().includes(cleanSearch) || p.descriptionUrdu?.includes(cleanSearch);
    return matchesCategory && (titleMatch || descMatch);
  });

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div id="dinamarket-applet-root" className="min-h-screen bg-[#F8F9FA] text-[#212121] font-sans antialiased flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-800">
      
      {/* Top Notification Dispatch Bar / Global Banner under PECA rules */}
      <div id="global-peca-ticker" className="bg-[#0056B3] text-white py-2 px-4 text-center text-xs font-semibold tracking-wider flex items-center justify-center gap-1.5 shadow select-none">
        <Shield className="w-4 h-4 text-emerald-300 stroke-[2.5]" />
        <span>{getTranslation("pecaNotice", lang)}</span>
        <span className="text-blue-200">|</span>
        <Clock className="w-3.5 h-3.5" />
        <span className="font-mono text-[11px]">UTC: 2026-06-20 GMT</span>
      </div>

      {/* Main Core Navigation Bar Header */}
      <header id="main-navigation-header" className="sticky top-0 z-40 bg-white border-b-2 border-[#00A86B] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          
          {/* Logo brand */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView("buyer")} 
              className="flex items-center gap-2 font-black text-2xl tracking-tight text-[#212121] text-left hover:scale-102 transition-transform cursor-pointer focus:outline-none"
            >
              <span className="p-1.5 bg-emerald-50 text-[#00A86B] rounded-xl flex items-center justify-center">
                <Store className="w-6 h-6 stroke-[2.5]" />
              </span>
              <span>
                DinaMarket<span className="text-[#00A86B] font-bold text-sm block tracking-widest leading-none">PAKISTAN</span>
              </span>
            </button>
          </div>

          {/* Center search bar - responsive hides on mobile */}
          {activeView === "buyer" && (
            <div className="hidden md:flex flex-1 max-w-md relative">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[#0056B3]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={getTranslation("searchPlaceholder", lang)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F8F9FA] hover:bg-slate-100 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#0056B3] placeholder-slate-400 font-medium"
              />
            </div>
          )}

          {/* Right utility toolbar actions */}
          <div className="flex items-center gap-3 shrink-0">
            
            {/* Language toggle (English/Urdu dictionary updates) */}
            <button
              onClick={toggleLanguage}
              title="Toggle language / مٹی متبادل زبان"
              className="p-2.5 rounded-full bg-slate-50 border hover:bg-slate-150 text-slate-700 cursor-pointer flex items-center gap-1.5 text-xs font-bold transition-transform hover:scale-105"
            >
              <Globe className="w-4 h-4 text-[#00A86B]" />
              <span>{lang === "en" ? "اردو" : "English"}</span>
            </button>

            {/* Live alerts inbox tracking */}
            {user && <NotificationInbox lang={lang} />}

            {/* Cart utility tool inside Buyer mode */}
            {activeView === "buyer" && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2.5 rounded-full bg-slate-50 border hover:bg-slate-100 text-slate-700 cursor-pointer flex items-center justify-center transition-transform hover:scale-105"
              >
                <ShoppingCart className="w-5 h-5 text-slate-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white px-1 shadow">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* Portal Switch View: Buyer <-> Seller */}
            <button
              onClick={handleSwitchView}
              className={`px-4 py-2.5 rounded-xl font-extrabold text-xs tracking-wider uppercase flex items-center gap-1.5 cursor-pointer shadow-xs transition-all ${
                activeView === "buyer"
                  ? "bg-[#0056B3] hover:bg-[#004085] text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span className="hidden sm:inline">
                {activeView === "buyer" ? getTranslation("switchToSeller", lang) : getTranslation("switchToBuyer", lang)}
              </span>
            </button>

            {/* Log out / Auth Button toggle */}
            {user ? (
              <button
                onClick={handleLogout}
                title="Sign out account"
                className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 cursor-pointer flex items-center justify-center transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="px-4 py-2 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-[#00A86B] font-bold text-xs rounded-xl cursor-pointer"
              >
                {lang === "en" ? "Login" : "لاگ ان"}
              </button>
            )}

          </div>

        </div>
      </header>

      {/* Main Core Content Stage */}
      <main className="flex-1 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Guest Browsing banner */}
          {!user && activeView === "buyer" && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-250 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2 select-none leading-relaxed">
              <ShieldAlert className="w-5 h-5 text-[#00A86B] shrink-0" />
              <span>{getTranslation("guestNotice", lang)}</span>
            </div>
          )}

          {activeView === "buyer" ? (
            /* =================================================================
               BUYER SCREEN VIEWPORTS
               ================================================================= */
            <div className="space-y-8 animate-in fade-in duration-200">
              
              {/* Shopify-style slideshow */}
              <ShopifySlider lang={lang} />

              {/* Horizontal search inside mobile layout */}
              <div className="block md:hidden relative w-full mt-4">
                <Search className="absolute left-3 top-3.5 w-4 h-4 text-[#0056B3]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={getTranslation("searchPlaceholder", lang)}
                  className="w-full pl-9 pr-4 py-3 bg-[#F8F9FA] border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#0056B3] placeholder-slate-400 font-semibold"
                />
              </div>

              {/* Categories Selection Bar */}
              <CategoriesBar
                selectedCategory={activeCategory}
                setSelectedCategory={setActiveCategory}
                lang={lang}
              />

              {/* Dynamic Responsive 2-column or 4-column Grid Layout */}
              <div className="space-y-4">
                <h3 className="text-slate-800 font-black text-lg flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-[#00A86B]" />
                  {lang === "en" ? "Marketplace Catalog Stock" : "دکان کی تمام اشیاء"}
                  {searchQuery && (
                    <span className="text-xs text-slate-400 font-normal ml-2">
                      ({lang === "en" ? "Results for:" : "نتائج برائے"} "{searchQuery}")
                    </span>
                  )}
                </h3>

                {productsList.length === 0 ? (
                  <div className="text-center py-16 px-6 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 max-w-2xl mx-auto space-y-4">
                    <div className="p-3 bg-emerald-50 text-[#00A86B] rounded-full inline-block">
                      <Store className="w-8 h-8 mx-auto" />
                    </div>
                    <h3 className="text-slate-800 font-extrabold text-base">
                      {lang === "en" ? "Marketplace Directory is Empty" : "مارکیٹ ڈائریکٹری ابھی خالی ہے"}
                    </h3>
                    <p className="text-slate-500 text-xs md:text-sm leading-relaxed max-w-md mx-auto">
                      {lang === "en" 
                        ? "Currently, no active products have been listed by any users. Switch to the Seller Suite in the top right, register a quick store business name, and launch your first real live listing!" 
                        : "اس وقت کسی بھی صارف کی طرف سے کوئی بھی پروڈکٹ فروخت کے لیے درج نہیں کی گئی ہے۔ اپنی اصلی پروڈکٹ شامل کرنے کے لیے اوپر دائیں جانب 'بیچیں اور کمائیں' پر جائیں اور کاروبار شروع کریں!"}
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={handleSwitchView}
                        className="px-6 py-2.5 bg-[#00A86B] hover:bg-[#008F5A] text-white font-extrabold text-xs tracking-wider uppercase rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-xs"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                        <span>{lang === "en" ? "Register & Add Product" : "پہلی پروڈکٹ شامل کریں"}</span>
                      </button>
                    </div>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-20 border border-dashed rounded-2xl bg-slate-50 text-slate-400">
                    <p className="font-medium text-sm">
                      {lang === "en" ? "No items match your criteria." : "اس زمرے میں کوئی مصنوعات نہیں ملیں۔"}
                    </p>
                  </div>
                ) : (
                  <div id="products-homepage-grid" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredProducts.map((prod) => (
                      <ProductCard
                        key={prod.id}
                        product={prod}
                        lang={lang}
                        onSelect={setSelectedProduct}
                        onAddToCart={handleAddToCart}
                      />
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* =================================================================
               SELLER suite DASHBOARD PORTAL
               ================================================================= */
            <div className="animate-in fade-in duration-200">
              <SellerSuite lang={lang} />
            </div>
          )}

        </div>
      </main>

      {/* Main Legal Footer area */}
      <footer id="main-legal-footer" className="bg-slate-900 text-slate-400 py-12 px-4 border-t-4 border-[#00A86B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          
          <div className="space-y-4">
            <h4 className="text-white font-bold text-base flex items-center gap-2">
              <span className="w-2 h-4 bg-[#00A86B]"></span>
              DinaMarket Pakistan
            </h4>
            <p className="text-slate-400 text-xs text-justify leading-relaxed">
              {lang === "en" 
                ? "DinaMarket Pakistan act as a non-custodial decentralized marketplace directory, empowering peer-to-peer entrepreneurships across Pakistan. All digital orders, direct wallet payments (EasyPaisa/JazzCash), and physical deliveries belong independently to sellers."
                : "دینا مارکیٹ پاکستان ایک غیر مرکزی بازار ڈائریکٹری ہے۔ خریدار اور بیچنے والے براہ راست لین دین کرتے ہیں۔ لاجسٹکس اور ڈیلیوری مکمل طور پر بیچنے والے کے کنٹرول میں ہے۔"}
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-bold text-base flex items-center gap-2">
              <span className="w-2 h-4 bg-[#0056B3]"></span>
              Sovereign Legal Protection
            </h4>
            <p className="text-slate-400 text-xs text-justify leading-relaxed">
              {lang === "en"
                ? "This platform is structured in absolute compliance with sovereign Prevention of Electronic Crimes Act (PECA) laws of Pakistan. We hold zero user escrow. Direct payment tracking via 12-digit transaction TID codes secures user capital against fraud."
                : "یہ پلیٹ فارم قوانین پیکا (PECA) پاکستان کے عین مطابق ڈیزائن کیا گیا ہے۔ ہم کسی قسم کے کاروباری تنازعات کے ذمہ دار نہیں ہیں۔ براہ راست 12 ہندسوں کا ٹی آئی ڈی کوڈ درج کریں تاکہ دھوکہ دہی سے بچا جا سکے۔"}
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-bold text-base flex items-center gap-2">
              <span className="w-2 h-4 bg-emerald-500"></span>
              Legal Quick Links
            </h4>
            <div className="flex flex-col gap-3 font-semibold text-xs">
              <button 
                onClick={() => setActiveLegalModal("terms")}
                className="text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>{getTranslation("terms", lang)} - PECA Compliance Directives</span>
              </button>
              
              <button 
                onClick={() => setActiveLegalModal("privacy")}
                className="text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer flex items-center gap-1.5"
              >
                <Shield className="w-4 h-4" />
                <span>{getTranslation("privacy", lang)} - PII Isolation Standard</span>
              </button>

              <div className="pt-2 text-[10px] text-slate-500 flex flex-col gap-1.5">
                <a href="/terms.html" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-white flex items-center gap-1">
                  View static terms.html <ExternalLink className="w-3 h-3" />
                </a>
                <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-white flex items-center gap-1">
                  View static privacy.html <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800 text-center text-xs text-slate-500 mt-8 pt-8">
          &copy; 2026 DinaMarket Pakistan e-Commerce P2P Portal. Supporting Pakistan startups and local micro-merchants with pride.
        </div>
      </footer>

      {/* =================================================================
         MODAL PORTALS (AUTH, PRODUCT DETAILS, CHECKOUT CART & LEGALS)
         ================================================================= */}

      {/* Firebase authentication Portal */}
      {isAuthOpen && (
        <AuthModal 
          lang={lang} 
          onClose={() => setIsAuthOpen(false)} 
        />
      )}

      {/* Product reviews, details, comments portal */}
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          lang={lang}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          onTriggerAuth={() => {
            setSelectedProduct(null);
            setIsAuthOpen(true);
          }}
        />
      )}

      {/* Local shopping cart & Checkout Modal portal */}
      {isCartOpen && (
        <CheckoutModal
          cartItems={cartItems}
          onUpdateQty={handleUpdateQty}
          onRemoveItem={handleRemoveFromCart}
          onClearCart={handleClearCart}
          lang={lang}
          onClose={() => setIsCartOpen(false)}
          onTriggerAuth={() => {
            setIsCartOpen(false);
            setIsAuthOpen(true);
          }}
        />
      )}

      {/* Static Legal overlay display portals */}
      {activeLegalModal && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs z-55 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col justify-between max-h-[85vh]">
            <div className="px-6 py-4 border-b bg-slate-50 border-slate-100 flex justify-between items-center">
              <span className="font-extrabold text-slate-800 text-base">
                {activeLegalModal === "terms" ? getTranslation("terms", lang) : getTranslation("privacy", lang)}
              </span>
              <button 
                onClick={() => setActiveLegalModal(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto text-sm leading-relaxed text-justify space-y-4">
              {activeLegalModal === "terms" ? (
                <>
                  <h4 className="font-bold text-slate-800">1. Decentralized Facilitation</h4>
                  <p>
                    DinaMarket Pakistan operates as a decentralized peer-to-peer visual database directory. We do not inspect, manage, or ship physical catalog assets. Safe delivery operations originate directly with the chosen merchant.
                  </p>
                  
                  <h4 className="font-bold text-slate-800">2. Wallet TIDs & Zero-Escrow Protection</h4>
                  <p>
                    All billing relies on direct Peer-to-Peer wall transfers via regional EasyPaisa & JazzCash apps. Entering the correct 12-digit transaction code (TID) serves as authentic verification. We hold no buyer commissions or escrow balances.
                  </p>

                  <h4 className="font-bold text-slate-800">3. Success Fees</h4>
                  <p>
                    Store setup remains free. Merchants agree to settle a minor percentage support fee only after successfully logging 5 to 10 completed orders to offset host server operations.
                  </p>

                  <h4 className="font-bold text-slate-800">4. Logistics Coordinates</h4>
                  <p>
                    Logistics operates exclusively under Self-Pickup or Merchant-Owned courier structures. DinaMarket employs no riders on public roadways.
                  </p>
                </>
              ) : (
                <>
                  <h4 className="font-bold text-slate-800">1. Personally Identifiable Information (PII)</h4>
                  <p>
                    User names, cell numbers, and delivery physical addresses are collected for the sole purpose of enabling merchants to arrange local transit. Profile data is locked securely under Firebase Authentication parameters.
                  </p>

                  <h4 className="font-bold text-slate-800">2. Third-Party Sharing</h4>
                  <p>
                    PII variables map exclusively with the specific seller involved in the cart request to verify EasyPaisa/JazzCash and prepare items. We run zero profiling cookies or banner ad trackers.
                  </p>

                  <h4 className="font-bold text-slate-800">3. Transaction Security</h4>
                  <p>
                    12-digit transaction ID (TID) confirmation digits exist in write-only logs visible purely between you and the designated merchant.
                  </p>
                </>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveLegalModal(null)}
                className="px-6 py-2 bg-[#00A86B] text-white font-extrabold rounded-lg text-xs tracking-wider uppercase cursor-pointer"
              >
                {lang === "en" ? "Acknowledge" : "تصدیق کریں"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect } from "react";
import { 
  Store, 
  Settings, 
  Package, 
  ClipboardList, 
  Plus, 
  Check, 
  Truck, 
  MessageCircle, 
  Edit3, 
  Trash2, 
  Send, 
  BellRing, 
  CircleDot, 
  Loader2,
  X
} from "lucide-react";
import { Product, Seller, Order, UserNotification } from "../types";
import { auth, rtdb } from "../firebase";
import { ref, set, push, onValue, get, remove } from "firebase/database";
import { Language, getTranslation } from "../dictionary";
import ImageUploader from "./ImageUploader";

interface SellerSuiteProps {
  lang: Language;
}

export default function SellerSuite({ lang }: SellerSuiteProps) {
  const [sellerProfile, setSellerProfile] = useState<Seller | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Registration Form State
  const [regName, setRegName] = useState("");
  const [regBio, setRegBio] = useState("");
  const [regLogo, setRegLogo] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regWhats, setRegWhats] = useState("");
  const [hasInitializedForm, setHasInitializedForm] = useState(false);

  // Tabs: "inventory" | "orders" | "settings"
  const [activeTab, setActiveTab] = useState<"inventory" | "orders" | "settings">("inventory");

  // Inventory State
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Product Form State
  const [pTitle, setPTitle] = useState("");
  const [pTitleUrdu, setPTitleUrdu] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pDescUrdu, setPDescUrdu] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pStock, setPStock] = useState("");
  const [pCategory, setPCategory] = useState("Clothes");
  const [pImg1, setPImg1] = useState("");
  const [pImg2, setPImg2] = useState("");
  const [pImg3, setPImg3] = useState("");

  // Orders State
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [alertTargetOrder, setAlertTargetOrder] = useState<Order | null>(null);
  const [deliveryAlertMsg, setDeliveryAlertMsg] = useState("");

  const currentUser = auth.currentUser;

  // Retrieve Seller Profile Details
  useEffect(() => {
    if (!currentUser) return;

    const sellerRef = ref(rtdb, `sellers/${currentUser.uid}`);
    const unsubscribe = onValue(sellerRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val() as Seller;
        setSellerProfile(data);
        if (!hasInitializedForm) {
          setRegName(data.businessName || "");
          setRegBio(data.bio || "");
          setRegLogo(data.logoUrl || "");
          setRegAddress(data.address || "");
          setRegWhats(data.whatsappNumber || "");
          setHasInitializedForm(true);
        }
      } else {
        setSellerProfile(null);
      }
      setProfileLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, hasInitializedForm]);

  // Retrieve Products for this merchant
  useEffect(() => {
    if (!currentUser || !sellerProfile) return;

    const productsRef = ref(rtdb, "products");
    const unsubscribe = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const prodData = Object.values(snapshot.val()) as Product[];
        const filtered = prodData.filter(p => p.sellerId === currentUser.uid);
        setAllProducts(filtered);
      } else {
        setAllProducts([]);
      }
    });

    return () => unsubscribe();
  }, [currentUser, sellerProfile]);

  // Retrieve Orders for this merchant
  useEffect(() => {
    if (!currentUser || !sellerProfile) return;

    const ordersRef = ref(rtdb, "orders");
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        const ordersData = Object.values(snapshot.val()) as Order[];
        const filtered = ordersData.filter(o => o.sellerId === currentUser.uid);
        // Sort newest first
        filtered.sort((a,b) => b.createdAt - a.createdAt);
        setMyOrders(filtered);
      } else {
        setMyOrders([]);
      }
    });

    return () => unsubscribe();
  }, [currentUser, sellerProfile]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const profile: Seller = {
      uid: currentUser.uid,
      businessName: regName || "My Pakistan Shop",
      bio: regBio || "Local micro startup",
      logoUrl: regLogo || "https://images.unsplash.com/photo-1542838132-92c53300491e",
      address: regAddress || "Sovereign Pakistan Hub",
      email: currentUser.email || "support@dinamarket.pk",
      whatsappNumber: regWhats || "03001234567"
    };

    try {
      await set(ref(rtdb, `sellers/${currentUser.uid}`), profile);
    } catch (err) {
      console.error("Error writing seller profile: ", err);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const imageArray = [pImg1, pImg2, pImg3].map(url => url.trim()).filter(url => url !== "");
    if (imageArray.length === 0) {
      imageArray.push("https://images.unsplash.com/photo-1542838132-92c53300491e"); 
    }

    try {
      const prodId = isEditMode && selectedProduct ? selectedProduct.id : push(ref(rtdb, "products")).key || Math.random().toString();
      
      const newProduct: Product = {
        id: prodId,
        sellerId: currentUser.uid,
        sellerWhatsapp: sellerProfile?.whatsappNumber || "03001234567",
        title: pTitle,
        titleUrdu: pTitleUrdu || pTitle,
        description: pDesc,
        descriptionUrdu: pDescUrdu || pDesc,
        price: Number(pPrice) || 100,
        stock: Number(pStock) || 10,
        category: pCategory,
        images: imageArray,
        monthly_orders: isEditMode && selectedProduct ? (selectedProduct.monthly_orders || 0) : 0,
        boost_score: isEditMode && selectedProduct ? (selectedProduct.boost_score || 100) : 100, // Launch with Boost 100
        rating: isEditMode && selectedProduct ? (selectedProduct.rating || 5) : 5,
        reviewCount: isEditMode && selectedProduct ? (selectedProduct.reviewCount || 0) : 0,
        totalBuyers: isEditMode && selectedProduct ? (selectedProduct.totalBuyers || 0) : 0,
      };

      await set(ref(rtdb, `products/${prodId}`), newProduct);
      
      // Clear Form state
      setPTitle("");
      setPTitleUrdu("");
      setPDesc("");
      setPDescUrdu("");
      setPPrice("");
      setPStock("");
      setPImg1("");
      setPImg2("");
      setPImg3("");
      setIsEditMode(false);
      setSelectedProduct(null);

    } catch (error) {
      console.error("Error submitting product profile: ", error);
    }
  };

  const handleEditInit = (prod: Product) => {
    setSelectedProduct(prod);
    setIsEditMode(true);
    setPTitle(prod.title || "");
    setPTitleUrdu(prod.titleUrdu || "");
    setPDesc(prod.description || "");
    setPDescUrdu(prod.descriptionUrdu || "");
    setPPrice(String(prod.price) || "");
    setPStock(String(prod.stock) || "");
    setPCategory(prod.category || "Clothes");
    setPImg1(prod.images?.[0] || "");
    setPImg2(prod.images?.[1] || "");
    setPImg3(prod.images?.[2] || "");
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm(lang === "en" ? "Delete product permanently?" : "کیا آپ اس پروڈکٹ کو حذف کرنا چاہتے ہیں؟")) {
      try {
        await remove(ref(rtdb, `products/${id}`));
      } catch (err) {
        console.error("Error deleting product: ", err);
      }
    }
  };

  // Status transitions
  const handleVerifyPendingTID = async (orderId: string) => {
    try {
      const orderRef = ref(rtdb, `orders/${orderId}`);
      await set(orderRef, {
        ...(myOrders.find(o => o.id === orderId)),
        status: "Confirmed"
      });
    } catch (err) {
      console.error("Error confirming TID order status: ", err);
    }
  };

  const handleCompleteDispatchAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTargetOrder) return;

    try {
      // 1. Move status of order to completed
      const orderRef = ref(rtdb, `orders/${alertTargetOrder.id}`);
      await set(orderRef, {
        ...alertTargetOrder,
        status: "Completed",
        deliveryAlert: deliveryAlertMsg || "Your order is verified and dispatched successfully!"
      });

      // 2. Write Notification immediately straight to specific buyer's live notifications inbox
      const notificationsRef = ref(rtdb, "notifications");
      const newNotifRef = push(notificationsRef);
      const newNotification: UserNotification = {
        id: newNotifRef.key || Math.random().toString(),
        userId: alertTargetOrder.buyerId,
        message: `🔔 [${sellerProfile?.businessName}]: ${deliveryAlertMsg || "Your direct wallet paid order is verified & dispatch scheduled!"}`,
        timestamp: Date.now(),
        read: false
      };
      
      await set(newNotifRef, newNotification);

      // Reset dispatch overlay
      setAlertTargetOrder(null);
      setDeliveryAlertMsg("");

    } catch (err) {
      console.error("Error writing completed notification: ", err);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl p-8 border">
        <Loader2 className="w-8 h-8 text-[#0056B3] animate-spin mb-4" />
        <p className="text-slate-600 font-medium">
          {lang === "en" 
            ? "Authentication session missing. Switch back to Guest or log in." 
            : "سیشن کا وقت ختم۔ براہ کرم ہوم اسکرین پر کلک کر کے دوبارہ لاگ ان کریں۔"}
        </p>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="flex justify-center items-center py-20 bg-white rounded-2xl border">
        <Loader2 className="w-10 h-10 text-[#00A86B] animate-spin" />
      </div>
    );
  }

  // registration modal portal check
  if (!sellerProfile) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-12 shadow-sm max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Store className="w-6 h-6 text-[#00A86B]" />
          <h2 className="text-[#212121] font-black text-xl md:text-2xl">
            {getTranslation("registerBusiness", lang)}
          </h2>
        </div>
        
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
          {lang === "en" 
            ? "Unlock business status on DinaMarket Pakistan with 0 listing charges. Direct-to-wallet P2P checkout guarantees zero holddowns on your startup capitals." 
            : "دینا مارکیٹ پر اپنا مفت دکان اکاؤنٹ قائم کریں۔ ایزی پیسہ اور جاز کیش کے ذریعے براہ راست ادائیگی حاصل کریں۔"}
        </p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                {getTranslation("businessName", lang)}
              </label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Peshawar Footwear Craft"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0056B3]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                {getTranslation("whatsappNumber", lang)}
              </label>
              <input
                type="text"
                required
                value={regWhats}
                onChange={(e) => setRegWhats(e.target.value)}
                placeholder="e.g. 03009876543"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0056B3]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              {getTranslation("businessBio", lang)}
            </label>
            <textarea
              required
              value={regBio}
              onChange={(e) => setRegBio(e.target.value)}
              placeholder="e.g. Traditional leather shoes and chappals made with double rubber tire sole."
              className="w-full p-2.5 min-h-[70px] bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0056B3] resize-none"
            />
          </div>

          <ImageUploader
            label={getTranslation("storeLogoUrl", lang)}
            value={regLogo}
            onChange={(url) => setRegLogo(url)}
            lang={lang}
            placeholderText={lang === "en" ? "Upload Store Logo (Max 16MB)" : "سٹوریج کا لوگو اپ لوڈ کریں (حد 16MB)"}
          />

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              {getTranslation("address", lang)}
            </label>
            <input
              type="text"
              required
              value={regAddress}
              onChange={(e) => setRegAddress(e.target.value)}
              placeholder="e.g. Shop 21, Qissa Khwani Bazaar, Peshawar"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0056B3]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#00A86B] hover:bg-[#008F5A] text-white font-extrabold rounded-lg tracking-wide uppercase cursor-pointer"
          >
            {getTranslation("submitRegistration", lang)}
          </button>
        </form>
      </div>
    );
  }

  const pendingOrders = myOrders.filter(o => o.status === "Pending Verification");
  const confirmedOrders = myOrders.filter(o => o.status === "Confirmed");
  const completedOrders = myOrders.filter(o => o.status === "Completed");

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 md:p-8 shadow-xs flex flex-col gap-6">
      
      {/* Seller Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <img 
            src={sellerProfile.logoUrl} 
            className="w-14 h-14 object-cover rounded-xl border bg-white shadow-xs shrink-0" 
            referrerPolicy="no-referrer"
          />
          <div>
            <h2 className="text-[#212121] font-black text-xl shrink-0 flex items-center gap-2">
              <Store className="w-5 h-5 text-[#00A86B]" />
              {sellerProfile.businessName}
            </h2>
            <p className="text-slate-500 text-xs italic line-clamp-1 max-w-sm">
              {sellerProfile.bio}
            </p>
          </div>
        </div>

        {/* Workspace controls */}
        <div className="flex bg-white rounded-lg border border-slate-200 p-1 font-semibold shrink-0">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-4 py-2 rounded-md text-xs cursor-pointer flex items-center gap-1.5 transition-colors ${
              activeTab === "inventory" ? "bg-[#00A86B] text-white" : "text-slate-600 hover:text-[#00A86B]"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            {lang === "en" ? "Manage Stock" : "اسٹاک کا انتظام"}
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 rounded-md text-xs cursor-pointer flex items-center gap-1.5 transition-colors ${
              activeTab === "orders" ? "bg-[#00A86B] text-white" : "text-slate-600 hover:text-[#00A86B]"
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            {lang === "en" ? "Customer Orders" : "گاہک کے آرڈر"}
            {pendingOrders.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 block animate-ping shrink-0" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 rounded-md text-xs cursor-pointer flex items-center gap-1.5 transition-colors ${
              activeTab === "settings" ? "bg-[#00A86B] text-white" : "text-slate-600 hover:text-[#00A86B]"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            {lang === "en" ? "My Hub" : "پروفائل معلومات"}
          </button>
        </div>
      </div>

      {activeTab === "inventory" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Inventory form pane (Column 1) */}
          <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="font-extrabold text-slate-800 text-base mb-4 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#00A86B]" />
              {isEditMode ? (lang === "en" ? "Edit Catalog Item" : "مصنوعات کی تدوین کریں") : (lang === "en" ? "Launch New Product" : "نئی پروڈکٹ لانچ کریں")}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {getTranslation("productTitle", lang)}
                </label>
                <input
                  type="text"
                  required
                  value={pTitle}
                  onChange={(e) => setPTitle(e.target.value)}
                  placeholder="e.g. Super Silk Shalwar Kameez"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0056B3]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {getTranslation("productTitleUrdu", lang)}
                </label>
                <input
                  type="text"
                  value={pTitleUrdu}
                  onChange={(e) => setPTitleUrdu(e.target.value)}
                  placeholder="مثال: ریشمی شلوار قمیض"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0056B3]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {getTranslation("productDesc", lang)}
                </label>
                <textarea
                  required
                  value={pDesc}
                  onChange={(e) => setPDesc(e.target.value)}
                  placeholder="Product specs / details..."
                  className="w-full p-2 min-h-[60px] bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0056B3] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {getTranslation("productDescUrdu", lang)}
                </label>
                <textarea
                  value={pDescUrdu}
                  onChange={(e) => setPDescUrdu(e.target.value)}
                  placeholder="اردو میں تفصیل..."
                  className="w-full p-2 min-h-[60px] bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0056B3] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {getTranslation("basePrice", lang)}
                  </label>
                  <input
                    type="number"
                    required
                    value={pPrice}
                    onChange={(e) => setPPrice(e.target.value)}
                    placeholder="e.g. 2400"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0056B3]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {getTranslation("initialStock", lang)}
                  </label>
                  <input
                    type="number"
                    required
                    value={pStock}
                    onChange={(e) => setPStock(e.target.value)}
                    placeholder="e.g. 15"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0056B3]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {lang === "en" ? "Category Mapping" : "زمرہ بندی"}
                </label>
                <select
                  value={pCategory}
                  onChange={(e) => setPCategory(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0056B3] font-semibold"
                >
                  <option value="Clothes">Clothes</option>
                  <option value="Grocery">Grocery</option>
                  <option value="Fast Food">Fast Food</option>
                  <option value="Cosmetics">Cosmetics</option>
                  <option value="Sports">Sports</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Rent-a-Car">Rent-a-Car</option>
                </select>
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {lang === "en" ? "Product Images (Max 3 views)" : "مصنوعات کی تصاویر (زیادہ سے زیادہ 3 زاویے)"}
                </label>
                
                {/* Primary Image Upload Zone */}
                <ImageUploader
                  label={lang === "en" ? "Primary Image (Main Catalog View)" : "بنیادی تصویر (مین کیٹلاگ)"}
                  value={pImg1}
                  onChange={(url) => setPImg1(url)}
                  lang={lang}
                  placeholderText={lang === "en" ? "Upload primary product image (Max 16MB)" : "پروڈکٹ کی مین تصویر اپ لوڈ کریں (حد 16MB)"}
                />

                {/* Secondary Images Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ImageUploader
                    label={lang === "en" ? "Alternative View 1 (Optional)" : "متبادل تصویر 1 (اختیاری)"}
                    value={pImg2}
                    onChange={(url) => setPImg2(url)}
                    lang={lang}
                    placeholderText={lang === "en" ? "Side/detail view" : "دوسرا زاویہ یا تفصیل"}
                  />
                  <ImageUploader
                    label={lang === "en" ? "Alternative View 2 (Optional)" : "متبادل تصویر 2 (اختیاری)"}
                    value={pImg3}
                    onChange={(url) => setPImg3(url)}
                    lang={lang}
                    placeholderText={lang === "en" ? "Info/rear view" : "تیسرا زاویہ یا پیکنگ"}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {isEditMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditMode(false);
                      setSelectedProduct(null);
                      setPTitle("");
                      setPTitleUrdu("");
                      setPDesc("");
                      setPDescUrdu("");
                      setPPrice("");
                      setPStock("");
                      setPImg1("");
                      setPImg2("");
                      setPImg3("");
                    }}
                    className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    {lang === "en" ? "Cancel" : "منسوخ"}
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#00A86B] hover:bg-[#008F5A] text-white text-xs font-black rounded-lg uppercase tracking-wider shadow cursor-pointer transition-colors"
                >
                  {getTranslation("submitProduct", lang)}
                </button>
              </div>
            </form>
          </div>

          {/* Active inventory stock list (Column 2-3) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 flex flex-col justify-start">
            <h3 className="font-extrabold text-slate-800 text-base mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
              <ClipboardList className="w-4 h-4 text-slate-500" />
              {lang === "en" ? "Active Catalog Stock" : "موجودہ مصنوعات کی فروخت"} ({allProducts.length})
            </h3>

            {allProducts.length === 0 ? (
              <div className="text-center py-20 text-slate-400 text-sm">
                {lang === "en" ? "No products listed. Use form to create items." : "کوئی مصنوعات درج نہیں ہیں۔ دائیں فارم سے بنائیں۔"}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {allProducts.map((p) => (
                  <div key={p.id} className="p-3 border border-slate-100 hover:border-slate-200 rounded-lg flex items-center gap-4 bg-slate-50/50">
                    <img 
                      src={p.images?.[0]} 
                      className="w-16 h-16 object-cover rounded bg-white border shrink-0" 
                      referrerPolicy="no-referrer"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-slate-800 text-sm truncate leading-tight">
                        {lang === "en" ? p.title : (p.titleUrdu || p.title)}
                      </h4>
                      <div className="text-rose-600 text-xs font-semibold mt-1">Rs. {p.price.toLocaleString()}</div>
                      
                      {/* stock counter */}
                      <div className="flex justify-between items-center mt-1 text-[11px] text-slate-500 font-medium">
                        <span>{lang === "en" ? "Stock:" : "انوینٹری:"} {p.stock}</span>
                        <span>{lang === "en" ? "Orders:" : "آرڈر حجم:"} {p.monthly_orders || 0}</span>
                      </div>

                      {/* smart boosting details */}
                      <span className={`inline-block mt-2 text-[9px] font-black uppercase tracking-wider rounded-full px-2 py-0.5 ${
                        p.boost_score >= 100 ? "bg-blue-100 text-[#0056B3]" : "bg-slate-100 text-slate-500"
                      }`}>
                        {p.boost_score >= 100 ? getTranslation("boosted", lang) : getTranslation("normal", lang)}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        onClick={() => handleEditInit(p)}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-[#0056B3] hover:border-[#0056B3] cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {activeTab === "orders" && (
        <div className="space-y-6">
          
          {/* Section: Pending Verification */}
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="font-extrabold text-amber-600 text-base mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <CircleDot className="w-4 h-4 text-amber-500 animate-pulse" />
              {lang === "en" ? "Pending Verification Orders" : "تصدیق کے منتظر آرڈرز"} ({pendingOrders.length})
            </h3>

            {pendingOrders.length === 0 ? (
              <p className="text-slate-400 text-xs italic bg-slate-50 p-4 rounded text-center">
                {getTranslation("noOrders", lang)}
              </p>
            ) : (
              <div className="space-y-4">
                {pendingOrders.map((ord) => (
                  <div key={ord.id} className="p-4 border border-amber-100 bg-amber-50/10 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-800">Rs. {ord.totalAmount.toLocaleString()}</span>
                        <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">{ord.paymentMethod}</span>
                      </div>
                      
                      <div className="text-slate-500 text-xs text-justify">
                        <strong>{getTranslation("customerDetails", lang)}:</strong> {ord.buyerName} | {ord.buyerPhone} <br />
                        <strong>{lang === "en" ? "Delivery Destination:" : "پتہ ڈیلیوری:"}</strong> {ord.buyerLocation}
                      </div>

                      {/* Items details */}
                      <div className="pt-2 text-xs text-slate-400">
                        {ord.items.map((it, idx) => (
                          <div key={idx}>• {it.title} (x{it.quantity})</div>
                        ))}
                      </div>

                      <div className="pt-2">
                        <span className="text-xs bg-slate-100 px-2.5 py-1 rounded font-mono font-bold text-slate-700">
                          TID: {ord.tid}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleVerifyPendingTID(ord.id)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow cursor-pointer transition-transform hover:scale-102 self-end md:self-center"
                    >
                      <Check className="w-4 h-4" />
                      {getTranslation("confirmOrderButton", lang)}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Confirmed Orders & Dispatch Messages */}
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="font-extrabold text-[#0056B3] text-base mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Truck className="w-4 h-4 text-[#0056B3]" />
              {lang === "en" ? "Active Confirmed Orders" : "تصدیق شدہ چالو آرڈرز"} ({confirmedOrders.length})
            </h3>

            {confirmedOrders.length === 0 ? (
              <p className="text-slate-400 text-xs italic bg-slate-50 p-4 rounded text-center">
                {getTranslation("noOrders", lang)}
              </p>
            ) : (
              <div className="space-y-4">
                {confirmedOrders.map((ord) => (
                  <div key={ord.id} className="p-4 border border-slate-100 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1 text-sm">
                      <div className="font-extrabold text-slate-800">Total: Rs. {ord.totalAmount.toLocaleString()}</div>
                      <div className="text-slate-500 text-xs text-justify">
                        <strong>{getTranslation("customerDetails", lang)}:</strong> {ord.buyerName} ({ord.buyerPhone}) <br />
                        <strong>{lang === "en" ? "Address details:" : "پتہ معلومات:"}</strong> {ord.buyerLocation}
                      </div>

                      {/* Items */}
                      <div className="pt-1.5 text-xs text-slate-400">
                        {ord.items.map((it, idx) => (
                          <div key={idx}>- {it.title} (x{it.quantity})</div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => setAlertTargetOrder(ord)}
                      className="px-5 py-2.5 bg-[#00A86B] hover:bg-[#008F5A] text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow cursor-pointer transition-transform hover:scale-102 self-end md:self-center"
                    >
                      <BellRing className="w-4 h-4" />
                      {getTranslation("dispatchNotification", lang)}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Completed History */}
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="font-extrabold text-slate-700 text-base mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Check className="w-4 h-4 text-emerald-600" />
              {lang === "en" ? "Archived Completed Transactions" : "مکمل شدہ ٹرانزیکشن کی تاریخ"} ({completedOrders.length})
            </h3>

            {completedOrders.length === 0 ? (
              <p className="text-slate-400 text-xs italic bg-slate-50 p-4 rounded text-center">
                {getTranslation("noOrders", lang)}
              </p>
            ) : (
              <div className="space-y-3.5 max-h-[250px] overflow-y-auto">
                {completedOrders.map((ord) => (
                  <div key={ord.id} className="p-3 border border-slate-50 rounded-lg bg-slate-100/30 text-xs">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>{ord.buyerName} ({ord.buyerPhone})</span>
                      <span className="text-emerald-700 font-extrabold">Rs. {ord.totalAmount.toLocaleString()} - Settled</span>
                    </div>
                    {ord.deliveryAlert && (
                      <div className="mt-1.5 text-slate-500">
                        <strong>{lang === "en" ? "Alert Dispatched:" : "آئی الرٹ پیغام:"}</strong> {ord.deliveryAlert}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {activeTab === "settings" && (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h3 className="font-extrabold text-slate-800 text-base mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
            <Settings className="w-4 h-4 text-slate-500" />
            {lang === "en" ? "Update Profile Information" : "سٹور کی پروفائل تبدیل کریں"}
          </h3>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {getTranslation("businessName", lang)}
                </label>
                <input
                  type="text"
                  required
                  value={regName || sellerProfile?.businessName || ""}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0056B3]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {getTranslation("whatsappNumber", lang)}
                </label>
                <input
                  type="text"
                  required
                  value={regWhats || sellerProfile?.whatsappNumber || ""}
                  onChange={(e) => setRegWhats(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0056B3]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                {getTranslation("businessBio", lang)}
              </label>
              <textarea
                required
                value={regBio || sellerProfile?.bio || ""}
                onChange={(e) => setRegBio(e.target.value)}
                className="w-full p-2.5 min-h-[70px] bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0056B3] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <ImageUploader
                label={getTranslation("storeLogoUrl", lang)}
                value={regLogo}
                onChange={(url) => setRegLogo(url)}
                lang={lang}
                placeholderText={lang === "en" ? "Upload Store Logo (Max 16MB)" : "سٹوریج کا لوگو اپ لوڈ کریں (حد 16MB)"}
              />
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {getTranslation("address", lang)}
                </label>
                <input
                  type="text"
                  required
                  value={regAddress || sellerProfile?.address || ""}
                  onChange={(e) => setRegAddress(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0056B3]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-[#00A86B] hover:bg-[#008F5A] text-white font-extrabold rounded-lg tracking-wide uppercase cursor-pointer text-xs"
            >
              {lang === "en" ? "Save Store Setup" : "ترتیبات محفوظ کریں"}
            </button>
          </form>
        </div>
      )}

      {/* Pop up overlay for delivery alert messaging */}
      {alertTargetOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in-90 zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="font-extrabold text-slate-800 text-sm">
                {lang === "en" ? "Input Delivery Dispatch Notice" : "ڈیلیوری کا تفصیلی میسج لکھیں"}
              </span>
              <button 
                onClick={() => setAlertTargetOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCompleteDispatchAlert} className="p-5 space-y-4">
              <p className="text-slate-500 text-xs leading-relaxed text-justify">
                {lang === "en" 
                  ? "Writing the dispatch notice successfully triggers order completion. The notification is immediately written to the buyer's live notifications inbox." 
                  : "یہاں پیغام درج کرتے ہی یہ آرڈر مکمل ہو جائے گا اور پیغام فوری طور پر خریدار کے موبائل اسکرین پر الرٹ بن کر دکھے گا۔"}
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  {lang === "en" ? "Delivery/Carrier Alert Message" : "رائڈر یا ڈیلیوری کی معلومات (پیغام)"}
                </label>
                <textarea
                  required
                  rows={3}
                  value={deliveryAlertMsg}
                  onChange={(e) => setDeliveryAlertMsg(e.target.value)}
                  placeholder="e.g. Your Peshawari sandals are dispatched via Leopard Courier. Tracking ID is LPD-9238127. Standard transit is 24 hours."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#0056B3]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#00A86B] hover:bg-[#008F5A] text-white font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 rounded-lg shadow cursor-pointer transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                {lang === "en" ? "Dispatch & Notify Buyer" : "محفوظ کریں اور پیغام بھیجیں"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

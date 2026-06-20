import React, { useState, useEffect } from "react";
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  Wallet, 
  MapPin, 
  User, 
  Phone, 
  CheckCircle, 
  ArrowRight, 
  ShieldCheck, 
  HelpCircle 
} from "lucide-react";
import { CartItem, Seller, Order } from "../types";
import { auth, rtdb } from "../firebase";
import { ref, push, set, get, child } from "firebase/database";
import { Language, getTranslation } from "../dictionary";

interface CheckoutModalProps {
  cartItems: CartItem[];
  onUpdateQty: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClose: () => void;
  onClearCart: () => void;
  lang: Language;
  onTriggerAuth: () => void;
}

export default function CheckoutModal({
  cartItems,
  onUpdateQty,
  onRemoveItem,
  onClose,
  onClearCart,
  lang,
  onTriggerAuth
}: CheckoutModalProps) {
  const [step, setStep] = useState<"cart" | "details" | "payment" | "success">("cart");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerLocation, setBuyerLocation] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"EasyPaisa" | "JazzCash">("EasyPaisa");
  const [tid, setTid] = useState("");
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [sellersInfo, setSellersInfo] = useState<Record<string, Seller>>({});
  const [tidError, setTidError] = useState("");

  const subtotal = cartItems.reduce((acc, curr) => acc + curr.product.price * curr.quantity, 0);

  // Fetch all seller details to display wallet information
  useEffect(() => {
    const sellersRef = ref(rtdb, "sellers");
    get(sellersRef).then((snapshot) => {
      if (snapshot.exists()) {
        setSellersInfo(snapshot.val());
      }
    });
  }, []);

  const handleProceedToDetails = () => {
    if (!auth.currentUser) {
      onTriggerAuth();
      return;
    }
    setStep("details");
  };

  const handleProceedToPayment = () => {
    if (!buyerName.trim() || !buyerPhone.trim() || !buyerLocation.trim()) {
      return;
    }
    setStep("payment");
  };

  const handleVerifyAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTidError("");

    // Validate 12-digit transaction ID TID according to Pakistan wallet specifications
    const cleanTID = tid.trim().replace(/[^0-9]/g, "");
    if (cleanTID.length !== 12) {
      setTidError(getTranslation("illegalAlert", lang));
      return;
    }

    setIsSubmitLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No authenticated user session.");

      // Split cart items by sellerId and generate separated peer-to-peer orders
      const itemsBySeller: Record<string, typeof cartItems> = {};
      cartItems.forEach(item => {
        const sid = item.product.sellerId;
        if (!itemsBySeller[sid]) itemsBySeller[sid] = [];
        itemsBySeller[sid].push(item);
      });

      // Submit each order node
      for (const [sellerId, items] of Object.entries(itemsBySeller)) {
        const orderRef = push(ref(rtdb, "orders"));
        const orderTotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
        
        const newOrder: Order = {
          id: orderRef.key || Math.random().toString(),
          buyerId: currentUser.uid,
          buyerName,
          buyerPhone,
          buyerLocation,
          sellerId,
          items: items.map(i => ({
            productId: i.product.id,
            title: i.product.title,
            price: i.product.price,
            quantity: i.quantity
          })),
          totalAmount: orderTotal,
          paymentMethod,
          tid: cleanTID,
          status: "Pending Verification",
          createdAt: Date.now()
        };

        // Write order node
        await set(orderRef, newOrder);

        // Adjust/Decrement product_count stock dynamically
        for (const item of items) {
          const productRef = ref(rtdb, `products/${item.product.id}`);
          const currentStock = item.product.stock;
          const newStock = Math.max(0, currentStock - item.quantity);
          const currentOrders = item.product.monthly_orders || 0;
          const newOrders = currentOrders + item.quantity;
          
          // Smart Boosting algorithm logic:
          // Once the seller's product has 5-10 successful orders, normalize boost score down to 1 automatically.
          const currentBoost = item.product.boost_score || 100;
          const newBoost = newOrders >= 5 ? 1 : currentBoost;

          await set(productRef, {
            ...item.product,
            stock: newStock,
            monthly_orders: newOrders,
            boost_score: newBoost,
            totalBuyers: (item.product.totalBuyers || 0) + 1
          });
        }
      }

      setStep("success");
    } catch (error) {
      console.error("Error committing checkout order: ", error);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // Get primary seller involved in this cart context to show payment detail guidelines
  const primarySellerId = cartItems[0]?.product.sellerId;
  const activeSeller = sellersInfo[primarySellerId];

  // Fallback payment info mapping dynamically
  const sellerWalletNumber = activeSeller?.whatsappNumber || "03009876543";
  const sellerWalletName = activeSeller?.businessName || "Original Craft Merchant";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col justify-between max-h-[90vh]">
        
        {/* Title Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#00A86B]" />
            <h3 className="font-extrabold text-slate-800 text-lg">
              {step === "cart" && getTranslation("cartTitle", lang)}
              {step === "details" && (lang === "en" ? "Delivery Coordinates" : "ڈیلیوری کے پتے")}
              {step === "payment" && (lang === "en" ? "Direct Wallet Payment Verification" : "براہ راست موبائل والٹ ادائیگی")}
              {step === "success" && (lang === "en" ? "Order Confirmed!" : "آرڈر مل گیا!")}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic content panes */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {step === "cart" && (
            <div>
              {cartItems.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-400 mb-6 text-sm">
                    {getTranslation("cartEmpty", lang)}
                  </p>
                  <button 
                    onClick={onClose}
                    className="px-6 py-2.5 bg-[#0056B3] hover:bg-[#004085] text-white font-bold rounded-xl cursor-pointer shadow-sm transition-transform hover:scale-102"
                  >
                    {lang === "en" ? "Start Browsing" : "شاپنگ شروع کریں"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div 
                      key={item.product.id} 
                      className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-slate-200"
                    >
                      <img 
                        src={item.product.images?.[0]} 
                        className="w-16 h-16 object-cover rounded-lg bg-slate-50 border shrink-0" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 text-sm line-clamp-1">
                          {lang === "en" ? item.product.title : (item.product.titleUrdu || item.product.title)}
                        </h4>
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                          {item.product.category}
                        </span>
                        <div className="text-[#00A86B] font-bold text-sm mt-1">
                          Rs. {item.product.price.toLocaleString()} x {item.quantity}
                        </div>
                      </div>

                      {/* Quantity tools */}
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50 mr-2 shrink-0">
                        <button
                          onClick={() => onUpdateQty(item.product.id, -1)}
                          disabled={item.quantity <= 1}
                          className="p-1 px-2.5 hover:bg-slate-200 text-slate-600 disabled:opacity-30 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-black text-slate-700 min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQty(item.product.id, 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="p-1 px-2.5 hover:bg-slate-200 text-slate-600 disabled:opacity-30 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="text-slate-400 hover:text-rose-600 p-2 rounded-full hover:bg-slate-50 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {/* Pricing Overview summary card */}
                  <div className="mt-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200">
                      <span className="text-sm text-slate-500 font-semibold">{lang === "en" ? "Subtotal" : "ذیلی رقم"}</span>
                      <span className="text-sm font-bold text-slate-700">Rs. {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200">
                      <span className="text-sm text-slate-500 font-semibold">{lang === "en" ? "Logistics Delivery" : "ڈیلیوری فیس"}</span>
                      <span className="text-xs text-slate-500 italic">{lang === "en" ? "Self/Merchant Handled" : "خود کار / دکاندار ذمہ دار"}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3">
                      <span className="text-base text-slate-800 font-extrabold">{getTranslation("total", lang)}</span>
                      <span className="text-xl font-black text-rose-600">Rs. {subtotal.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Non-custodial legal notice */}
                  <div className="p-3 bg-[#E8F5E9] border-l-4 border-[#00A86B] rounded text-[11px] text-[#212121] leading-relaxed select-none text-justify mt-4">
                    <ShieldCheck className="w-4 h-4 text-[#00A86B] inline mr-1" />
                    <strong>{getTranslation("p2pNoticeTitle", lang)}:</strong> {getTranslation("deliveryLogistics", lang)}
                  </div>

                  {/* Proceed trigger */}
                  <button
                    id="checkout-proceed-btn"
                    onClick={handleProceedToDetails}
                    className="w-full mt-6 py-3.5 bg-[#00A86B] hover:bg-[#008F5A] text-white font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-100 cursor-pointer transition-all hover:scale-101"
                  >
                    {getTranslation("checkoutButton", lang)}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {step === "details" && (
            <div className="space-y-5">
              <div className="p-3 bg-amber-50 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="margin-0 leading-relaxed text-justify">
                  {lang === "en" 
                    ? "Ensure you provide a valid mobile number for WhatsApp coordination. Regional merchant staff will connect to arrange delivery."
                    : "واٹس ایپ سے مربوط ہونے کے لیے ایک درست موبائل نمبر فراہم کریں۔ علاقائی مہر والا عملہ ادائیگی کی تصدیق کے لیے رابطہ کرے گا۔"}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    {lang === "en" ? "Full Name" : "پورا نام"}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="e.g. Muhammad Ali"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0056B3]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    {lang === "en" ? "Contact Mobile Number" : "موبائل نمبر"}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      placeholder="e.g. 03001234567"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0056B3]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    {lang === "en" ? "Exact Delivery / Pickup Address" : "ڈیلیوری یا پک اپ کا پتہ"}
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                    <textarea
                      required
                      value={buyerLocation}
                      onChange={(e) => setBuyerLocation(e.target.value)}
                      placeholder="e.g. House No. 23, Block C, Phase 1, DHA Islamabad"
                      className="w-full pl-10 pr-4 py-3 min-h-[80px] border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0056B3] resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Navigation button toggles */}
              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep("cart")}
                  className="px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-lg cursor-pointer transition-colors"
                >
                  {lang === "en" ? "Back to Cart" : "کارٹ پر جائیں"}
                </button>
                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  disabled={!buyerName.trim() || !buyerPhone.trim() || !buyerLocation.trim()}
                  className="flex-1 py-3 bg-[#00A86B] hover:bg-[#008F5A] text-white font-extrabold rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {lang === "en" ? "Select Wallet Payment" : "ادائیگی والٹ منتخب کریں"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === "payment" && (
            <div className="space-y-6">
              {/* Wallet select box */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("EasyPaisa")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all text-center flex flex-col items-center gap-2 ${
                    paymentMethod === "EasyPaisa"
                      ? "border-[#00A86B] bg-emerald-50/50"
                      : "border-slate-200 hover:border-[#00A86B]/50"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00A86B] block"></span>
                  <span className="font-extrabold text-[#212121] text-sm">EasyPaisa P2P</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("JazzCash")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all text-center flex flex-col items-center gap-2 ${
                    paymentMethod === "JazzCash"
                      ? "border-red-600 bg-red-50/20"
                      : "border-slate-200 hover:border-red-500/50"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 block"></span>
                  <span className="font-extrabold text-[#212121] text-sm">JazzCash P2P</span>
                </button>
              </div>

              {/* Display dynamic merchant details */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#0056B3]">
                  {lang === "en" ? "MERCHANT WALLET DETAILS" : "بیچنے والے کے اکاؤنٹ کی تفصیل"}
                </h4>
                <div className="grid grid-cols-1 gap-1">
                  <div className="flex justify-between items-center text-sm py-1 border-b border-dashed border-slate-200">
                    <span className="text-slate-500 font-semibold">{lang === "en" ? "Wallet Service" : "والٹ سروس"}</span>
                    <span className="font-black text-[#212121]">{paymentMethod}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm py-1 border-b border-dashed border-slate-200">
                    <span className="text-slate-500 font-semibold">{getTranslation("accountNumber", lang)}</span>
                    <span className="font-mono font-black text-[#00A86B] text-base">{sellerWalletNumber}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm py-1 border-b border-dashed border-slate-200">
                    <span className="text-slate-500 font-semibold">{getTranslation("accountName", lang)}</span>
                    <span className="font-bold text-[#212121]">{sellerWalletName}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2">
                    <span className="text-slate-500 font-semibold">{lang === "en" ? "Exact Amount to Transfer" : "ٹرانسفر کرنے کی رقم"}</span>
                    <span className="font-black text-rose-600 text-lg">Rs. {subtotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Instructions on P2P TID validation */}
              <form onSubmit={handleVerifyAndSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                    {lang === "en" ? "Enter your 12-Digit Transaction ID (TID)" : "12 ہندسوں کا ٹرانزیکشن آئی ڈی (TID) کوڈ درج کریں"}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    value={tid}
                    onChange={(e) => setTid(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="e.g. 102435428906"
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg font-mono text-center text-lg focus:outline-none focus:border-[#0056B3] tracking-widest font-extrabold"
                  />
                  {tidError && (
                    <p className="text-rose-600 text-xs mt-1.5 font-semibold text-center select-none">
                      {tidError}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed text-center">
                    {lang === "en" 
                      ? "A TID is generated by EasyPaisa/JazzCash upon successful transfer. We verify TID codes against real merchant receipts with 0 tolerances for fraud."
                      : "آرڈر مکمل کرنے کے لیے ایزی پیسہ یا جاز کیش رسید دیکھ کر 12 ہندسوں کا کوڈ درج کریں۔ غلط کوڈ منسوخ کر دیا جائے گا۔"}
                  </p>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setStep("details")}
                    className="px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    {lang === "en" ? "Back" : "پیچھے"}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitLoading || tid.length !== 12}
                    className="flex-1 py-3 bg-[#00A86B] hover:bg-[#008F5A] text-white font-extrabold rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitLoading ? (
                      <span>{lang === "en" ? "Logging order..." : "آرڈر درج ہو رہا ہے..."}</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5" />
                        <span>{getTranslation("confirmPayment", lang)}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === "success" && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-[#00A86B]">
                <CheckCircle className="w-12 h-12 stroke-[2.5]" />
              </div>
              <h3 className="font-extrabold text-[#212121] text-xl">
                {getTranslation("successReceipt", lang)}
              </h3>
              <p className="text-slate-600 text-sm max-w-sm mx-auto leading-relaxed">
                {getTranslation("orderConfirmedMessage", lang)}
              </p>
              
              <div className="bg-slate-50 p-4 rounded-xl border text-left text-xs max-w-md mx-auto space-y-1.5 font-mono text-slate-600">
                <div><strong>{lang === "en" ? "CUSTOMER:" : "خریدار:"}</strong> {buyerName}</div>
                <div><strong>{lang === "en" ? "PHONE:" : "فون نمبر:"}</strong> {buyerPhone}</div>
                <div><strong>{lang === "en" ? "P2P WALLET:" : "موبائل والٹ:"}</strong> {paymentMethod}</div>
                <div><strong>{lang === "en" ? "TID CONFIRMATION:" : "تصدیق نمبر:"}</strong> {tid}</div>
                <div><strong>{lang === "en" ? "STATUS:" : "حالت:"}</strong> Pending Merchant Verification</div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    onClearCart();
                    onClose();
                  }}
                  className="px-8 py-3 bg-[#00A86B] hover:bg-[#008F5A] text-white font-bold rounded-xl cursor-pointer shadow-sm transition-transform hover:scale-102"
                >
                  {lang === "en" ? "Return to Market" : "ہوم سکرین پر جائیں"}
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

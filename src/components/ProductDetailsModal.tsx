import React, { useState, useEffect } from "react";
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  CheckCircle, 
  Send, 
  MessageSquare, 
  Package, 
  Zap, 
  Calendar 
} from "lucide-react";
import { Product, Review } from "../types";
import { auth, rtdb } from "../firebase";
import { ref, push, onValue, set } from "firebase/database";
import { Language, getTranslation } from "../dictionary";

interface ProductDetailsModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  lang: Language;
  onTriggerAuth: () => void;
}

export default function ProductDetailsModal({ 
  product, 
  onClose, 
  onAddToCart, 
  lang,
  onTriggerAuth 
}: ProductDetailsModalProps) {
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  const images = product.images && product.images.length > 0 
    ? product.images 
    : ["https://images.unsplash.com/photo-1542838132-92c53300491e"];

  // Fetch reviews for this product from Realtime Database
  useEffect(() => {
    const reviewsRef = ref(rtdb, "reviews");
    const unsubscribe = onValue(reviewsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const productReviews = Object.values(data) as Review[];
        const filtered = productReviews.filter(r => r.productId === product.id);
        // Sort newest first
        filtered.sort((a, b) => b.timestamp - a.timestamp);
        setReviews(filtered);
      } else {
        setReviews([]);
      }
    });

    return () => unsubscribe();
  }, [product.id]);

  const handleNextImage = () => {
    setCurrentImageIdx((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      onTriggerAuth();
      return;
    }

    if (!newComment.trim()) return;

    setIsSubmitLoading(true);
    try {
      const reviewsRef = ref(rtdb, "reviews");
      const newReviewRef = push(reviewsRef);
      const newReview: Review = {
        id: newReviewRef.key || Math.random().toString(),
        productId: product.id,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email?.split("@")[0] || "Verified Pakistani Buyer",
        rating: newRating,
        comment: newComment,
        timestamp: Date.now(),
        verifiedPurchaser: true // Default verified badge for active account reviews
      };

      await set(newReviewRef, newReview);
      setNewComment("");
      setNewRating(5);

      // Recalculate average rating of product and increment review count in RTDB
      const dbProductRef = ref(rtdb, `products/${product.id}`);
      const updatedReviewCount = (product.reviewCount || 0) + 1;
      const updatedRating = Number((((product.rating || 5) * (product.reviewCount || 0) + newRating) / updatedReviewCount).toFixed(1));
      
      await set(dbProductRef, {
        ...product,
        reviewCount: updatedReviewCount,
        rating: updatedRating
      });

    } catch (error) {
      console.error("Error submitting review: ", error);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock <= 0;

  // Star breakdown math
  const getRatingDistribution = (star: number) => {
    if (reviews.length === 0) return 0;
    const count = reviews.filter(r => Math.round(r.rating) === star).length;
    return (count / reviews.length) * 100;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200 my-8">
        
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-5 bg-[#00A86B] rounded-full"></span>
            <h3 className="font-bold text-slate-800 text-lg">
              {lang === "en" ? "Product Details" : "پروڈکٹ کی معلومات"}
            </h3>
          </div>
          <button 
            id="close-modal-btn" 
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal content body */}
        <div className="grid grid-cols-1 md:grid-cols-2 overflow-y-auto max-h-[80vh]">
          
          {/* Column 1: Custom Slider Carousel */}
          <div className="p-6 border-r border-slate-100 flex flex-col justify-start">
            <div id="product-details-carousel" className="relative w-full aspect-square bg-slate-50 rounded-xl overflow-hidden border border-slate-100 group">
              <img
                src={images[currentImageIdx]}
                alt={`Image ${currentImageIdx + 1}`}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              
              {images.length > 1 && (
                <>
                  <button
                    id="carousel-btn-prev"
                    onClick={handlePrevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-slate-800 shadow cursor-pointer transition-transform hover:scale-105"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    id="carousel-btn-next"
                    onClick={handleNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-slate-800 shadow cursor-pointer transition-transform hover:scale-105"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Index indicators */}
              <div className="absolute bottom-3 right-3 px-3 py-1 bg-black/60 text-white rounded-full text-xs font-mono">
                {currentImageIdx + 1} / {images.length}
              </div>
            </div>

            {/* Thumbnail selector bar */}
            {images.length > 1 && (
              <div className="flex gap-2.5 mt-3 overflow-x-auto py-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImageIdx(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer ${
                      i === currentImageIdx ? "border-[#00A86B]" : "border-transparent opacity-60"
                    }`}
                  >
                    <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}

            {/* In-Stock Indicator */}
            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-slate-500" />
                <span className="text-sm font-bold text-slate-700">
                  {lang === "en" ? "Availability Count:" : "دستیابی کی تعداد:"}
                </span>
                {isOutOfStock ? (
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                    {getTranslation("outOfStock", lang)}
                  </span>
                ) : (
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                    {getTranslation("inStock", lang)}
                  </span>
                )}
              </div>

              {isLowStock && (
                <div className="flex items-center gap-1.5 text-rose-500 max-w-xs text-right">
                  <Zap className="w-4 h-4 animate-bounce shrink-0" />
                  <span className="text-xs font-black">
                    {getTranslation("onlyLeft", lang, { stock: product.stock })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Text Blocks & Reviews */}
          <div className="p-6 flex flex-col justify-between h-full bg-white">
            <div>
              {/* Category */}
              <span className="text-xs uppercase tracking-wider text-[#0056B3] font-bold">
                {product.category}
              </span>
              
              <h2 className="text-[#212121] font-black text-2xl mt-1 mb-2 leading-tight">
                {lang === "en" ? product.title : (product.titleUrdu || product.title)}
              </h2>

              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-1 text-rose-600 font-extrabold text-2xl">
                  <span className="text-sm font-normal text-slate-600">Rs.</span>
                  {product.price.toLocaleString()}
                </div>
                
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded text-amber-600 font-bold text-sm">
                  <Star className="w-4 h-4 fill-amber-500 stroke-amber-500" />
                  {product.rating ? product.rating.toFixed(1) : "5.0"}
                </div>
              </div>

              {/* Full description */}
              <div className="mb-6">
                <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                  {lang === "en" ? "Product Overview" : "پروڈکٹ کی تفصیل"}
                </h4>
                <p className="text-slate-600 text-sm leading-relaxed text-justify whitespace-pre-line">
                  {lang === "en" ? product.description : (product.descriptionUrdu || product.description)}
                </p>
              </div>

              {/* Reviews distribution Panel */}
              <div className="mb-6 pb-6 border-b border-slate-100">
                <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                  {getTranslation("ratings", lang)}
                </h4>
                
                {/* Visual Bars */}
                <div className="space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <div key={star} className="flex items-center gap-2.5 text-xs text-slate-600">
                      <span className="min-w-[45px] hover:underline flex items-center justify-end font-bold text-[#212121]">
                        {star} {lang === "en" ? "stars" : "اسٹار"}
                      </span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-400 rounded-full" 
                          style={{ width: `${getRatingDistribution(star)}%` }}
                        ></div>
                      </div>
                      <span className="text-slate-400 min-w-[30px] text-right font-mono">
                        {getRatingDistribution(star).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chronological review list */}
              <div className="mb-6">
                <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {getTranslation("reviewsTitle", lang)} ({reviews.length})
                </h4>

                {reviews.length === 0 ? (
                  <p className="text-slate-400 text-xs italic bg-slate-50 p-4 rounded-xl text-center">
                    {getTranslation("noReviews", lang)}
                  </p>
                ) : (
                  <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-[#212121]">
                              {rev.userName}
                            </span>
                            {rev.verifiedPurchaser && (
                              <span className="flex items-center gap-0.5 text-[9px] text-[#00A86B] font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full uppercase shrink-0">
                                <CheckCircle className="w-2.5 h-2.5 fill-[#00A86B] text-white" />
                                {lang === "en" ? "Verified" : "تصدیق شدہ"}
                              </span>
                            )}
                          </div>
                          
                          {/* Stars */}
                          <div className="flex gap-0.5 text-amber-500">
                            {Array.from({ length: 5 }).map((_, s) => (
                              <Star 
                                key={s} 
                                className={`w-3 h-3 ${s < rev.rating ? "fill-amber-500 stroke-amber-500" : "text-slate-200"}`} 
                              />
                            ))}
                          </div>
                        </div>

                        <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-line text-left">
                          {rev.comment}
                        </p>
                        
                        <span className="text-[9px] text-slate-400 font-mono text-left">
                          <Calendar className="w-2.5 h-2.5 inline mr-1" />
                          {new Date(rev.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add review form - auth enforced */}
              <div className="mt-4 p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/30">
                <h5 className="text-[#212121] text-xs font-bold mb-3">
                  {lang === "en" ? "Are you a owner/buyer? Post rating:" : "اپنی رائے دیں:"}
                </h5>
                <form onSubmit={handlePostReview} className="flex flex-col gap-3">
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-600">
                      {getTranslation("ratingStars", lang)}:
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          className="text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star className={`w-6 h-6 ${star <= newRating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={
                        auth.currentUser 
                          ? (lang === "en" ? "Write honest review..." : "تبصرہ یہاں لکھیں...") 
                          : getTranslation("unauthorizedReview", lang)
                      }
                      disabled={isSubmitLoading}
                      required
                      className="flex-1 min-h-[60px] p-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0056B3] resize-none"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitLoading}
                      className="px-4 bg-[#00A86B] hover:bg-[#008F5A] text-white rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>

            </div>

            {/* Bottom Add-To-Cart bar */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest leading-none">
                  {lang === "en" ? "PRICE TOTAL" : "کل رقم"}
                </span>
                <span className="text-xl font-black text-rose-600 leading-tight">
                  Rs. {product.price.toLocaleString()}
                </span>
              </div>

              <button
                id="modal-add-to-cart-action-btn"
                onClick={() => {
                  onAddToCart(product);
                  onClose();
                }}
                disabled={isOutOfStock}
                className={`flex-1 py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isOutOfStock 
                    ? "bg-slate-100 text-slate-300 cursor-not-allowed" 
                    : "bg-[#00A86B] hover:bg-[#008F5A] text-white shadow-md shadow-emerald-100"
                }`}
              >
                <Package className="w-5 h-5" />
                {isOutOfStock ? getTranslation("outOfStock", lang) : getTranslation("addCart", lang)}
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

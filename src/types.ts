export interface Product {
  id: string;
  sellerId: string;
  sellerWhatsapp?: string;
  title: string;
  titleUrdu?: string;
  description: string;
  descriptionUrdu?: string;
  price: number;
  stock: number; // product_count in database reference
  category: string;
  images: string[];
  monthly_orders: number;
  boost_score: number;
  rating: number;
  reviewCount: number;
  totalBuyers: number;
}

export interface Seller {
  uid: string;
  businessName: string;
  bio: string;
  logoUrl: string;
  address: string;
  email: string;
  whatsappNumber: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  timestamp: number;
  verifiedPurchaser: boolean;
}

export interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  buyerLocation: string;
  sellerId: string;
  items: {
    productId: string;
    title: string;
    price: number;
    quantity: number;
  }[];
  totalAmount: number;
  paymentMethod: "EasyPaisa" | "JazzCash";
  tid: string;
  status: "Pending Verification" | "Confirmed" | "Completed";
  createdAt: number;
  deliveryAlert?: string;
}

export interface UserNotification {
  id: string;
  userId: string;
  message: string;
  timestamp: number;
  read: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

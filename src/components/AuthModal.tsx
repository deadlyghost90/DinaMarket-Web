import React, { useState } from "react";
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Chrome, 
  ShieldCheck, 
  ArrowRight, 
  Settings, 
  Store 
} from "lucide-react";
import { auth } from "../firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  updateProfile 
} from "firebase/auth";
import { Language, getTranslation } from "../dictionary";

interface AuthModalProps {
  onClose: () => void;
  lang: Language;
}

export default function AuthModal({ onClose, lang }: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsLoading(true);

    try {
      if (isRegister) {
        // Enforce register
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(res.user, {
          displayName: fullName || email.split("@")[0]
        });
      } else {
        // Enforce login
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      console.error("Auth transaction failed: ", err);
      // Human-friendly translations for common errors
      if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        setAuthError(lang === "en" ? "Incorrect email or password coordinates." : "غلط ای میل یا پاس ورڈ درج کیا گیا ہے۔");
      } else if (err.code === "auth/email-already-in-use") {
        setAuthError(lang === "en" ? "Email is already registered. Please log in." : "یہ ای میل پہلے سے رجسٹرڈ ہے۔ براہ کرم لاگ ان کریں۔");
      } else if (err.code === "auth/weak-password") {
        setAuthError(lang === "en" ? "Password coordinates must be at least 6 characters." : "پاس ورڈ کم از کم 6 ہندسوں کا ہونا ضروری ہے۔");
      } else {
        setAuthError(err.message || "An authentication error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setAuthError("");
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onClose();
    } catch (err: any) {
      console.error("Google Auth popup failed: ", err);
      setAuthError(err.message || "Google Authentication popup was interrupted.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in-90 zoom-in-95 duration-150">
        
        {/* Banner with logo */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-[#00A86B]" />
            <h3 className="font-extrabold text-slate-800 text-base">
              {getTranslation("mandatoryLogin", lang)}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Panel */}
        <div className="p-6 space-y-6">
          <p className="text-slate-500 text-xs leading-relaxed text-justify">
            {getTranslation("loginDesc", lang)}
          </p>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {lang === "en" ? "Full Name" : "پورا نام"}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Faisal Shah"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0056B3]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                {lang === "en" ? "Email Coordinate" : "ای میل پتہ"}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0056B3]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                {lang === "en" ? "Password" : "پاس ورڈ"}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="******"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0056B3]"
                />
              </div>
            </div>

            {authError && (
              <p className="text-rose-600 text-xs font-semibold select-none leading-relaxed text-center">
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-[#00A86B] hover:bg-[#008F5A] text-white font-extrabold rounded-lg text-sm flex items-center justify-center gap-1.5 shadow cursor-pointer transition-colors"
            >
              <span>{isLoading ? "Authenticating..." : (isRegister ? "Launch Account" : "Access Store") }</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Social login divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-150"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-xs uppercase tracking-wider font-semibold">
              {lang === "en" ? "or" : "یا"}
            </span>
            <div className="flex-grow border-t border-slate-150"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-250 font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-transform hover:scale-101"
          >
            <Chrome className="w-4 h-4 text-red-500" />
            <span>{lang === "en" ? "Sign In with Google Account" : "گوگل اکاؤنٹ سے لاگ ان کریں"}</span>
          </button>

          <p className="text-center text-xs text-slate-500 mt-4 leading-relaxed">
            {isRegister ? (lang === "en" ? "Already have a marketplace node?" : "پہلے سے اکاؤنٹ ہے؟") : (lang === "en" ? "New entrepreneur startup?" : "نیا اکاؤنٹ بنانا چاہتے ہیں؟")}{" "}
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-[#0056B3] font-bold hover:underline focus:outline-none cursor-pointer"
            >
              {isRegister ? (lang === "en" ? "Sign In" : "لاگ ان کریں") : (lang === "en" ? "Register Free" : "رجسٹر کریں")}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}

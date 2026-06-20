import React, { useState, useRef } from "react";
import { UploadCloud, X, RefreshCw, AlertCircle, ImageIcon } from "lucide-react";
import { Language } from "../dictionary";

interface ImageUploaderProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  lang: Language;
  placeholderText?: string;
}

export default function ImageUploader({
  label,
  value,
  onChange,
  lang,
  placeholderText,
}: ImageUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const IMGBB_API_KEY = "58a94c30abc6fe26c5a4d1c4658e2156";

  const handleUploadFile = async (file: File) => {
    if (!file) return;

    // Validate size (max 32MB according to ImgBB limits, but we can set a reasonable 16MB)
    if (file.size > 16 * 1024 * 1024) {
      setError(
        lang === "en"
          ? "File size exceeds 16MB limit."
          : "فائل کا سائز 16MB سے زیادہ نہیں ہونا چاہیے۔"
      );
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(
        `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result && result.success && result.data && result.data.url) {
        onChange(result.data.url);
      } else {
        throw new Error(result.error?.message || "Upload failed");
      }
    } catch (err: any) {
      console.error("ImgBB upload error:", err);
      setError(
        lang === "en"
          ? "Upload failed. Please check network or try again."
          : "اپ لوڈ ناکام ہو گیا۔ براہ کرم نیٹ ورک چیک کریں اور دوبارہ کوشش کریں۔"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUploadFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleAreaClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
          {label}
        </label>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={value ? undefined : handleAreaClick}
        className={`relative w-full min-h-[140px] rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-4 text-center ${
          value
            ? "border-emerald-200 bg-emerald-50/10 cursor-default"
            : dragOver
            ? "border-[#008F5A] bg-[#00A86B]/5 scale-[0.99] cursor-pointer"
            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white cursor-pointer"
        }`}
      >
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept="image/*"
          className="hidden"
          disabled={loading}
        />

        {value ? (
          // Preview state with active thumbnail & image removal option
          <div className="relative w-full flex flex-col md:flex-row items-center gap-4 py-2">
            <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0 group">
              <img
                src={value}
                alt="Uploaded view"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="flex-1 text-left space-y-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-[#008F5A]">
                {lang === "en" ? "Ready & Cloud-Hosted" : "کلاؤڈ ہوسٹڈ تیار ہے"}
              </span>
              <p className="text-xs text-slate-500 font-mono break-all line-clamp-1 max-w-sm">
                {value}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAreaClick}
                  className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-600 font-bold border border-slate-200 text-[11px] rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{lang === "en" ? "Replace" : "تبدیل کریں"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[11px] rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <X className="w-3 h-3" />
                  <span>{lang === "en" ? "Remove" : "حذف کریں"}</span>
                </button>
              </div>
            </div>
          </div>
        ) : loading ? (
          // Loading Spinner state
          <div className="space-y-3 py-4">
            <div className="relative w-10 h-10 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-emerald-100 animate-pulse"></div>
              <div className="absolute inset-0 rounded-full border-t-2 border-[#00A86B] animate-spin"></div>
            </div>
            <div className="space-y-1">
              <p className="text-slate-800 font-extrabold text-xs">
                {lang === "en" ? "Uploading to Cloud CDN..." : "کلاؤڈ اپ لوڈ ہو رہا ہے..."}
              </p>
              <p className="text-slate-400 text-[10px]">
                {lang === "en" ? "Optimizing image file details" : "تصویری فائل کو بہتر بنایا جا رہا ہے"}
              </p>
            </div>
          </div>
        ) : (
          // Idle Dropzone state
          <div className="space-y-3 py-4 flex flex-col items-center">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 max-w-max">
              <UploadCloud className="w-6 h-6 text-slate-500" />
            </div>
            <div className="space-y-1 select-none">
              <p className="text-slate-700 font-extrabold text-xs md:text-sm">
                {lang === "en" ? "Click to Upload or Drag & Drop" : "فائل اپ لوڈ کرنے کے لئے کلک کریں یا ڈریگ کریں"}
              </p>
              <p className="text-slate-400 text-[11px]">
                {placeholderText ||
                  (lang === "en"
                    ? "Supports PNG, JPG, JPEG, WebP (Max 16MB)"
                    : "PNG, JPG, JPEG, WebP سپورٹڈ ہیں (زیادہ سے زیادہ 16MB)")}
              </p>
            </div>
          </div>
        )}

        {/* Error Callout */}
        {error && (
          <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-lg text-rose-500 text-[11px] text-left">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-medium line-clamp-1">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

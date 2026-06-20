import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Slide {
  image: string;
  title: string;
  titleUrdu: string;
  badge: string;
  desc: string;
  descUrdu: string;
}

const SLIDES: Slide[] = [
  {
    image: "https://images.unsplash.com/photo-1603561596112-0a132b757442?q=80&w=1200&auto=format&fit=crop",
    title: "Classics of Qissa Khwani Bazaar",
    titleUrdu: "قصہ خوانی بازار کے روایتی پشاوری چپل",
    badge: "100% HANDMADE CRAFT",
    desc: "Experience true Peshawari style made with genuine handpicked double-sole matte leather.",
    descUrdu: "اصلی چمڑے اور پائیدار ڈبل سول کے ساتھ تیار کردہ روایتی چپل۔"
  },
  {
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop",
    title: "Punjab Agro Direct Basmati Rice",
    titleUrdu: "پنجاب ایگرو براہ راست باسمتی چاول",
    badge: "FARM TO TABLE FRESH",
    desc: "Aged long-grain Kernel Basmati rice and premium pure Desi Ghee directly from Sargodha farms.",
    descUrdu: "سرگودھا کے فارموں سے براہ راست تیار کردہ باسمتی چاول اور خالص دیسی گھی۔"
  },
  {
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1200&auto=format&fit=crop",
    title: "Sialkot Arena Professional Gears",
    titleUrdu: "سیالکوٹ ارینا پروفیشنل اسپورٹس سامان",
    badge: "EXPORT GRADE CRICKET BATS",
    desc: "Original premium willow cricket bats hand-finished by master craftspeople in Sialkot.",
    descUrdu: "انگلش ولو اور بہترین ہینڈل گرفت والے سیالکوٹ کے تیار کردہ اصلی بیٹ۔"
  }
];

export default function ShopifySlider({ lang }: { lang: "en" | "ur" }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % SLIDES.length);
  };

  return (
    <div id="shopify-style-slider" className="relative w-full h-[320px] md:h-[400px] bg-slate-900 rounded-2xl overflow-hidden shadow-lg border border-slate-100 group">
      {/* Slide background with fade */}
      {SLIDES.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === current ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          {/* Unsplash image referral security compliance added */}
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover brightness-[0.45] transition-transform duration-700 hover:scale-105"
            referrerPolicy="no-referrer"
          />
          
          {/* Slide details */}
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-12 z-20 flex flex-col items-start text-white">
            <span id={`slide-badge-${index}`} className="px-3 py-1 bg-[#00A86B] text-white text-xs font-bold rounded-full tracking-wider uppercase mb-3">
              {slide.badge}
            </span>
            <h2 id={`slide-title-${index}`} className="text-2xl md:text-4xl font-extrabold tracking-tight mb-2 max-w-2xl drop-shadow">
              {lang === "en" ? slide.title : slide.titleUrdu}
            </h2>
            <p id={`slide-desc-${index}`} className="text-sm md:text-lg text-slate-200 mb-4 max-w-xl font-light drop-shadow">
              {lang === "en" ? slide.desc : slide.descUrdu}
            </p>
          </div>
        </div>
      ))}

      {/* Slide Controls */}
      <button
        id="slider-control-prev"
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 focus:outline-none"
      >
        <ChevronLeft className="w-6 h-6 animate-pulse" />
      </button>
      <button
        id="slider-control-next"
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 focus:outline-none"
      >
        <ChevronRight className="w-6 h-6 animate-pulse" />
      </button>

      {/* Indicators */}
      <div id="slider-indicators" className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            id={`indicator-dot-${i}`}
            onClick={() => setCurrent(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              i === current ? "bg-[#00A86B] w-6" : "bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

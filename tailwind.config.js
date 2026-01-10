/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Inter - Modern, Okunabilir, Apple Tarzı
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // ===== APPLE LIGHT PREMIUM PALETTE =====
        
        // Zemin ve Yüzeyler
        surface: '#F5F5F7',         // Apple Gri Zemin (Saf beyaz DEĞİL!)
        white: '#FFFFFF',           // Kartlar için saf beyaz
        
        // Metin Renkleri
        text: {
          primary: '#1D1D1F',       // Apple Siyahı (Antrasit - saf siyah DEĞİL!)
          secondary: '#86868B',     // Gri alt metinler
          muted: '#AEAEB2',         // Çok silik metinler
        },
        
        // Ana Renkler (Primary)
        primary: {
          DEFAULT: '#0071E3',       // Apple Mavisi
          hover: '#0077ED',         // Hover state
          light: '#E1F0FF',         // Açık mavi arka plan
        },
        
        // Kenar ve Ayırıcılar
        border: {
          DEFAULT: '#D2D2D7',       // Input ve kart kenarları
          light: '#E5E5EA',         // Daha hafif ayırıcılar
        },
        
        // Durum Renkleri
        success: {
          DEFAULT: '#34C759',       // Yeşil
          light: '#E8F9ED',         // Açık yeşil arka plan
        },
        danger: {
          DEFAULT: '#FF3B30',       // Kırmızı
          light: '#FFF2F2',         // Açık kırmızı arka plan
        },
        warning: {
          DEFAULT: '#FF9500',       // Turuncu
          light: '#FFF8E6',         // Açık turuncu arka plan
        },
        info: {
          DEFAULT: '#007AFF',       // Bilgi mavisi
          light: '#E5F2FF',         // Açık mavi arka plan
        },
      },
      boxShadow: {
        // Apple tarzı yumuşak gölgeler
        'apple-sm': '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'apple': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'apple-lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'apple-xl': '0 16px 48px rgba(0, 0, 0, 0.16)',
      },
      borderRadius: {
        'apple': '12px',
        'apple-lg': '16px',
        'apple-xl': '22px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

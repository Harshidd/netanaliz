import React, { useState, useEffect } from 'react'
import { Lock, RefreshCw, Trash2, Sparkles, Shield, BarChart3 } from 'lucide-react'

const WelcomeModal = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Animasyonlu açılış
    const timer = setTimeout(() => {
      setIsVisible(true)
      setIsAnimating(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  const handleStart = () => {
    setIsAnimating(false)
    setTimeout(() => {
      setIsVisible(false)
      // SessionStorage'a kaydet - sayfa kapatılana kadar bir daha gösterme
      sessionStorage.setItem('netanaliz_welcomed', 'true')
      onClose()
    }, 200)
  }

  if (!isVisible) return null

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isAnimating ? 'bg-black/30 backdrop-blur-sm' : 'bg-transparent'
      }`}
    >
      {/* Modal Container */}
      <div 
        className={`relative w-full max-w-lg transform transition-all duration-500 ease-out ${
          isAnimating 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 translate-y-8 scale-95'
        }`}
      >
        {/* Glassmorphism Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
          
          {/* Gradient Header */}
          <div className="bg-gradient-to-br from-[#0071e3] via-[#0077ed] to-[#007aff] px-8 pt-8 pb-12 text-center relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            
            {/* Logo & Title */}
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
                NetAnaliz'e Hoş Geldiniz
              </h2>
              <p className="text-white/80 text-sm font-medium">
                Hızlı, Güvenli ve Detaylı Sınav Analizi
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 -mt-6">
            {/* Info Cards */}
            <div className="space-y-3">
              
              {/* Gizlilik Kartı */}
              <div className="flex items-start gap-4 p-4 bg-blue-50/80 rounded-2xl border border-blue-100/50">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-sm">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 text-sm mb-0.5">
                    %100 Gizlilik
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Verileriniz sadece kendi cihazınızda işlenir ve hiçbir sunucuya gönderilmez.
                  </p>
                </div>
              </div>

              {/* Akıllı Bellek Kartı */}
              <div className="flex items-start gap-4 p-4 bg-emerald-50/80 rounded-2xl border border-emerald-100/50">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-sm">
                  <RefreshCw className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 text-sm mb-0.5">
                    Akıllı Bellek
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Çalışmalarınız tarayıcı belleğinde korunur. Sayfayı yenileseniz bile verileriniz kaybolmaz.
                  </p>
                </div>
              </div>

              {/* Otomatik Temizleme Kartı */}
              <div className="flex items-start gap-4 p-4 bg-amber-50/80 rounded-2xl border border-amber-100/50">
                <div className="flex-shrink-0 w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-sm">
                  <Trash2 className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 text-sm mb-0.5">
                    Otomatik Temizleme
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Güvenliğiniz için, <strong>tarayıcı sekmesini kapattığınızda</strong> tüm veriler otomatik silinir.
                  </p>
                </div>
              </div>

            </div>

            {/* CTA Button */}
            <button
              onClick={handleStart}
              className="w-full mt-6 bg-gradient-to-r from-[#0071e3] to-[#007aff] text-white font-semibold py-3.5 px-6 rounded-xl 
                         hover:shadow-lg hover:shadow-blue-500/25 hover:scale-[1.02] 
                         active:scale-[0.98] transition-all duration-200
                         flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Analize Başla
            </button>

            {/* Footer Note */}
            <p className="text-center text-[10px] text-gray-400 mt-4">
              NetAnaliz - Eğitimde Net Görüş
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WelcomeModal


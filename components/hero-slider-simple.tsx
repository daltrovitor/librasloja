"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from '@/hooks/use-toast'

interface HeroSliderImage {
  id: string
  image_url: string
  display_order: number
}

export function HeroSliderSimple() {
  const [slides, setSlides] = useState<HeroSliderImage[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [, setDirection] = useState<"left" | "right">("right")
  const [autoPlay, setAutoPlay] = useState(true)
  const [, setLoading] = useState(true)

  // Fetch slides on mount
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        console.log('Hero Slider: Carregando banners...')
        const res = await fetch("/api/admin/banners")

        if (!res.ok) {
          console.warn('Hero Slider: API error')
          setSlides([])
          return
        }

        const data = await res.json()

        if (Array.isArray(data)) {
          // Filter active banners and map to state
          const activeBanners = data
            .filter((b: any) => b.active !== false) // default true
            .map((b: any) => ({
              id: b.id,
              image_url: b.image_url,
              display_order: 0 // Default order
            }))

          setSlides(activeBanners)
        }
      } catch (error: any) {
        console.error("Hero Slider Error:", error)
        setSlides([])
      } finally {
        setLoading(false)
      }
    }

    fetchSlides()
  }, [])

  // Auto-play effect
  useEffect(() => {
    if (!autoPlay || slides.length === 0) return

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length)
      setDirection("right")
    }, 5000)

    return () => clearInterval(interval)
  }, [autoPlay, slides])

  const goToPrevious = () => {
    setAutoPlay(false)
    setDirection("left")
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const goToNext = () => {
    setAutoPlay(false)
    setDirection("right")
    setActiveIndex((prev) => (prev + 1) % slides.length)
  }

  const goToSlide = (index: number) => {
    setAutoPlay(false)
    setDirection(index > activeIndex ? "right" : "left")
    setActiveIndex(index)
  }

  // Ensure we always have at least two slides (placeholders are set during fetch)
  const effectiveSlides = slides && slides.length > 0 ? slides : [
    { id: 'ph-1', image_url: '/placeholder.jpg', display_order: 0 },
    { id: 'ph-2', image_url: '/placeholder.jpg', display_order: 1 },
  ]

  return (
    <div className="relative w-full h-full">
      {effectiveSlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === activeIndex ? "opacity-100" : "opacity-0"
            }`}
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src={slide.image_url}
              alt={`Slide ${index + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.warn("Failed to load image:", slide.image_url)
                toast({ title: 'Falha ao carregar imagem', description: slide.image_url })
                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23cccccc' width='100' height='100'/%3E%3C/svg%3E"
              }}
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/40" />
          </div>
        </div>
      ))}

      {/* Navigation Buttons */}
      {effectiveSlides.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer z-20 bg-white/30 hover:bg-white/50 text-white p-3 rounded-full transition backdrop-blur-sm"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 cursor-pointer -translate-y-1/2 z-20 bg-white/30 hover:bg-white/50 text-white p-3 rounded-full transition backdrop-blur-sm"
            aria-label="Próximo slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots Navigation */}
      {effectiveSlides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {effectiveSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-full ${index === activeIndex
                  ? "bg-white w-8 h-3"
                  : "bg-white/50 hover:bg-white/70 w-3 h-3"
                }`}
              aria-label={`Ir para slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

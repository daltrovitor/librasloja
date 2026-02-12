
"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/ecommerce/ProductCard"
import { Button } from "@/components/ui/button"
import { ArrowRight, Mail } from "lucide-react"
import { HeroSliderSimple } from "@/components/hero-slider-simple"
import type { Product } from "@/lib/store/types"

function HomeContent() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedProducts()
  }, [])

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/products?featured=true')
      if (res.ok) {
        const data = await res.json()
        setFeaturedProducts(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching featured products:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/20">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] w-full shadow-xl">
        <HeroSliderSimple />
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="font-serif text-4xl font-bold mb-4 text-primary">Destaques</h2>
              <p className="text-muted-foreground max-w-xl">
                Confira nossos produtos mais vendidos e recomendados por especialistas.
              </p>
            </div>
            <Button variant="link" className="text-primary font-bold uppercase tracking-widest hover:translate-x-1 transition-transform" asChild>
              <Link href="/loja">
                Ver Todos <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted aspect-square w-full mb-4"></div>
                  <div className="h-4 bg-muted w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted w-1/2"></div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/20 border border-dashed border-border">
              <p className="text-muted-foreground">Nenhum produto em destaque no momento.</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/admin">Adicionar Produtos (Admin)</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}

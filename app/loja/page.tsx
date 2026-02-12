
"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProductGrid } from "@/components/ecommerce/ProductGrid"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter } from "lucide-react"
import type { Product, Category } from "@/lib/store/types"

function LojaContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const searchParams = useSearchParams()
  const router = useRouter()

  const categoryParam = searchParams.get('categoryId') || "all"
  const sortParam = searchParams.get('sort') || "newest"
  const searchParam = searchParams.get('search') || ""
  const featuredParam = searchParams.get('featured')

  const [selectedCategory, setSelectedCategory] = useState(categoryParam)
  const [sortBy, setSortBy] = useState(sortParam === 'created_at' ? 'newest' : sortParam)

  // Sync state with URL when URL changes
  useEffect(() => {
    setSelectedCategory(categoryParam)
    setSortBy(sortParam === 'created_at' ? 'newest' : sortParam)
  }, [categoryParam, sortParam])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [selectedCategory, sortBy, searchParam, featuredParam])

  const updateFilters = (newCategory: string, newSort: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (newCategory && newCategory !== 'all') params.set('categoryId', newCategory)
    else params.delete('categoryId')

    if (newSort && newSort !== 'newest') params.set('sort', newSort)
    else params.delete('sort')

    router.push(`/loja?${params.toString()}`)
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedCategory && selectedCategory !== "all") params.append('categoryId', selectedCategory)
      if (searchParam) params.append('search', searchParam)
      if (featuredParam) params.append('featured', 'true')

      const res = await fetch(`/api/products?${params.toString()}`)
      if (res.ok) {
        let data = await res.json()
        if (Array.isArray(data)) {
          // Helper to get price
          const getPrice = (p: any) => p.price || p.variants?.[0]?.retail_price || 0

          if (sortBy === 'name') data.sort((a, b) => a.name.localeCompare(b.name))
          if (sortBy === 'price_asc') data.sort((a, b) => getPrice(a) - getPrice(b))
          if (sortBy === 'price_desc') data.sort((a, b) => getPrice(b) - getPrice(a))
          // created_at is likely default from API, or we can sort here:
          if (sortBy === 'created_at' || sortBy === 'newest') data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

          setProducts(data)
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 pt-32">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-serif font-bold mb-4">
            {searchParam ? `Resultados para "${searchParam}"` : "Nossa Loja"}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {featuredParam
              ? "Confira nossos produtos em destaque."
              : searchParams.get('sort') === 'newest'
                ? "Confira as últimas novidades que acabaram de chegar."
                : "Explore nossa linha completa de produtos abrasivos de alta performance."
            }
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-12 p-4 bg-muted/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold uppercase tracking-wide">Filtros:</span>
          </div>

          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            <Select
              value={selectedCategory}
              onValueChange={(val) => {
                setSelectedCategory(val)
                updateFilters(val, sortBy)
              }}
            >
              <SelectTrigger className="w-full md:w-[200px] bg-background">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={sortBy}
              onValueChange={(val) => {
                setSortBy(val)
                updateFilters(selectedCategory, val)
              }}
            >
              <SelectTrigger className="w-full md:w-[200px] bg-background">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mais recentes</SelectItem>
                <SelectItem value="name">Nome A-Z</SelectItem>
                <SelectItem value="price_asc">Menor preço</SelectItem>
                <SelectItem value="price_desc">Maior preço</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted h-64 mb-4"></div>
                <div className="bg-muted h-4 mb-2 w-3/4"></div>
                <div className="bg-muted h-4 w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">Nenhum produto encontrado.</p>
                {(searchParam || categoryParam !== 'all' || featuredParam) && (
                  <button
                    onClick={() => router.push('/loja')}
                    className="mt-4 text-primary hover:underline font-bold"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            ) : (
              <ProductGrid
                products={products}
                columns={4}
              />
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default function LojaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Carregando...</div>}>
      <LojaContent />
    </Suspense>
  )
}

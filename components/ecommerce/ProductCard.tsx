"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useCart } from "@/hooks/use-shopping-cart"
import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"
import { toast } from "sonner"
import type { Product } from "@/lib/store/types"

interface ProductCardProps {
    product: Product
    priority?: boolean
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
    // Determine price range
    // types.ts has Variant.retail_price.
    const prices = product.variants?.map(v => v.retail_price || v.price || 0) || []
    const minPrice = prices.length ? Math.min(...prices) : 0
    const maxPrice = prices.length ? Math.max(...prices) : 0

    const formatPrice = (p: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(p)
    }

    const priceDisplay =
        minPrice === maxPrice
            ? formatPrice(minPrice)
            : `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`

    // Determine image
    const imageUrl =
        product.mockups?.find(m => m.is_main)?.image_url ||
        product.mockups?.[0]?.image_url ||
        product.thumbnail_url ||
        "/placeholder.jpg"

    // Sizes
    const availableSizes = product.variants
        ?.filter((v) => v.in_stock && v.size)
        .map((v) => v.size)
        .filter((size, index, self) => self.indexOf(size) === index)
        .slice(0, 5)

    const { addItem } = useCart()
    const router = useRouter()

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="group h-full"
        >
            <div className="bg-card rounded-lg overflow-hidden border border-border/50 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-lg h-full flex flex-col">
                <Link href={`/produto/${product.slug}`} className="block relative aspect-square overflow-hidden bg-muted">
                    {/* Imagem do produto */}
                    <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        priority={priority}
                    />

                    {/* Badge de destaque */}
                    {product.is_featured && (
                        <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-sm uppercase tracking-wider">
                            Destaque
                        </div>
                    )}
                </Link>

                {/* Informações do produto */}
                <div className="p-4 flex flex-col flex-1">
                    {/* Categoria */}
                    {product.category && (
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                            {product.category.name}
                        </p>
                    )}

                    <Link href={`/produto/${product.slug}`} className="block mb-2">
                        {/* Nome */}
                        <h3 className="font-serif font-bold text-foreground text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                            {product.name}
                        </h3>
                    </Link>

                    {/* Tamanhos disponíveis */}
                    {availableSizes && availableSizes.length > 0 && (
                        <div className="flex gap-1 mb-3">
                            {availableSizes.map((size) => (
                                <span
                                    key={size}
                                    className="text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 rounded-sm uppercase"
                                >
                                    {size}
                                </span>
                            ))}
                            {product.variants && product.variants.filter((v) => v.in_stock && v.size).length > 5 && (
                                <span className="text-[10px] text-muted-foreground">+</span>
                            )}
                        </div>
                    )}

                    <div className="mt-auto">
                        {/* Preço */}
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-lg font-bold text-primary">
                                {priceDisplay}
                            </p>
                        </div>

                        {/* Botão de Adicionar */}
                        <Button
                            className="w-full transition-all"
                            onClick={() => {
                                // If multiple variants (e.g. sizes/colors), go to product page
                                if (product.variants && product.variants.length > 1) {
                                    router.push(`/produto/${product.slug}`)
                                    return
                                }

                                // If single variant, add to cart immediately
                                if (product.variants && product.variants.length === 1) {
                                    const variant = product.variants[0]
                                    addItem({
                                        id: variant.id,
                                        product_id: product.id,
                                        name: product.name,
                                        price: variant.retail_price || variant.price || 0,
                                        image: product.thumbnail_url || product.images?.[0] || "",
                                        quantity: 1
                                    })
                                    toast.success("Adicionado ao carrinho!")
                                } else {
                                    // Fallback if no variants (shouldn't happen ideally)
                                    router.push(`/produto/${product.slug}`)
                                }
                            }}
                        >
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            {(product.variants && product.variants.length > 1) ? "Ver Opções" : "Adicionar"}
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

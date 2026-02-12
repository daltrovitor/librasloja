
"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Truck, Check, ShieldCheck, Heart, ShoppingCart } from "lucide-react"
import { toast } from "sonner"
import type { Product, Variant } from "@/lib/store/types"
import { useCart } from "@/hooks/use-shopping-cart"

const formatPrice = (p: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(p)
}

export default function ProductDetailsClient({ initialProduct }: { initialProduct: Product }) {
    const { addItem, openCart } = useCart()

    const [product, setProduct] = useState<Product>(initialProduct)
    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(() => {
        if (initialProduct.variants?.length > 0) {
            const firstAvailable = initialProduct.variants.find((v: Variant) => v.in_stock) || initialProduct.variants[0]
            return firstAvailable.id
        }
        return null
    })
    const [quantity, setQuantity] = useState(1)

    const handleAddToCart = () => {
        if (!selectedVariantId || !product) return

        const variant = product.variants?.find(v => v.id === selectedVariantId)
        if (!variant || !variant.in_stock) {
            toast.error('Variante selecionada não está disponível')
            return
        }

        addItem({
            id: variant.id,
            product_id: product.id,
            variant_id: variant.id,
            name: product.name,
            price: variant.retail_price || variant.price || 0,
            quantity: quantity,
            image: product.thumbnail_url || product.images?.[0] || '/placeholder.jpg',
            size: variant.size || undefined,
            color: variant.color || undefined
        })

        toast.success('Produto adicionado ao carrinho!')
    }

    const handleBuyNow = () => {
        handleAddToCart()
        openCart()
    }

    const selectedVariant = product.variants?.find(v => v.id === selectedVariantId)

    const mainImage = product.mockups?.find(m => m.is_main)?.image_url ||
        product.mockups?.[0]?.image_url ||
        product.thumbnail_url ||
        product.images?.[0] ||
        '/placeholder.jpg'

    const additionalImages = product.mockups?.map(m => m.image_url) || product.images || []

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <main className="container mx-auto px-4 py-8 pt-32">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    {/* Imagens */}
                    <div className="space-y-6">
                        <div className="relative aspect-square rounded-none border border-border overflow-hidden bg-muted">
                            {mainImage ? (
                                <Image
                                    src={mainImage}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-muted-foreground">Sem imagem</p>
                                </div>
                            )}
                        </div>

                        {/* Mockups adicionais */}
                        {additionalImages.length > 1 && (
                            <div className="grid grid-cols-4 gap-4">
                                {additionalImages.slice(0, 4).map((img, index) => (
                                    <div key={index} className="aspect-square border border-border cursor-pointer hover:border-primary transition-colors overflow-hidden bg-muted relative">
                                        <Image
                                            src={img}
                                            alt={`${product.name} - ${index}`}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Informações do Produto */}
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-4xl font-serif font-bold mb-3">{product.name}</h1>
                            {product.category && (
                                <Badge variant="secondary" className="mb-4 text-xs uppercase tracking-wider rounded-sm">
                                    {product.category.name}
                                </Badge>
                            )}
                            <div className="flex items-end gap-4 mt-2">
                                <p className="text-3xl font-bold text-primary">
                                    {selectedVariant ? formatPrice(selectedVariant.retail_price || selectedVariant.price || 0) : formatPrice(0)}
                                </p>
                            </div>
                        </div>

                        {product.description && (
                            <div className="prose prose-neutral max-w-none text-muted-foreground">
                                <p>{product.description}</p>
                            </div>
                        )}

                        {/* Seleção de Variantes */}
                        {product.variants && product.variants.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-sm uppercase tracking-wide">Opções</span>
                                </div>
                                <Select value={selectedVariantId || ''} onValueChange={setSelectedVariantId}>
                                    <SelectTrigger className="w-full h-12">
                                        <SelectValue placeholder="Selecione uma opção" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {product.variants.map((variant: Variant) => (
                                            <SelectItem
                                                key={variant.id}
                                                value={variant.id}
                                                disabled={!variant.in_stock}
                                            >
                                                {variant.name || variant.size} {!variant.in_stock && '(Esgotado)'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Quantidade e Ações */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border">
                            <div className="flex items-center border border-input rounded-md h-14 w-32">
                                <button
                                    className="px-3 h-full hover:bg-muted transition-colors"
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                >
                                    -
                                </button>
                                <span className="flex-1 text-center font-bold">{quantity}</span>
                                <button
                                    className="px-3 h-full hover:bg-muted transition-colors"
                                    onClick={() => setQuantity(quantity + 1)}
                                >
                                    +
                                </button>
                            </div>

                            <Button
                                className="flex-1 h-14 text-lg font-bold uppercase tracking-widest bg-primary hover:bg-primary/90 text-white"
                                onClick={handleBuyNow}
                                disabled={!selectedVariantId || !selectedVariant?.in_stock}
                            >
                                <ShoppingCart className="h-5 w-5 mr-2" />
                                Comprar
                            </Button>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full h-12 uppercase tracking-wide font-semibold"
                            onClick={handleAddToCart}
                            disabled={!selectedVariantId || !selectedVariant?.in_stock}
                        >
                            Adicionar ao Carrinho
                        </Button>

                        {/* Features */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 pt-8 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-3">
                                <Truck className="h-5 w-5 text-primary" />
                                <span>Frete calculado no checkout</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                                <span>Garantia de Qualidade Librás</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Check className="h-5 w-5 text-primary" />
                                <span>Estoque imediato</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Heart className="h-5 w-5 text-primary" />
                                <span>Compra segura</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}

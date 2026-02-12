
"use client"

import { ProductCard } from "./ProductCard"
import type { Product } from "@/lib/store/types"

interface ProductGridProps {
    products: Product[]
    title?: string
    description?: string
    showViewAll?: boolean
    viewAllLink?: string
    columns?: 2 | 3 | 4
}

export function ProductGrid({
    products,
    title,
    description,
    showViewAll = false,
    viewAllLink = "/loja",
    columns = 4,
}: ProductGridProps) {
    const gridCols = {
        2: "grid-cols-1 sm:grid-cols-2",
        3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    }

    return (
        <section className="py-12 md:py-16">
            {/* Header */}
            {(title || description) && (
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
                    <div>
                        {title && (
                            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
                                {title}
                            </h2>
                        )}
                        {description && (
                            <p className="text-muted-foreground mt-2 max-w-2xl text-lg">
                                {description}
                            </p>
                        )}
                    </div>

                    {showViewAll && (
                        <a
                            href={viewAllLink}
                            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-bold uppercase tracking-widest text-sm transition-colors group"
                        >
                            Ver todos
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="transform group-hover:translate-x-1 transition-transform"
                            >
                                <path d="M5 12h14" />
                                <path d="m12 5 7 7-7 7" />
                            </svg>
                        </a>
                    )}
                </div>
            )}

            {/* Grid de produtos */}
            {products.length > 0 ? (
                <div className={`grid ${gridCols[columns]} gap-x-6 gap-y-10`}>
                    {products.map((product, index) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            priority={index < 4}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-muted/10 rounded-xl border border-dashed border-border">
                    <div className="text-muted-foreground">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="48"
                            height="48"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mx-auto mb-4 opacity-30"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M8 12h8" />
                        </svg>
                        <p className="text-xl font-serif font-medium text-foreground">Nenhum produto encontrado</p>
                        <p className="text-sm mt-2 opacity-70">
                            Volte em breve para conferir nossas novidades!
                        </p>
                    </div>
                </div>
            )}
        </section>
    )
}

export default ProductGrid

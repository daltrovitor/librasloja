"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface SizeSelectorProps {
    sizes: string[]
    selectedSize: string | null
    onSelect: (size: string) => void
}

export function SizeSelector({ sizes, selectedSize, onSelect }: SizeSelectorProps) {
    if (!sizes || sizes.length === 0) return null

    // Ordem lógica de tamanhos
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL']

    const sortedSizes = [...sizes].sort((a, b) => {
        return sizeOrder.indexOf(a) - sizeOrder.indexOf(b)
    })

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <label className="text-sm font-bold uppercase tracking-wide text-foreground">
                    Tamanho: {selectedSize || <span className="text-muted-foreground font-normal normal-case">Selecione um tamanho</span>}
                </label>
                <button className="text-xs text-primary hover:underline">Guia de medidas</button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {sortedSizes.map((size) => (
                    <button
                        key={size}
                        onClick={() => onSelect(size)}
                        className={cn(
                            "h-12 flex items-center justify-center rounded-lg border-2 text-sm font-bold transition-all size-btn",
                            selectedSize === size
                                ? "selected"
                                : "border-border bg-card text-muted-foreground hover:border-foreground"
                        )}
                    >
                        {size}
                    </button>
                ))}
            </div>
        </div>
    )
}


"use client"

import { ShoppingCart, X, Plus, Minus, Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useCart } from "@/hooks/use-shopping-cart"
import { Button } from "@/components/ui/button"

const formatPrice = (p: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(p)
}

export function CartIcon() {
    const { toggleCart, itemCount } = useCart()

    return (
        <button
            onClick={toggleCart}
            className="relative p-2 hover:bg-accent/10 rounded-lg transition-colors group"
            aria-label="Carrinho de compras"
        >
            <ShoppingCart className="w-5 h-5 cursor-pointer group-hover:text-primary transition-colors" />
            {itemCount > 0 && (
                <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white"
                >
                    {itemCount > 9 ? "9+" : itemCount}
                </motion.span>
            )}
        </button>
    )
}

export function CartDrawer() {
    const {
        cart,
        isOpen,
        closeCart,
        removeItem,
        updateQuantity,
        clearCart,
    } = useCart()

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeCart}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border z-50 flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
                            <div className="flex items-center gap-3">
                                <ShoppingCart className="w-5 h-5 text-primary" />
                                <h2 className="text-lg font-serif font-bold">Carrinho</h2>
                                <span className="text-sm text-muted-foreground">
                                    ({cart.items.length} {cart.items.length === 1 ? "item" : "itens"})
                                </span>
                            </div>
                            <button
                                onClick={closeCart}
                                className="p-2 hover:bg-muted rounded-full transition-colors"
                                aria-label="Fechar carrinho"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Items */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {cart.items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                                        <ShoppingCart className="w-10 h-10 text-muted-foreground/50" />
                                    </div>
                                    <p className="text-xl font-serif font-bold text-foreground mb-2">
                                        Seu carrinho está vazio
                                    </p>
                                    <p className="text-muted-foreground mb-8 max-w-[200px]">
                                        Parece que você ainda não escolheu seus produtos.
                                    </p>
                                    <Button onClick={closeCart} className="bg-primary hover:bg-primary/90 text-white" asChild>
                                        <Link href="/loja">Explorar Loja</Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {cart.items.map((item) => (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -100 }}
                                            className="flex gap-4 bg-card border border-border rounded-lg p-3 hover:border-primary/30 transition-colors"
                                        >
                                            {/* Imagem */}
                                            <div className="relative w-20 h-20 bg-muted rounded-md overflow-hidden flex-shrink-0">
                                                {item.image ? (
                                                    <Image
                                                        src={item.image}
                                                        alt={item.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                        <ShoppingCart className="w-8 h-8 opacity-20" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                <div>
                                                    <h3 className="font-bold text-foreground text-sm line-clamp-1">
                                                        {item.name}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {item.size} {item.color && `• ${item.color}`}
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-between mt-2">
                                                    <p className="text-primary font-bold text-sm">
                                                        {formatPrice(item.price)}
                                                    </p>

                                                    {/* Quantidade */}
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() =>
                                                                updateQuantity(item.id, item.quantity - 1)
                                                            }
                                                            className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </button>
                                                        <span className="text-sm font-medium w-4 text-center">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() =>
                                                                updateQuantity(item.id, item.quantity + 1)
                                                            }
                                                            className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Remover */}
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="self-start -mr-1 -mt-1 p-1.5 text-muted-foreground/50 hover:text-red-500 transition-colors"
                                                aria-label="Remover item"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {cart.items.length > 0 && (
                            <div className="border-t border-border p-6 bg-muted/10 space-y-4">
                                {/* Totais */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span className="font-medium">
                                            {formatPrice(cart.subtotal)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Frete</span>
                                        <span className="text-muted-foreground text-xs italic">
                                            Calculado no checkout
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-lg font-serif font-bold pt-3 border-t border-border mt-2">
                                        <span>Total</span>
                                        <span className="text-primary">
                                            {formatPrice(cart.total)}
                                        </span>
                                    </div>
                                </div>

                                {/* Ações */}
                                <div className="space-y-3 pt-2">
                                    <Button asChild className="w-full bg-primary hover:bg-primary/90 text-white font-bold tracking-wide" size="lg">
                                        <Link href="/checkout" onClick={closeCart}>
                                            FINALIZAR COMPRA
                                        </Link>
                                    </Button>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            variant="outline"
                                            className="w-full text-xs"
                                            onClick={closeCart}
                                            asChild
                                        >
                                            <Link href="/loja">Continuar Comprando</Link>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={clearCart}
                                            className="w-full text-xs text-muted-foreground hover:text-red-500"
                                        >
                                            Limpar Carrinho
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

export default CartDrawer

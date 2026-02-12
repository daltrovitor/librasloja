
"use client"

import { useState, useEffect, Suspense } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { CheckoutForm } from "@/components/ecommerce/CheckoutForm"
import { useCart } from "@/hooks/use-shopping-cart"
import { Loader2 } from "lucide-react"

function CheckoutContent() {
  const { cart } = useCart()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 pt-32">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-serif font-bold mb-8 text-center md:text-left">Finalizar Compra</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Formulário de Checkout */}
            <div className="lg:col-span-2">
              <CheckoutForm />
            </div>

            {/* Resumo do Carrinho (Lateral) */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-32 p-6 border rounded-xl bg-muted/10">
                <h3 className="font-serif font-bold text-xl mb-4">Resumo do Pedido</h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-16 bg-muted rounded-md relative overflow-hidden flex-shrink-0 border border-border">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                            <span className="text-xs">Sem img</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm line-clamp-2 text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">Qtd: {item.quantity}</p>
                        <p className="text-xs text-primary font-bold mt-1">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}

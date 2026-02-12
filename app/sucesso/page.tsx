"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { CheckCircle2, ShoppingBag, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/use-shopping-cart"
import { motion } from "framer-motion"

function SuccessContent() {
    const searchParams = useSearchParams()
    const orderId = searchParams.get("order_id")
    const sessionId = searchParams.get("session_id")
    const { clearCart } = useCart()
    const [isVerifying, setIsVerifying] = useState(!!sessionId)

    // Clear cart on mount if we have an orderId
    useEffect(() => {
        if (orderId) {
            clearCart()
        }
    }, [orderId, clearCart])

    // Verify payment if session_id is present
    useEffect(() => {
        if (sessionId) {
            const verifyPayment = async () => {
                try {
                    const res = await fetch(`/api/checkout/verify?sessionId=${sessionId}`)
                    const data = await res.json()

                    if (!res.ok) {
                        console.error('Falha na verificação:', data.error)
                        // toast.error('Erro ao verificar status do pagamento')
                    } else {
                        console.log('Pagamento verificado:', data)
                    }
                } catch (error) {
                    console.error('Erro ao verificar pagamento:', error)
                } finally {
                    setIsVerifying(false)
                }
            }
            verifyPayment()
        }
    }, [sessionId])

    if (isVerifying) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
                <h2 className="text-2xl font-bold mb-2">Verificando pagamento...</h2>
                <p className="text-muted-foreground">Por favor, aguarde um momento.</p>
            </div>
        )
    }

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="mb-8"
            >
                <div className="w-24 h-24 bg-white dark:bg-white rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-600" />
                </div>
            </motion.div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
            >
                <h1 className="text-4xl font-black font-serif mb-4 tracking-tighter">
                    Pagamento Confirmado!
                </h1>
                <p className="text-xl text-muted-foreground max-w-lg mx-auto mb-8">
                    Obrigado por sua compra. Seu pedido foi recebido e já estamos preparando tudo com muito carinho.
                </p>

                {orderId && (
                    <div className="bg-muted/50 py-3 px-6 rounded-lg inline-block mb-8 border border-border">
                        <span className="text-sm text-muted-foreground mr-2">Número do Pedido:</span>
                        <span className="font-mono font-bold text-primary">{orderId}</span>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg" className="h-12 px-8 font-bold text-lg">
                        <Link href="/loja">
                            <ShoppingBag className="mr-2 h-5 w-5" />
                            Continuar Comprando
                        </Link>
                    </Button>

                    {orderId && (
                        <Button asChild variant="outline" size="lg" className="h-12 px-8 font-bold text-lg bg-background">
                            <Link href="/pedidos">
                                Ver Meus Pedidos
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    )}
                </div>
            </motion.div>
        </div>
    )
}

export default function SuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
            <SuccessContent />
        </Suspense>
    )
}

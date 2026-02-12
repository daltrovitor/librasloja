
"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCart } from "@/hooks/use-shopping-cart"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

const formatPrice = (p: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(p)
}

const checkoutSchema = z.object({
    fullName: z.string().min(3, "Nome completo é obrigatório"),
    email: z.string().email("Email inválido"),
    phone: z.string().min(10, "Telefone inválido"),
    cep: z.string().min(8, "CEP inválido"),
    address: z.string().min(3, "Endereço obrigatório"),
    number: z.string().min(1, "Número obrigatório"),
    complement: z.string().optional(),
    city: z.string().min(2, "Cidade obrigatória"),
    state: z.string().length(2, "UF inválido"),
})

type CheckoutFormData = z.infer<typeof checkoutSchema>

export function CheckoutForm() {
    const { cart, clearCart } = useCart()
    const [isProcessing, setIsProcessing] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const [shippingCost, setShippingCost] = useState(0)

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<CheckoutFormData>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            state: '',
        }
    })

    const watchedState = watch("state")
    const watchedCep = watch("cep")

    // Auto-fill address from CEP
    useEffect(() => {
        const fetchAddress = async () => {
            const cep = watchedCep?.replace(/\D/g, '')
            if (cep?.length === 8) {
                try {
                    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
                    const data = await res.json()
                    if (!data.erro) {
                        setValue('address', data.logradouro, { shouldValidate: true })
                        setValue('city', data.localidade, { shouldValidate: true })
                        setValue('state', data.uf, { shouldValidate: true })

                        if (data.complemento) {
                            setValue('complement', data.complemento, { shouldValidate: true })
                        }

                        toast.success("Endereço encontrado!")

                        // Optional: Focus on number field
                        // document.getElementById('number')?.focus()
                    } else {
                        toast.error("CEP não encontrado")
                    }
                } catch (error) {
                    console.error("Erro ao buscar CEP", error)
                }
            }
        }
        fetchAddress()
    }, [watchedCep, setValue])

    // Calculate dynamic shipping
    useEffect(() => {
        const calculateShipping = async () => {
            if (watchedState && watchedState.length === 2) {
                try {
                    const res = await fetch('/api/shipping/calculate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ state: watchedState })
                    })
                    if (res.ok) {
                        const data = await res.json()
                        setShippingCost(Number(data.price))
                        if (Number(data.price) > 0) {
                            toast.success(`Frete calculado: ${formatPrice(Number(data.price))}`)
                        }
                    }
                } catch (e) {
                    console.error("Shipping calc error", e)
                }
            }
        }
        calculateShipping()
    }, [watchedState])

    const total = cart.subtotal + shippingCost

    const onSubmit = async (data: CheckoutFormData) => {
        setIsProcessing(true)

        try {
            // Prepare order payload
            const orderPayload = {
                items: cart.items.map(item => ({
                    variant_id: item.id,
                    quantity: item.quantity,
                    price: item.price,
                    name: item.name
                })),
                customer: {
                    name: data.fullName,
                    email: data.email,
                    phone: data.phone
                },
                shipping_address: {
                    name: data.fullName,
                    address1: `${data.address}, ${data.number}`,
                    address2: data.complement,
                    city: data.city,
                    state_code: data.state,
                    country_code: 'BR',
                    zip: data.cep,
                    phone: data.phone,
                    email: data.email
                },
                shipping_cost: shippingCost,
                success_url: `${window.location.origin}/sucesso`,
                cancel_url: `${window.location.origin}/checkout`
            }

            const response = await fetch('/api/checkout/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderPayload),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Falha ao processar pagamento')
            }

            const result = await response.json()

            // If we have a checkout URL (e.g. Stripe), redirect
            if (result.checkout_url) {
                window.location.href = result.checkout_url
                clearCart() // Maybe clear after success? But typically cleared on thank you page.
            } else {
                // If just success (e.g. manual/mock payment)
                setIsSuccess(true)
                clearCart()
            }

        } catch (error) {
            console.error('Checkout error:', error)
            toast.error('Erro ao processar pedido. Tente novamente.')
        } finally {
            setIsProcessing(false)
        }
    }

    if (isSuccess) {
        return (
            <div className="text-center py-12">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary animate-bounce">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Pedido Confirmado!</h2>
                <p className="text-muted-foreground mb-8">
                    Seu pedido foi recebido com sucesso.<br />
                    Enviaremos as atualizações para seu email.
                </p>
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest">
                    <a href="/loja">Continuar Comprando</a>
                </Button>
            </div>
        )
    }

    if (cart.items.length === 0 && !isSuccess) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Seu carrinho está vazio.</p>
                <Button asChild variant="outline">
                    <a href="/loja">Voltar para Loja</a>
                </Button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Dados Pessoais e Entrega */}
            <div className="bg-card p-6 rounded-xl border border-border">
                <h3 className="text-xl font-bold font-serif mb-6 flex items-center gap-2">
                    1. Entrega
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="fullName">Nome Completo</Label>
                        <Input id="fullName" {...register("fullName")} className={errors.fullName ? "border-red-500" : ""} />
                        {errors.fullName && <span className="text-xs text-red-500">{errors.fullName.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" {...register("email")} className={errors.email ? "border-red-500" : ""} />
                        {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input id="phone" {...register("phone")} placeholder="(00) 00000-0000" className={errors.phone ? "border-red-500" : ""} />
                        {errors.phone && <span className="text-xs text-red-500">{errors.phone.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cep">CEP</Label>
                        <Input id="cep" {...register("cep")} placeholder="00000-000" className={errors.cep ? "border-red-500" : ""} />
                        {errors.cep && <span className="text-xs text-red-500">{errors.cep.message}</span>}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">Endereço</Label>
                        <Input id="address" {...register("address")} className={errors.address ? "border-red-500" : ""} />
                        {errors.address && <span className="text-xs text-red-500">{errors.address.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="number">Número</Label>
                        <Input id="number" {...register("number")} className={errors.number ? "border-red-500" : ""} />
                        {errors.number && <span className="text-xs text-red-500">{errors.number.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="complement">Complemento</Label>
                        <Input id="complement" {...register("complement")} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="city">Cidade</Label>
                        <Input id="city" {...register("city")} className={errors.city ? "border-red-500" : ""} />
                        {errors.city && <span className="text-xs text-red-500">{errors.city.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="state">Estado</Label>
                        <Input id="state" {...register("state")} maxLength={2} placeholder="UF" className={errors.state ? "border-red-500" : ""} />
                        {errors.state && <span className="text-xs text-red-500">{errors.state.message}</span>}
                    </div>
                </div>
            </div>

            {/* Pagamento será no Stripe */}
            <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                <h3 className="text-xl font-bold font-serif mb-2 flex items-center gap-2 text-blue-800">
                    2. Pagamento
                </h3>
                <p className="text-blue-600 text-sm">
                    Você será redirecionado para o ambiente seguro do Stripe para finalizar o pagamento.
                </p>
            </div>

            {/* Resumo do Pedido */}
            <div className="bg-muted/30 p-6 rounded-xl border border-border">
                <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatPrice(cart.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Frete</span>
                        <span>{formatPrice(shippingCost)}</span>
                    </div>
                </div>
                <div className="flex justify-between text-xl font-black uppercase pt-4 border-t border-border mb-6">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(total)}</span>
                </div>

                <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-14 text-lg uppercase tracking-widest"
                    disabled={isProcessing || cart.items.length === 0}
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processando...
                        </>
                    ) : (
                        `Pagar ${formatPrice(total)}`
                    )}
                </Button>
            </div>
        </form>
    )
}

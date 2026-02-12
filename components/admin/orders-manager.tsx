
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Eye, CreditCard, RefreshCw, MapPin, Package, Truck, CheckCircle2, Clock, XCircle } from "lucide-react"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"

interface Order {
    id: string
    external_id: string
    status: string
    payment_status: string
    total: number
    shipping_cost: number
    customer_name: string
    customer_email: string
    created_at: string
    items: any[]
    shipping_address: any
    payment_id?: string
}

// Delivery status steps in order
const DELIVERY_STEPS = [
    { key: "CONFIRMED", label: "Pedido Confirmado", icon: CheckCircle2, color: "text-green-600" },
    { key: "IN_PRODUCTION", label: "Em Preparação", icon: Package, color: "text-orange-500" },
    { key: "SHIPPED", label: "Enviado", icon: Truck, color: "text-blue-600" },
    { key: "DELIVERED", label: "Entregue", icon: CheckCircle2, color: "text-purple-600" },
]

const STATUS_LABELS: Record<string, string> = {
    "PENDING_PAYMENT": "Aguardando Pagamento",
    "PAID": "Pago",
    "CONFIRMED": "Pedido Confirmado",
    "IN_PRODUCTION": "Em Preparação",
    "SHIPPED": "Enviado",
    "DELIVERED": "Entregue",
    "CANCELED": "Cancelado",
}

function getDeliveryStepIndex(status: string): number {
    return DELIVERY_STEPS.findIndex(s => s.key === status)
}

function isDeliveryStatus(status: string): boolean {
    return DELIVERY_STEPS.some(s => s.key === status)
}

export function OrdersManager() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState("all")
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [updatingStatus, setUpdatingStatus] = useState(false)

    useEffect(() => {
        fetchOrders()
    }, [statusFilter])

    const fetchOrders = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (statusFilter !== "all") params.append("status", statusFilter)

            const res = await fetch(`/api/admin/orders?${params.toString()}`)
            if (res.ok) {
                const data = await res.json()
                setOrders(data.orders || [])
            } else {
                toast.error("Erro ao carregar pedidos")
            }
        } catch (error) {
            console.error(error)
            toast.error("Erro ao carregar pedidos")
        } finally {
            setLoading(false)
        }
    }

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order)
        setDetailsOpen(true)
    }

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        setUpdatingStatus(true)
        try {
            const res = await fetch("/api/admin/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "update_status",
                    data: { orderIds: [orderId], status: newStatus },
                }),
            })

            if (res.ok) {
                toast.success(`Status atualizado para: ${STATUS_LABELS[newStatus] || newStatus}`)
                fetchOrders()
                if (selectedOrder?.id === orderId) {
                    setSelectedOrder({ ...selectedOrder, status: newStatus })
                }
            } else {
                toast.error("Erro ao atualizar status")
            }
        } catch (error) {
            console.error(error)
            toast.error("Erro ao atualizar status")
        } finally {
            setUpdatingStatus(false)
        }
    }



    const getStatusColor = (status: string) => {
        switch (status) {
            case "PAID": return "bg-green-100 text-green-800 border-green-200"
            case "CONFIRMED": return "bg-emerald-100 text-emerald-800 border-emerald-200"
            case "PENDING_PAYMENT": return "bg-yellow-100 text-yellow-800 border-yellow-200"
            case "CANCELED": return "bg-red-100 text-red-800 border-red-200"
            case "IN_PRODUCTION": return "bg-orange-100 text-orange-800 border-orange-200"
            case "SHIPPED": return "bg-blue-100 text-blue-800 border-blue-200"
            case "DELIVERED": return "bg-purple-100 text-purple-800 border-purple-200"
            default: return "bg-gray-100 text-gray-800 border-gray-200"
        }
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
    }

    const formatAddress = (addr: any) => {
        if (!addr) return null
        const parts = [addr.city, addr.state_code].filter(Boolean)
        return parts.join(" - ")
    }


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="PENDING_PAYMENT">Aguardando Pagamento</SelectItem>
                            <SelectItem value="PAID">Pago</SelectItem>
                            <SelectItem value="CONFIRMED">Pedido Confirmado</SelectItem>
                            <SelectItem value="IN_PRODUCTION">Em Preparação</SelectItem>
                            <SelectItem value="SHIPPED">Enviado</SelectItem>
                            <SelectItem value="DELIVERED">Entregue</SelectItem>
                            <SelectItem value="CANCELED">Cancelado</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={fetchOrders} title="Atualizar">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Localização</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                    <Spinner />
                                </TableCell>
                            </TableRow>
                        ) : orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    Nenhum pedido encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-mono text-xs">{order.external_id}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{order.customer_name}</span>
                                            <span className="text-xs text-muted-foreground">{order.customer_email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {order.shipping_address ? (
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-xs">
                                                        {order.shipping_address.city}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {order.shipping_address.state_code} - CEP {order.shipping_address.zip}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>{new Date(order.created_at).toLocaleDateString('pt-BR')}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={getStatusColor(order.status)}>
                                            {STATUS_LABELS[order.status] || order.status}
                                        </Badge>
                                        {order.payment_id && (
                                            <Badge variant="secondary" className="ml-2 text-[10px]">
                                                Stripe
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>{formatCurrency(order.total)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(order)} title="Ver detalhes">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Order Details Dialog */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detalhes do Pedido #{selectedOrder?.external_id}</DialogTitle>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="space-y-6">
                            {/* Customer + Address */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="bg-muted/30 rounded-lg p-4 border">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <div className="p-1.5 rounded-md bg-primary/10">
                                            <CreditCard className="h-4 w-4 text-primary" />
                                        </div>
                                        Cliente
                                    </h4>
                                    <div className="space-y-1">
                                        <p className="font-medium">{selectedOrder.customer_name}</p>
                                        <p className="text-muted-foreground">{selectedOrder.customer_email}</p>
                                        {selectedOrder.shipping_address?.phone && (
                                            <p className="text-muted-foreground">{selectedOrder.shipping_address.phone}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-muted/30 rounded-lg p-4 border">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <div className="p-1.5 rounded-md bg-blue-500/10">
                                            <MapPin className="h-4 w-4 text-blue-600" />
                                        </div>
                                        Endereço de Entrega
                                    </h4>
                                    {selectedOrder.shipping_address ? (
                                        <div className="space-y-1">
                                            <p className="font-medium">{selectedOrder.shipping_address.address1}</p>
                                            {selectedOrder.shipping_address.address2 && (
                                                <p className="text-muted-foreground">{selectedOrder.shipping_address.address2}</p>
                                            )}
                                            <p>{selectedOrder.shipping_address.city} - {selectedOrder.shipping_address.state_code}</p>
                                            <p className="text-muted-foreground">CEP: {selectedOrder.shipping_address.zip}</p>
                                            {selectedOrder.shipping_address.country_code && (
                                                <p className="text-muted-foreground text-xs">País: {selectedOrder.shipping_address.country_code}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground">Endereço não disponível</p>
                                    )}
                                </div>
                            </div>

                            {/* Delivery Status Tracker */}
                            {selectedOrder.status !== "CANCELED" && selectedOrder.status !== "PENDING_PAYMENT" && (
                                <div className="bg-muted/20 rounded-lg p-5 border">
                                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                                        <div className="p-1.5 rounded-md bg-green-500/10">
                                            <Truck className="h-4 w-4 text-green-600" />
                                        </div>
                                        Acompanhamento da Entrega
                                    </h4>

                                    {/* Stepper */}
                                    <div className="flex items-center justify-between relative">
                                        {/* Progress line background */}
                                        <div className="absolute top-5 left-[10%] right-[10%] h-1 bg-muted rounded-full" />

                                        {/* Progress line foreground */}
                                        {(() => {
                                            const currentIdx = selectedOrder.status === "PAID"
                                                ? -1
                                                : getDeliveryStepIndex(selectedOrder.status)
                                            const progress = currentIdx < 0 ? 0 : ((currentIdx) / (DELIVERY_STEPS.length - 1)) * 100
                                            return (
                                                <div
                                                    className="absolute top-5 left-[10%] h-1 bg-green-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${progress * 0.8}%` }}
                                                />
                                            )
                                        })()}

                                        {DELIVERY_STEPS.map((step, idx) => {
                                            const currentIdx = selectedOrder.status === "PAID"
                                                ? -1
                                                : getDeliveryStepIndex(selectedOrder.status)
                                            const isCompleted = currentIdx >= idx
                                            const isCurrent = currentIdx === idx
                                            const StepIcon = step.icon

                                            return (
                                                <div key={step.key} className="flex flex-col items-center relative z-10 flex-1">
                                                    <button
                                                        onClick={() => {
                                                            if (!updatingStatus) {
                                                                handleUpdateStatus(selectedOrder.id, step.key)
                                                            }
                                                        }}
                                                        disabled={updatingStatus}
                                                        className={`
                                                            w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 cursor-pointer
                                                            ${isCompleted
                                                                ? 'bg-green-500 border-green-500 text-white shadow-md shadow-green-200'
                                                                : isCurrent
                                                                    ? 'bg-white border-green-500 text-green-500'
                                                                    : 'bg-white border-gray-300 text-gray-400'
                                                            }
                                                            hover:scale-110 disabled:hover:scale-100
                                                        `}
                                                        title={`Definir como: ${step.label}`}
                                                    >
                                                        <StepIcon className="h-5 w-5" />
                                                    </button>
                                                    <span className={`text-[11px] mt-2 font-medium text-center leading-tight ${isCompleted ? 'text-green-700' : 'text-muted-foreground'
                                                        }`}>
                                                        {step.label}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>



                                    {selectedOrder.status === "DELIVERED" && (
                                        <div className="mt-4 text-center">
                                            <Badge className="bg-purple-100 text-purple-800 border-purple-200 px-4 py-1.5 text-sm font-medium">
                                                ✓ Pedido entregue com sucesso
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Canceled Warning */}
                            {selectedOrder.status === "CANCELED" && (
                                <div className="bg-red-50 rounded-lg p-4 border border-red-200 flex items-center gap-3">
                                    <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                                    <div>
                                        <p className="font-medium text-red-800">Pedido Cancelado</p>
                                        <p className="text-sm text-red-600">Este pedido foi cancelado e não pode ser atualizado.</p>
                                    </div>
                                </div>
                            )}

                            {/* Pending Payment Warning */}
                            {selectedOrder.status === "PENDING_PAYMENT" && (
                                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 flex items-center gap-3">
                                    <Clock className="h-5 w-5 text-yellow-600 shrink-0" />
                                    <div>
                                        <p className="font-medium text-yellow-800">Aguardando Pagamento</p>
                                        <p className="text-sm text-yellow-600">O pagamento ainda não foi confirmado para este pedido.</p>
                                    </div>
                                </div>
                            )}

                            {/* Payment Info */}
                            <div className="border rounded-md p-4 bg-muted/20">
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" /> Pagamento (Stripe)
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground block">Status do Pagamento:</span>
                                        <span className="font-medium">{selectedOrder.payment_status || 'Pendente'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block">ID da Transação:</span>
                                        <span className="font-mono text-xs">{selectedOrder.payment_id || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Items */}
                            <div>
                                <h4 className="font-semibold mb-2">Itens</h4>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Produto</TableHead>
                                            <TableHead>Qtd</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedOrder.items?.map((item: any) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        {item.product_variant?.product?.thumbnail_url && (
                                                            <img src={item.product_variant.product.thumbnail_url} className="w-8 h-8 rounded object-cover" />
                                                        )}
                                                        <div>
                                                            <p className="font-medium text-sm">{item.name}</p>
                                                            {item.product_variant && (
                                                                <p className="text-xs text-muted-foreground">Var ID: {item.product_variant.id.slice(0, 8)}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{item.quantity}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(item.total_price)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Footer: Status changer + Total */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t pt-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">Alterar Status:</span>
                                    <Select
                                        value={selectedOrder.status}
                                        onValueChange={(val) => handleUpdateStatus(selectedOrder.id, val)}
                                        disabled={updatingStatus}
                                    >
                                        <SelectTrigger className="w-[200px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PENDING_PAYMENT">Aguardando Pagamento</SelectItem>
                                            <SelectItem value="PAID">Pago</SelectItem>
                                            <SelectItem value="CONFIRMED">Pedido Confirmado</SelectItem>
                                            <SelectItem value="IN_PRODUCTION">Em Preparação</SelectItem>
                                            <SelectItem value="SHIPPED">Enviado</SelectItem>
                                            <SelectItem value="DELIVERED">Entregue</SelectItem>
                                            <SelectItem value="CANCELED">Cancelado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="text-right">
                                    {selectedOrder.shipping_cost > 0 && (
                                        <p className="text-xs text-muted-foreground mb-0.5">
                                            Frete: {formatCurrency(selectedOrder.shipping_cost)}
                                        </p>
                                    )}
                                    <div className="text-xl font-bold">
                                        Total: {formatCurrency(selectedOrder.total)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

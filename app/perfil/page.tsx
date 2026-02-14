"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { User, Package, MapPin, LogOut, Edit, Save } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { formatPhone, formatCEP } from '@/components/ui/inputMasks'

interface CustomerAddress {
  id: string
  type: 'shipping' | 'billing'
  name: string
  address1: string
  address2?: string
  city: string
  state_code: string
  country_code: string
  zip: string
  phone?: string
  is_default: boolean
  created_at: string
}

interface Order {
  id: string
  external_id: string
  status: string
  customer_name: string
  total: number
  created_at: string
  tracking_number?: string
  tracking_url?: string
}

function ProfileContent() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isAddingAddress, setIsAddingAddress] = useState(false)
  const [addresses, setAddresses] = useState<CustomerAddress[]>([])
  const [orders, setOrders] = useState<Order[]>([])

  // Form data
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
    avatar_url: ''
  })

  // New address form
  const [newAddress, setNewAddress] = useState({
    type: 'shipping' as 'shipping' | 'billing',
    name: '',
    address1: '',
    address2: '',
    city: '',
    state_code: '',
    zip: '',
    phone: '',
    is_default: false
  })

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        phone: formatPhone((user as any).phone || ''),
        avatar_url: (user as any).avatar_url || ''
      })
      fetchAddresses()
      fetchOrders()
    }
    setLoading(false)
  }, [user])

  // Auto-fill newAddress fields when CEP is entered
  useEffect(() => {
    const cep = (newAddress.zip || '').replace(/\D/g, '')
    if (cep.length !== 8) return

    const fetchAddress = async () => {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        if (!res.ok) {
          toast.error('Erro ao buscar CEP')
          return
        }
        const data = await res.json()
        if (data.erro) {
          toast.error('CEP não encontrado')
          return
        }

        setNewAddress(prev => ({
          ...prev,
          address1: data.logradouro || prev.address1,
          city: data.localidade || prev.city,
          state_code: data.uf || prev.state_code,
          address2: data.complemento || prev.address2,
        }))

        toast.success('Endereço encontrado!')
      } catch (e) {
        console.error('Erro ao buscar CEP (perfil):', e)
        toast.error('Erro ao buscar CEP')
      }
    }

    fetchAddress()
  }, [newAddress.zip])

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/user/addresses')
      if (res.ok) {
        const data = await res.json()
        setAddresses(data.addresses || [])
      }
    } catch (error) {
      console.error('Error fetching addresses:', error)
    }
  }

  const fetchOrders = async () => {
    try {
      // TODO: Implementar API para buscar pedidos do usuário
      // const res = await fetch('/api/user/orders')
      // if (res.ok) {
      //   const data = await res.json()
      //   setOrders(data.orders || [])
      // }
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const handleUpdateProfile = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      })

      if (res.ok) {
        toast.success('Perfil atualizado com sucesso!')
      } else {
        throw new Error('Falha ao atualizar perfil')
      }
    } catch (error) {
      console.error('Update profile error:', error)
      toast.error('Falha ao atualizar perfil')
    } finally {
      setSaving(false)
    }
  }

  const handleAddAddress = async () => {
    // Prevent submission unless CEP is filled
    const cepDigits = (newAddress.zip || '').replace(/\D/g, '')
    if (cepDigits.length !== 8) {
      toast.error('Informe o CEP válido antes de adicionar o endereço')
      return
    }

    setIsAddingAddress(true)
    try {
      const res = await fetch('/api/user/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddress)
      })

      const payload = await res.text()
      let body: any = null
      try { body = JSON.parse(payload) } catch { body = payload }

      if (res.ok) {
        toast.success('Endereço adicionado com sucesso!')
        setNewAddress({
          type: 'shipping',
          name: '',
          address1: '',
          address2: '',
          city: '',
          state_code: '',
          zip: '',
          phone: '',
          is_default: false
        })
        fetchAddresses()
      } else {
        // Specific handling when DB table missing
        const errorMessage = (body && body.error) ? String(body.error) : String(payload || 'Erro desconhecido')
        if (errorMessage.includes('customer_addresses') || errorMessage.includes('Tabela')) {
          toast.error('Erro no servidor: tabela de endereços ausente. Rode as migrations (scripts/09-create-auth-tables.sql) no seu banco Supabase.')
          console.error('Server table missing error:', errorMessage)
        } else if (body && body.details) {
          const messages = (body.details || []).map((d: any) => `${d.field}: ${d.message}`).join('\n')
          toast.error(`Falha ao adicionar endereço:\n${messages}`)
          console.warn('Address API validation details:', body.details)
        } else if (body && body.error) {
          toast.error(String(body.error))
        } else {
          toast.error('Falha ao adicionar endereço')
        }
      }
    } catch (error) {
      console.error('Add address error:', error)
      toast.error('Falha ao adicionar endereço')
    } finally {
      setIsAddingAddress(false)
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    try {
      const res = await fetch(`/api/user/addresses/${addressId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Endereço excluído com sucesso!')
        fetchAddresses()
      } else {
        throw new Error('Falha ao excluir endereço')
      }
    } catch (error) {
      console.error('Delete address error:', error)
      toast.error('Falha ao excluir endereço')
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'pending_payment': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-green-100 text-green-800',
      'in_production': 'bg-blue-100 text-blue-800',
      'shipped': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-emerald-100 text-emerald-800',
      'canceled': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const formatStatus = (status: string) => {
    const labels: Record<string, string> = {
      'pending_payment': 'Pagamento Pendente',
      'paid': 'Pago',
      'in_production': 'Em Produção',
      'shipped': 'Enviado',
      'delivered': 'Entregue',
      'canceled': 'Cancelado'
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-muted rounded-lg h-64"></div>
                <div className="bg-muted rounded-lg h-64"></div>
              </div>
              <div className="bg-muted rounded-lg h-96"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Meu Perfil</h1>
            <p className="text-muted-foreground">
              Gerencie suas informações e preferências
            </p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                Dados Pessoais
              </TabsTrigger>
              <TabsTrigger value="addresses">
                <MapPin className="h-4 w-4 mr-2" />
                Endereços
              </TabsTrigger>
              <TabsTrigger value="orders">
                <Package className="h-4 w-4 mr-2" />
                Pedidos
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>
                    Atualize seus dados pessoais e informações de contato
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nome Completo</Label>
                      <Input
                        id="full_name"
                        value={profileData.full_name}
                        onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={user?.email || ''}
                        disabled
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                      onInput={(e) => {
                        const input = e.currentTarget as HTMLInputElement
                        input.value = formatPhone(input.value)
                        setProfileData({ ...profileData, phone: input.value })
                      }}
                    />
                  </div>
                  <Button onClick={handleUpdateProfile} disabled={saving}>
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Addresses Tab */}
            <TabsContent value="addresses">
              <div className="space-y-6">
                {/* Add New Address */}
                <Card>
                  <CardHeader>
                    <CardTitle>Adicionar Endereço</CardTitle>
                    <CardDescription>
                      Adicione um novo endereço para entrega ou cobrança
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="address_type">Tipo</Label>
                        <select
                          id="address_type"
                          value={newAddress.type}
                          onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value as 'shipping' | 'billing' })}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="shipping">Entrega</option>
                          <option value="billing">Cobrança</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address_name">Nome do Destinatário</Label>
                        <Input
                          id="address_name"
                          value={newAddress.name}
                          onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address1">Endereço</Label>
                      <Input
                        id="address1"
                        value={newAddress.address1}
                        onChange={(e) => setNewAddress({ ...newAddress, address1: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address2">Complemento</Label>
                      <Input
                        id="address2"
                        value={newAddress.address2}
                        onChange={(e) => setNewAddress({ ...newAddress, address2: e.target.value })}
                        placeholder="Apto, casa, etc."
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">Cidade</Label>
                        <Input
                          id="city"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">Estado</Label>
                        <Input
                          id="state"
                          value={newAddress.state_code}
                          onChange={(e) => setNewAddress({ ...newAddress, state_code: e.target.value })}
                          placeholder="SP"
                          maxLength={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zip">CEP</Label>
                        <Input
                          id="zip"
                          value={newAddress.zip}
                          onChange={(e) => setNewAddress(prev => ({ ...prev, zip: e.target.value }))}
                          placeholder="00000-000"
                          onInput={(e) => {
                            const input = e.currentTarget as HTMLInputElement
                            input.value = formatCEP(input.value)
                            setNewAddress(prev => ({ ...prev, zip: input.value }))
                            // debug
                            console.debug('perfil: zip input changed ->', input.value)
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address_phone">Telefone</Label>
                      <Input
                        id="address_phone"
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(00) 00000-0000"
                        onInput={(e) => {
                          const input = e.currentTarget as HTMLInputElement
                          input.value = formatPhone(input.value)
                          setNewAddress(prev => ({ ...prev, phone: input.value }))
                        }}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_default"
                        checked={newAddress.is_default}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, is_default: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="is_default">Endereço padrão</Label>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button onClick={handleAddAddress} disabled={isAddingAddress || ((newAddress.zip || '').replace(/\D/g,'').length !== 8)}>
                        {isAddingAddress ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Adicionando...
                          </>
                        ) : (
                          'Adicionar Endereço'
                        )}
                      </Button>
                      {((newAddress.zip || '').replace(/\D/g,'').length !== 8) && (
                        <span className="text-sm text-muted-foreground">Digite o CEP primeiro para preencher o endereço</span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Existing Addresses */}
                {addresses.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Meus Endereços</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {addresses.map((address) => (
                          <div key={address.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium">{address.name}</h4>
                                  {address.is_default && (
                                    <Badge variant="secondary">Padrão</Badge>
                                  )}
                                  <Badge variant="outline">
                                    {address.type === 'shipping' ? 'Entrega' : 'Cobrança'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {address.address1}
                                  {address.address2 && `, ${address.address2}`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {address.city}, {address.state_code} - {address.zip}
                                </p>
                                {address.phone && (
                                  <p className="text-sm text-muted-foreground">
                                    Telefone: {address.phone}
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteAddress(address.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Excluir
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Meus Pedidos</CardTitle>
                  <CardDescription>
                    Acompanhe o status dos seus pedidos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {orders.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pedido</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Rastreamento</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">
                              #{order.external_id}
                            </TableCell>
                            <TableCell>
                              {new Date(order.created_at).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusBadge(order.status)}>
                                {formatStatus(order.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>R$ {order.total.toFixed(2)}</TableCell>
                            <TableCell>
                              {order.tracking_number ? (
                                <a
                                  href={order.tracking_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  {order.tracking_number}
                                </a>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Você ainda não fez nenhum pedido.
                      </p>
                      <Button className="mt-4" asChild>
                        <a href="/loja">Fazer Pedido</a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Sign Out Button */}
          <div className="mt-8 pt-8 border-t">
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="text-red-600 hover:text-red-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair da Conta
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  )
}


"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { fetchWithAuth } from "@/lib/utils/fetch"
import {
  LayoutDashboard,
  ShoppingBag,
  Plus,
  Trash2,
  Package,
  LogOut,
  Image as ImageIcon,
  ArrowLeft,
  GripVertical,
  Pencil,
  Truck
} from "lucide-react"
import { BannersManager } from "@/components/admin/banners-manager"
import { OrdersManager } from "@/components/admin/orders-manager"
import { CategoriesManager } from "@/components/admin/categories-manager"
import { ShippingManager } from "@/components/admin/shipping-manager"
import { ImageUpload } from "@/components/admin/image-upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import type { Product, Category } from "@/lib/store/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState("products")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [newProductOpen, setNewProductOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [categories, setCategories] = useState<Category[]>([])

  // New Product Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    imageUrl: '',
    category_id: '',
    is_featured: false
  })

  // Fetch initial data
  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Erro ao carregar categorias:", error)
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth('/api/admin/products')
      if (res.ok) {
        const data = await res.json()
        setProducts(Array.isArray(data.products) ? data.products : [])
      }
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
      toast.error("Erro ao carregar produtos.")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const url = editingId ? `/api/admin/products/${editingId}` : '/api/admin/products'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug || formData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
          description: formData.description,
          price: parseFloat(formData.price.toString().replace('.', '').replace(',', '.')),
          thumbnail_url: formData.imageUrl,
          images: [formData.imageUrl],
          category_id: formData.category_id || null,
          is_active: true,
          is_featured: formData.is_featured
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(editingId ? "Produto atualizado com sucesso!" : "Produto criado com sucesso!")
        setNewProductOpen(false)
        setFormData({ name: '', slug: '', description: '', price: '', imageUrl: '', category_id: '', is_featured: false })
        setEditingId(null)
        fetchProducts()
      } else if (res.status === 409) {
        toast.warning("Produto duplicado!", {
          description: "Já existe um produto com este nome ou slug. Tente alterar o nome.",
          duration: 6000,
        })
      } else {
        toast.error(data.error || "Erro ao salvar produto")
      }
    } catch (error) {
      console.error(error)
      toast.error("Erro ao salvar produto")
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingId(product.id)
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      price: (product.price || product.variants?.[0]?.retail_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      imageUrl: product.thumbnail_url || product.images?.[0] || '',
      category_id: product.category_id || '',
      is_featured: product.is_featured
    })
    setNewProductOpen(true)
  }

  const handleDeleteProduct = (id: string) => {
    toast.warning("Deseja excluir este produto?", {
      description: "Esta ação não pode ser desfeita.",
      duration: 8000,
      action: {
        label: "Confirmar Exclusão",
        onClick: async () => {
          try {
            const res = await fetchWithAuth(`/api/admin/products/${id}`, {
              method: 'DELETE',
            })

            if (res.ok) {
              toast.success("Produto excluído com sucesso!")
              fetchProducts()
            } else {
              const data = await res.json()
              toast.error(data.error || "Erro ao excluir produto")
            }
          } catch (e) {
            console.error('Delete error:', e)
            toast.error("Erro ao excluir produto")
          }
        },
      },
      cancel: {
        label: "Cancelar",
        onClick: () => { },
      },
    })
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      onLogout()
    } catch (error) {
      console.error('Logout error:', error)
      onLogout()
    }
  }

  return (
    <div className="min-h-screen bg-muted/20 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col fixed inset-y-0">
        <div className="p-6 border-b border-border">
          <h1 className="font-serif font-black text-2xl text-primary">LIBRÁS<span className="text-foreground text-sm block font-sans font-normal tracking-wide">Admin</span></h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Button variant={activeTab === 'products' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('products')}>
            <ShoppingBag className="mr-2 h-4 w-4" /> Produtos
          </Button>
          <Button variant={activeTab === 'orders' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('orders')}>
            <Package className="mr-2 h-4 w-4" /> Pedidos
          </Button>
          <Button variant={activeTab === 'banners' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('banners')}>
            <ImageIcon className="mr-2 h-4 w-4" /> Banners
          </Button>
          <Button variant={activeTab === 'categories' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('categories')}>
            <GripVertical className="mr-2 h-4 w-4" /> Categorias
          </Button>
          <Button variant={activeTab === 'shipping' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActiveTab('shipping')}>
            <Truck className="mr-2 h-4 w-4" /> Frete
          </Button>
        </nav>
        <div className="p-4 border-t border-border space-y-2">
          <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/'}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar à Loja
          </Button>

          <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-serif font-bold">Produtos</h2>
                <Dialog open={newProductOpen} onOpenChange={(open) => {
                  setNewProductOpen(open)
                  if (!open) {
                    setEditingId(null)
                    setFormData({ name: '', slug: '', description: '', price: '', imageUrl: '', category_id: '', is_featured: false })
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 text-white">
                      <Plus className="mr-2 h-4 w-4" /> Novo Produto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>{editingId ? "Editar Produto" : "Adicionar Novo Produto"}</DialogTitle>
                      <DialogDescription>
                        {editingId ? "Edite os detalhes do produto abaixo." : "Adicione um novo produto ao catálogo manualmente."}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveProduct} className="space-y-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Nome do Produto</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="slug">Slug (URL)</Label>
                        <Input
                          id="slug"
                          value={formData.slug}
                          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                          placeholder="Auto-gerado se vazio"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="price">Preço (R$)</Label>
                          <Input
                            id="price"
                            type="text"
                            inputMode="decimal"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            placeholder="0,00"
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="category">Categoria</Label>
                          <Select
                            value={formData.category_id}
                            onValueChange={(val) => setFormData({ ...formData, category_id: val })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((c) => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="featured"
                          checked={formData.is_featured}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                        />
                        <Label htmlFor="featured">Produto em Destaque?</Label>
                      </div>
                      <div className="grid gap-2">
                        <ImageUpload
                          value={formData.imageUrl}
                          onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                          disabled={isCreating}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Textarea
                          id="description"
                          rows={3}
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={isCreating}>
                          {isCreating ? 'Salvando...' : 'Salvar Produto'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Imagem</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell>
                        </TableRow>
                      ) : products.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum produto encontrado.</TableCell>
                        </TableRow>
                      ) : (
                        products.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>
                              <div className="relative w-12 h-12 bg-muted rounded overflow-hidden">
                                {(product.thumbnail_url || product.images?.[0]) ? (
                                  <img src={product.thumbnail_url || product.images?.[0]} alt={product.name} className="object-cover w-full h-full" />
                                ) : (
                                  <ImageIcon className="w-6 h-6 m-auto text-muted-foreground opacity-50 absolute inset-0 translate-y-1/2 translate-x-1/2" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price || product.variants?.[0]?.retail_price || 0)}
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-xs font-bold ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {product.is_active ? 'Ativo' : 'Inativo'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => handleEditProduct(product)}>
                                <Pencil className="w-4 h-4 text-blue-500" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-serif font-bold">Gerenciar Pedidos</h2>
              <OrdersManager />
            </div>
          )}
          {activeTab === 'banners' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-serif font-bold">Gerenciar Banners</h2>
              <BannersManager />
            </div>
          )}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-serif font-bold">Gerenciar Categorias</h2>
              <CategoriesManager />
            </div>
          )}
          {activeTab === 'shipping' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-serif font-bold">Gerenciar Frete</h2>
              <ShippingManager />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

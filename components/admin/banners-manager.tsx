"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"
import { Trash2, Plus } from "lucide-react"
import { ImageUpload } from "@/components/admin/image-upload"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Banner {
    id: string
    title: string
    image_url: string
    active: boolean
}

export function BannersManager() {
    const [banners, setBanners] = useState<Banner[]>([])
    const [loading, setLoading] = useState(true)
    const [title, setTitle] = useState("")
    const [imageUrl, setImageUrl] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [bannerToDelete, setBannerToDelete] = useState<string | null>(null)

    useEffect(() => {
        fetchBanners()
    }, [])

    const fetchBanners = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/admin/banners')
            if (res.ok) {
                const data = await res.json()
                setBanners(data || [])
            }
        } catch (error) {
            console.error('Error fetching banners:', error)
            toast.error("Erro ao carregar banners")
        } finally {
            setLoading(false)
        }
    }

    const handleAddBanner = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title || !imageUrl) {
            toast.error("Preencha todos os campos")
            return
        }

        setIsSubmitting(true)
        try {
            const res = await fetch('/api/admin/banners', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, image_url: imageUrl, active: true })
            })

            if (res.ok) {
                toast.success("Banner adicionado!")
                setTitle("")
                setImageUrl("")
                fetchBanners()
            } else {
                const data = await res.json()
                toast.error(data.error || "Erro ao adicionar banner")
            }
        } catch (error) {
            console.error(error)
            toast.error("Erro ao adicionar banner")
        } finally {
            setIsSubmitting(false)
        }
    }

    const executeDelete = async () => {
        if (!bannerToDelete) return

        try {
            const res = await fetch(`/api/admin/banners?id=${bannerToDelete}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                toast.success("Banner removido!")
                fetchBanners()
            } else {
                toast.error("Erro ao remover banner")
            }
        } catch (error) {
            console.error(error)
            toast.error("Erro ao remover banner")
        } finally {
            setBannerToDelete(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="bg-card p-6 rounded-lg border shadow-sm">
                <h3 className="text-lg font-bold mb-4">Adicionar Novo Banner</h3>
                <form onSubmit={handleAddBanner} className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                        <label className="text-sm font-medium">Título</label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Promoção de Verão"
                        />
                    </div>

                    <div className="flex-1 space-y-2">
                        <label className="text-sm font-medium">Imagem do Banner</label>
                        <ImageUpload
                            value={imageUrl}
                            onChange={(url: string) => setImageUrl(url)}
                            disabled={isSubmitting}
                        />
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Spinner className="mr-2" /> : <Plus className="mr-2 h-4 w-4" />}
                        Adicionar
                    </Button>
                </form>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {banners.map((banner) => (
                    <div key={banner.id} className="group relative bg-muted rounded-lg overflow-hidden border aspect-video">
                        <img
                            src={banner.image_url}
                            alt={banner.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button variant="destructive" size="sm" onClick={() => setBannerToDelete(banner.id)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remover
                            </Button>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 text-white text-xs font-medium truncate">
                            {banner.title}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="col-span-full flex justify-center py-10">
                        <Spinner size="lg" />
                    </div>
                )}
                {banners.length === 0 && !loading && (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        Nenhum banner cadastrado.
                    </div>
                )}
            </div>

            <AlertDialog open={!!bannerToDelete} onOpenChange={(open) => !open && setBannerToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Banner</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir este banner? Esta ação não pode ser desfeita e ele deixará de aparecer na página inicial.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Home, ArrowLeft } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

function UnauthorizedContent() {
  const { user } = useAuth()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold mb-4">Acesso Negado</h1>

          {/* Message */}
          <p className="text-muted-foreground mb-8">
            {user ? (
              <>
                Olá, <strong>{user.full_name || user.email}</strong>! <br />
                Você não tem permissão para acessar esta área do sistema.
              </>
            ) : (
              <>
                Você precisa estar logado para acessar esta área.
              </>
            )}
          </p>

          {/* Actions */}
          <div className="space-y-4">
            {user ? (
              <div className="space-y-3">
                <Button onClick={() => router.back()} variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button onClick={() => router.push('/')} className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Página Inicial
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Button asChild className="w-full">
                  <Link href="/login">
                    Fazer Login
                  </Link>
                </Button>
                <Button onClick={() => router.push('/')} variant="outline" className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Página Inicial
                </Button>
              </div>
            )}
          </div>

          {/* Help Text */}
          <div className="mt-12 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium mb-2">Precisa de ajuda?</h3>
            <p className="text-sm text-muted-foreground">
              Se você acredita que deveria ter acesso a esta área, entre em contato com o administrador do sistema.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function UnauthorizedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <UnauthorizedContent />
    </Suspense>
  )
}

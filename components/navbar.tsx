"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useSearchParams } from "next/navigation"
import { Menu, X, Search, User, LogOut, ShoppingBag, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { CartIcon, CartDrawer } from "@/components/ecommerce/Cart"
import { useCart } from "@/hooks/use-shopping-cart"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion, AnimatePresence } from "framer-motion"

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { openCart } = useCart()
  const { user, signOut } = useAuth()

  // Detect scroll for transparent/solid background
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks = [
    { name: "Início", href: "/" },
    { name: "Todos os Produtos", href: "/loja" },
    { name: "Novidades", href: "/loja?sort=newest" },
    { name: "Destaques", href: "/loja?featured=true" },
  ]

  const isActive = (href: string) => {
    if (href === "/" && pathname !== "/") return false

    // Check for query params match
    if (href.includes('?')) {
      const [path, query] = href.split('?')
      if (pathname !== path) return false

      const linkParams = new URLSearchParams(query)
      for (const [key, value] of Array.from(linkParams.entries())) {
        if (searchParams.get(key) !== value) return false
      }
      return true
    }

    // For plain links (like /loja), ensure no conflicting params from other tabs exist
    if (href === '/loja') {
      if (pathname !== href) return false
      if (searchParams.get('featured') === 'true') return false
      if (searchParams.get('sort') === 'newest') return false
      return true
    }

    return pathname.startsWith(href)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }



  return (
    <>
      <nav
        className="relative z-40 bg-background border-b border-border/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-3 group"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Image
                src="/logo2.png"
                alt="Librás"
                width={120}
                height={40}
                className="object-contain"
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative text-sm font-bold uppercase tracking-wide hover:text-primary transition-colors py-2 ${isActive(link.href) ? "text-primary" : "text-foreground/80"
                    }`}
                >
                  {link.name}
                  {isActive(link.href) && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {/* Search Toggle (Optional implementation later) */}
              {/* Search Toggle */}
              {searchOpen ? (
                <form onSubmit={(e) => {
                  e.preventDefault()
                  if (searchQuery.trim()) {
                    router.push(`/loja?search=${encodeURIComponent(searchQuery)}`)
                    setSearchOpen(false)
                  }
                }} className="relative flex items-center">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar..."
                    className="w-32 sm:w-64 bg-background border border-input rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                    onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                  />
                  <button type="submit" className="absolute right-2 text-primary">
                    <Search className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2 hover:bg-accent/10 rounded-lg transition-colors cursor-pointer text-foreground/80 hover:text-primary"
                  aria-label="Buscar"
                >
                  <Search className="w-5 h-5 cursor-pointer" />
                </button>
              )}

              {/* Cart */}
              <CartIcon />

              {/* User Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      {user.full_name || user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/perfil" className="w-full cursor-pointer">
                        Meu Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/pedidos" className="w-full cursor-pointer">
                        Meus Pedidos
                      </Link>
                    </DropdownMenuItem>
                    {(user.role === 'admin' || user.role === 'manager') && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="w-full cursor-pointer font-semibold text-primary">
                            <Settings className="mr-2 h-4 w-4" />
                            Painel Admin
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/login">
                      Entrar
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/signup">
                      Cadastrar
                    </Link>
                  </Button>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-accent/10 rounded-lg transition-colors"
                aria-label="Menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden bg-background border-b border-border"
            >
              <div className="px-4 py-6 space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block text-lg font-bold uppercase tracking-wide hover:text-primary transition-colors ${isActive(link.href) ? "text-primary pl-2 border-l-4 border-primary" : "text-foreground/80"
                      }`}
                  >
                    {link.name}
                  </Link>
                ))}

                <div className="pt-4 border-t border-border space-y-2">
                  {user ? (
                    <>
                      <div className="px-2">
                        <p className="text-sm text-muted-foreground">
                          Logado como: {user.full_name || user.email}
                        </p>
                      </div>
                      <Link
                        href="/perfil"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-2 text-sm text-muted-foreground hover:text-foreground"
                      >
                        Meu Perfil
                      </Link>
                      <Link
                        href="/pedidos"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-2 text-sm text-muted-foreground hover:text-foreground"
                      >
                        Meus Pedidos
                      </Link>
                      {(user.role === 'admin' || user.role === 'manager') && (
                        <Link
                          href="/admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 px-2 text-sm font-semibold text-primary hover:text-primary/80"
                        >
                          <Settings className="h-4 w-4" />
                          Painel Admin
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          handleSignOut()
                          setMobileMenuOpen(false)
                        }}
                        className="block w-full text-left px-2 text-sm text-red-600 hover:text-red-700"
                      >
                        Sair
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-2 text-sm text-muted-foreground hover:text-foreground"
                      >
                        Entrar
                      </Link>
                      <Link
                        href="/signup"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-2 text-sm text-muted-foreground hover:text-foreground"
                      >
                        Cadastrar
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Cart Drawer Component */}
      <CartDrawer />
    </>
  )
}

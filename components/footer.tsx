import Link from "next/link"
import Image from "next/image"
import { Facebook, Instagram, MessageCircle } from "lucide-react"

const WHATSAPP_NUMBER = "5562982714849"

const getWhatsAppUrl = (message: string) => {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}

const INSTAGRAM_URL = "https://www.instagram.com/libras.casadaslixas/"
const FACEBOOK_URL = "https://www.facebook.com/p/Libr%C3%A1s-A-Casa-Das-Lixas-100064505036066/"

const navLinks = [
  { name: "Início", href: "/" },
  { name: "Todos os Produtos", href: "/loja" },
  { name: "Novidades", href: "/loja?sort=newest" },
  { name: "Destaques", href: "/loja?featured=true" },
]

const supportLinks = [
  { name: "Dúvidas Frequentes", message: "Olá! Tenho algumas dúvidas sobre os produtos da Librás." },
  { name: "Frete e Entrega", message: "Olá! Gostaria de informações sobre frete e prazo de entrega." },
  { name: "Trocas e Devoluções", message: "Olá! Gostaria de informações sobre a política de trocas e devoluções." },
  { name: "Fale Conosco", message: "Olá! Gostaria de falar com um atendente da Librás." },
]

export function Footer() {
  return (
    <footer className="bg-card text-card-foreground border-t border-border pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-4 group">
              <Image
                src="/logo2.png"
                alt="Librás"
                width={120}
                height={40}
                className="object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Soluções abrasivas de alta performance para indústria, marcenaria, marmoraria, cutelaria, vidraçaria, metalurgia, fabrica de panelas, funilaria/pintura e construção civil. Precisão e durabilidade em cada grão.
            </p>
            <div className="flex gap-4">
              <SocialLink href={INSTAGRAM_URL} icon={<Instagram className="w-5 h-5" />} label="Instagram" />
              <SocialLink href={FACEBOOK_URL} icon={<Facebook className="w-5 h-5" />} label="Facebook" />
              <SocialLink href={getWhatsAppUrl("Olá! Gostaria de falar com a Librás.")} icon={<MessageCircle className="w-5 h-5" />} label="WhatsApp" />
            </div>
          </div>

          {/* Navigation Links - same as navbar */}
          <div>
            <h4 className="font-bold uppercase tracking-wider mb-6 text-foreground">Loja</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-primary transition-colors font-medium">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support with specific WhatsApp links */}
          <div>
            <h4 className="font-bold uppercase tracking-wider mb-6 text-foreground">Suporte</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={getWhatsAppUrl(link.message)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors flex items-center gap-2 font-medium"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground text-center md:text-left">
            © {new Date().getFullYear()} Librás. Todos os direitos reservados.
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">Privacidade</Link>
            <Link href="/terms" className="hover:text-foreground">Termos</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

function SocialLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="p-2 bg-muted rounded-full text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300"
      aria-label={label}
    >
      {icon}
    </a>
  )
}

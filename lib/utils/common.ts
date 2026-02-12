import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatDate(date: string | number | Date) {
    return new Intl.DateTimeFormat("pt-BR", {
        month: "long",
        day: "numeric",
        year: "numeric",
    }).format(new Date(date))
}

export function formatPrice(amount: number) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(amount)
}

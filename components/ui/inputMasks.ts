export function formatPhone(value: string) {
  const d = (value || '').replace(/\D/g, '')
  if (!d) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7,11)}`
}

export function formatCEP(value: string) {
  const d = (value || '').replace(/\D/g, '')
  if (!d) return ''
  if (d.length <= 5) return d
  return `${d.slice(0,5)}-${d.slice(5,8)}`
}

export function formatCPF(value: string) {
  const d = (value || '').replace(/\D/g, '')
  if (!d) return ''
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9,11)}`
}

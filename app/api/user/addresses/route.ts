/**
 * GET /api/user/addresses - Listar endereços do usuário
 * POST /api/user/addresses - Criar novo endereço
 */

import { NextResponse } from 'next/server'
import { getCustomerAddresses, upsertAddress } from '@/lib/auth/service'
import { withCustomerAuth } from '@/lib/auth/middleware'
import { z } from 'zod'

const AddressSchema = z.object({
  type: z.enum(['shipping', 'billing']),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  address1: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  address2: z.string().optional(),
  city: z.string().min(2, 'Cidade deve ter pelo menos 2 caracteres'),
  state_code: z.string().length(2, 'Estado deve ter 2 caracteres'),
  country_code: z.string().default('BR'),
  zip: z.string().min(8, 'CEP inválido'),
  phone: z.string().optional(),
  is_default: z.boolean().default(false),
})

// GET - Listar endereços
export const GET = withCustomerAuth(async (request: Request) => {
  try {
    const addresses = await getCustomerAddresses()

    return NextResponse.json({
      success: true,
      addresses
    })

  } catch (error) {
    console.error('[User API] Get addresses error:', error)
    const message = (error instanceof Error && error.message) ? error.message : 'Falha ao obter endereços'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
})

// POST - Criar endereço
export const POST = withCustomerAuth(async (request: Request) => {
  try {
    const body = await request.json()
    const addressData = AddressSchema.parse(body)

    const newAddress = await upsertAddress(addressData)

    return NextResponse.json({
      success: true,
      message: 'Endereço criado com sucesso',
      address: newAddress
    })

  } catch (error) {
    console.error('[User API] Create address error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          }))
        },
        { status: 400 }
      )
    }
    const message = (error instanceof Error && error.message) ? error.message : 'Falha ao criar endereço'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
})

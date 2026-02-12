/**
 * PUT /api/user/addresses/[id] - Atualizar endereço
 * DELETE /api/user/addresses/[id] - Excluir endereço
 */

import { NextResponse } from 'next/server'
import { upsertAddress, deleteAddress } from '@/lib/auth/service'
import { withCustomerAuth } from '@/lib/auth/middleware'
import { z } from 'zod'

const UpdateAddressSchema = z.object({
  type: z.enum(['shipping', 'billing']).optional(),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  address1: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres').optional(),
  address2: z.string().optional(),
  city: z.string().min(2, 'Cidade deve ter pelo menos 2 caracteres').optional(),
  state_code: z.string().length(2, 'Estado deve ter 2 caracteres').optional(),
  country_code: z.string().optional(),
  zip: z.string().min(8, 'CEP inválido').optional(),
  phone: z.string().optional(),
  is_default: z.boolean().optional(),
})

// PUT - Atualizar endereço
export const PUT = withCustomerAuth(async (request: Request, { params }: { params: { id: string } }) => {
  try {
    const body = await request.json()
    const updates = UpdateAddressSchema.parse(body)
    const addressId = params.id

    const updatedAddress = await upsertAddress({
      ...updates,
      id: addressId,
    } as any)

    return NextResponse.json({
      success: true,
      message: 'Endereço atualizado com sucesso',
      address: updatedAddress
    })

  } catch (error) {
    console.error('[User API] Update address error:', error)
    
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

    return NextResponse.json(
      { error: 'Falha ao atualizar endereço' },
      { status: 500 }
    )
  }
})

// DELETE - Excluir endereço
export const DELETE = withCustomerAuth(async (request: Request, { params }: { params: { id: string } }) => {
  try {
    const addressId = params.id

    await deleteAddress(addressId)

    return NextResponse.json({
      success: true,
      message: 'Endereço excluído com sucesso'
    })

  } catch (error) {
    console.error('[User API] Delete address error:', error)
    
    return NextResponse.json(
      { error: 'Falha ao excluir endereço' },
      { status: 500 }
    )
  }
})

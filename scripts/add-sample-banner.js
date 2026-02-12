#!/usr/bin/env node

/**
 * Script para adicionar um banner de exemplo ao sistema
 * Execute: node scripts/add-sample-banner.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addSampleBanner() {
  try {
    console.log('🚀 Adicionando banner de exemplo...')
    
    // URL do banner SVG que criamos
    const bannerUrl = '/monster-cave-banner-simple.svg'
    
    const { data, error } = await supabase
      .from('slider_images')
      .insert({
        image_url: bannerUrl,
        display_order: 0
      })
      .select()

    if (error) {
      console.error('❌ Erro ao adicionar banner:', error.message)
      
      // Se a tabela não existir, vamos criar
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('📝 Tabela não encontrada. Execute o SQL do arquivo scripts/setup-supabase.sql no Supabase')
      }
      return
    }

    console.log('✅ Banner adicionado com sucesso!')
    console.log('📋 Banner:', data[0])
    console.log('\n🎉 Agora você pode:')
    console.log('1. Acessar http://localhost:3000/admin')
    console.log('2. Ir para aba "Banners"')
    console.log('3. Ver o banner de exemplo')
    console.log('4. Acessar http://localhost:3000 para ver na página principal')
    
  } catch (err) {
    console.error('❌ Erro:', err.message)
  }
}

addSampleBanner()

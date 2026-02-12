#!/usr/bin/env node

/**
 * Script to create Supabase storage buckets
 * Run with: node scripts/create-buckets.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  console.log('\nCurrent values:')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing')
  process.exit(1)
}

console.log('🔗 Supabase URL:', supabaseUrl)
console.log('🔑 Service Key length:', supabaseServiceKey.length)

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testConnection() {
  try {
    console.log('\n🔍 Testing Supabase connection...')
    const { data, error } = await supabase.from('slider_images').select('count')

    if (error) {
      console.error('❌ Connection test failed:', error.message)
      return false
    }

    console.log('✅ Connection successful')
    return true
  } catch (err) {
    console.error('❌ Connection test exception:', err.message)
    return false
  }
}

async function createBuckets() {
  console.log('\n🚀 Creating Supabase storage buckets...')

  const buckets = [
    {
      id: 'images',
      name: 'images',
      public: true,
      file_size_limit: 5242880, // 5MB
      allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    },
    {
      id: 'uploads',
      name: 'uploads',
      public: true,
      file_size_limit: 5242880, // 5MB
      allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    },
    {
      id: 'products',
      name: 'products',
      public: true,
      file_size_limit: 5242880, // 5MB
      allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    }
  ]

  for (const bucket of buckets) {
    try {
      console.log(`📦 Creating bucket: ${bucket.name}`)

      // Try to create bucket with minimal options first
      const { data, error } = await supabase.storage.createBucket(bucket.id, {
        public: bucket.public,
        fileSizeLimit: bucket.file_size_limit
      })

      if (error) {
        if (error.message.includes('already exists')) {
          console.log(`✅ Bucket "${bucket.name}" already exists`)
        } else {
          console.error(`❌ Error creating bucket "${bucket.name}":`, error.message)
          console.error('   Full error:', error)
        }
      } else {
        console.log(`✅ Bucket "${bucket.name}" created successfully`)
        console.log('   Bucket data:', data)
      }
    } catch (err) {
      console.error(`❌ Exception creating bucket "${bucket.name}":`, err.message)
    }
  }
}

async function listBuckets() {
  try {
    console.log('\n📋 Current buckets:')
    const { data, error } = await supabase.storage.listBuckets()

    if (error) {
      console.error('❌ Error listing buckets:', error.message)
      return
    }

    if (data && data.length > 0) {
      data.forEach(bucket => {
        console.log(`  - ${bucket.name} (public: ${bucket.public})`)
      })
    } else {
      console.log('  No buckets found')
    }
  } catch (err) {
    console.error('❌ Exception listing buckets:', err.message)
  }
}

async function main() {
  try {
    const connectionOk = await testConnection()
    if (!connectionOk) {
      console.log('\n💡 Please check your Supabase credentials and try again')
      console.log('   You may need to:')
      console.log('   1. Generate a new service role key in Supabase dashboard')
      console.log('   2. Ensure the key has proper permissions')
      console.log('   3. Copy the key correctly to your .env file')
      process.exit(1)
    }

    await createBuckets()
    await listBuckets()

    console.log('\n🎉 Setup process completed!')
    console.log('\n📋 Next steps:')
    console.log('1. Run the SQL script in scripts/setup-supabase.sql in your Supabase SQL Editor')
    console.log('2. Restart your development server')
    console.log('3. Test uploading a banner in the admin panel')
  } catch (error) {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  }
}

main()

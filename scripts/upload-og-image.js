const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function uploadOgImage() {
  const imagePath = path.join(process.cwd(), 'public', 'og-image.png');
  const imageBuffer = fs.readFileSync(imagePath);

  console.log('Uploading OG image to Supabase Storage...');

  const { data, error } = await supabase.storage
    .from('static-assets')
    .upload('og-image.png', imageBuffer, {
      contentType: 'image/png',
      upsert: true,
    });

  if (error) {
    console.error('Error uploading image:', error);
    process.exit(1);
  }

  const { data: publicUrlData } = supabase.storage
    .from('static-assets')
    .getPublicUrl('og-image.png');

  console.log('✅ OG image uploaded successfully!');
  console.log('Public URL:', publicUrlData.publicUrl);
  console.log('\nUpdate your env.local with:');
  console.log(`NEXT_PUBLIC_OG_IMAGE_URL="${publicUrlData.publicUrl}"`);
}

uploadOgImage();

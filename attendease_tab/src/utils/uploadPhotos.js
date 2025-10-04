import { supabase } from '../config/supabase.config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Upload student photos to Supabase Storage
 * Run this once to upload all photos
 */

const students = [
  { id: '2021-00001', filename: 'christian_esguerra.jpg' },
  { id: '2021-00002', filename: 'moises_sy.jpg' },
  { id: '2021-00003', filename: 'maria_sophea_balidio.jpg' },
  { id: '2021-00004', filename: 'suzanne_rosco.jpg' }
];

async function uploadPhotos() {
  console.log('Starting photo upload to Supabase Storage...\n');

  const photosDir = path.join(__dirname, '../../photos');
  const bucketName = 'student-photos';

  for (const student of students) {
    try {
      const filePath = path.join(photosDir, student.filename);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${student.filename}`);
        continue;
      }

      // Read file
      const fileBuffer = fs.readFileSync(filePath);
      const storagePath = `${student.id}_${student.filename}`;

      console.log(`Uploading: ${student.filename}...`);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(storagePath, fileBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(storagePath);

      console.log(`Uploaded: ${publicUrl}`);

      // Update user record with photo URL
      const { error: updateError } = await supabase
        .from('users')
        .update({ photo_url: publicUrl })
        .eq('id', student.id);

      if (updateError) throw updateError;

      console.log(`Updated database for student ${student.id}\n`);

    } catch (error) {
      console.error(`Error uploading ${student.filename}:`, error.message);
    }
  }

  console.log('Photo upload complete!');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  uploadPhotos().then(() => {
    console.log('\nAll photos uploaded successfully!');
    process.exit(0);
  }).catch((error) => {
    console.error('\nUpload failed:', error);
    process.exit(1);
  });
}

export default uploadPhotos;


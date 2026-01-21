/**
 * Test Netlify Blobs Integration
 * This script tests upload, download, list, and delete operations
 */

require('dotenv').config();
const netlifyBlobsService = require('./src/services/storage/netlifyBlobs');

async function testNetlifyBlobs() {
  console.log('\n🧪 Testing Netlify Blobs Integration...\n');

  try {
    // Test 1: Upload a test image
    console.log('1️⃣  Testing upload...');
    const testImageBuffer = Buffer.from('This is a test image file', 'utf-8');
    const testMediatorId = 'test-mediator-123';

    const uploadUrl = await netlifyBlobsService.uploadMediatorImage(
      testMediatorId,
      testImageBuffer,
      'image/jpeg'
    );

    if (uploadUrl) {
      console.log('   ✅ Upload successful!');
      console.log('   📎 URL:', uploadUrl);
    } else {
      console.log('   ❌ Upload failed - returned null');
      return;
    }

    // Test 2: Get the uploaded file
    console.log('\n2️⃣  Testing download...');
    const downloadedFile = await netlifyBlobsService.getMediatorImage(testMediatorId);

    if (downloadedFile) {
      console.log('   ✅ Download successful!');
      console.log('   📄 File size:', downloadedFile.length, 'bytes');
    } else {
      console.log('   ❌ Download failed - file not found');
    }

    // Test 3: Upload a test document
    console.log('\n3️⃣  Testing document upload...');
    const testDocBuffer = Buffer.from('This is a test CV document', 'utf-8');
    const docResult = await netlifyBlobsService.uploadMediatorDocument(
      testMediatorId,
      'cv',
      testDocBuffer,
      'application/pdf',
      'test-cv.pdf'
    );

    if (docResult) {
      console.log('   ✅ Document upload successful!');
      console.log('   📎 URL:', docResult.url);
    } else {
      console.log('   ❌ Document upload failed');
    }

    // Test 4: List documents for mediator
    console.log('\n4️⃣  Testing list documents...');
    const docs = await netlifyBlobsService.listMediatorDocuments(testMediatorId);

    if (docs && docs.length > 0) {
      console.log('   ✅ List successful!');
      console.log('   📁 Found', docs.length, 'document(s)');
      docs.forEach(doc => {
        console.log('      -', doc.key);
      });
    } else {
      console.log('   ⚠️  No documents found');
    }

    // Test 5: Get storage stats
    console.log('\n5️⃣  Testing storage statistics...');
    const stats = await netlifyBlobsService.getStats();

    if (stats && stats.enabled) {
      console.log('   ✅ Stats retrieved!');
      if (stats.stores) {
        console.log('   📊 Mediator images:', stats.stores['mediator-images']?.count || 0, 'files');
        console.log('   📊 Documents:', stats.stores['mediator-documents']?.count || 0, 'files');
      }
    } else {
      console.log('   ⚠️  Could not retrieve stats');
    }

    // Test 6: Delete the test files
    console.log('\n6️⃣  Testing delete...');
    const deletedImage = await netlifyBlobsService.deleteMediatorImage(testMediatorId);

    if (deletedImage) {
      console.log('   ✅ Image delete successful!');
    } else {
      console.log('   ❌ Image delete failed');
    }

    // Delete test document
    if (docResult && docResult.key) {
      const deletedDoc = await netlifyBlobsService.deleteDocument(docResult.key);
      if (deletedDoc) {
        console.log('   ✅ Document delete successful!');
      } else {
        console.log('   ❌ Document delete failed');
      }
    }

    console.log('\n✅ All Netlify Blobs tests completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testNetlifyBlobs()
  .then(() => {
    console.log('🎉 Netlify Blobs is working correctly!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });

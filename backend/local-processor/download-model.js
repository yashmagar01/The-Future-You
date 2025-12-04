// download-model.js - Run once to pre-download the emotion model
const { pipeline } = require('@xenova/transformers');

async function downloadModel() {
  console.log('Downloading emotion model... This may take a few minutes.');
  console.log('Model: Xenova/twitter-roberta-base-emotion-multilabel-latest (~100MB)');
  
  try {
    // This will download and cache the model
    const classifier = await pipeline(
      'text-classification',
      'Xenova/twitter-roberta-base-emotion-multilabel-latest',
      { quantized: true }
    );
    
    // Test it
    const result = await classifier('Hello, I am happy today!', { topk: null });
    console.log('\n✅ Model downloaded and working!');
    console.log('Test result:', result);
    console.log('\nModel cached at: ~/.cache/huggingface/');
    
  } catch (error) {
    console.error('\n❌ Failed to download model:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check your internet connection');
    console.log('2. Temporarily disable Windows Firewall/Defender');
    console.log('3. If using VPN, try disconnecting');
  }
}

downloadModel();

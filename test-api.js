const axios = require('axios');

// Test the API endpoints
async function testAPI() {
  const baseURL = 'https://sparkle-pro.co.uk/api';
  
  try {
    // Test health endpoint
    console.log('Testing health endpoint...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('Health check:', healthResponse.data);
    
    // Test gadgets endpoint
    console.log('\nTesting gadgets endpoint...');
    const gadgetsResponse = await axios.get(`${baseURL}/gadgets`);
    console.log('Gadgets count:', gadgetsResponse.data.count);
    
    // Test categories endpoint
    console.log('\nTesting categories endpoint...');
    const categoriesResponse = await axios.get(`${baseURL}/gadgets/categories`);
    console.log('Categories:', categoriesResponse.data.data.length);
    
    console.log('\n✅ All API tests passed!');
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testAPI();
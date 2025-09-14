const axios = require('axios');
const mongoose = require('mongoose');

// Test actual bet placement with cartela data from database
async function testActualBetPrinting() {
  console.log('🧪 Testing Actual Bet Placement with Cartela Data...');
  
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bingo-system';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
         // Import models
     const { Cartela } = require('./src/models/Cartela');
     const Cashier = require('./src/models/Cashier').default;
    
    // Get a sample cashier
    const cashier = await Cashier.findOne({ isActive: true });
    if (!cashier) {
      console.error('❌ No active cashier found');
      return;
    }
    
    console.log(`👤 Using cashier: ${cashier.fullName} (${cashier.username})`);
    
    // Get sample cartelas for this cashier
    const cartelas = await Cartela.find({ 
      cashierId: cashier._id.toString(),
      isActive: true 
    }).limit(3);
    
    if (cartelas.length === 0) {
      console.error('❌ No cartelas found for this cashier');
      return;
    }
    
    console.log(`📋 Found ${cartelas.length} cartelas`);
    
    // Test printing tickets for each cartela
    for (let i = 0; i < cartelas.length; i++) {
      const cartela = cartelas[i];
      console.log(`\n🖨️ Testing cartela ${cartela.cartelaId}...`);
      
      // Convert 2D pattern to 1D array
      const cartelaNumbers = cartela.pattern.flat();
      console.log(`📊 Cartela numbers: ${cartelaNumbers.join(', ')}`);
      
      // Format the ticket content
      const cartelaGrid = formatCartelaGrid(cartelaNumbers);
      const dateTime = new Date().toISOString().replace('T', ' ').replace('Z', ' (UTC)');
      const ticketNumber = (i + 1).toString().padStart(13, '0');
      
      const ticketContent = `${ticketNumber}
${cashier.fullName}
${cashier.username}
${dateTime}
Bingo #4017 #${cartela.cartelaId} #Stack : Br 5.00
${cartelaGrid}
${ticketNumber}`;
      
      console.log('📄 Ticket content:');
      console.log(ticketContent);
      
      // Send to printer
      const response = await axios.post('http://localhost:6060/print', {
        jobId: `actual-bet-${Date.now()}-${i}`,
        type: 'ticket',
        content: ticketContent
      }, {
        timeout: 30000
      });
      
      console.log(`✅ Cartela ${cartela.cartelaId} printed successfully:`, response.status);
      
      // Wait between prints
      if (i < cartelas.length - 1) {
        console.log('⏳ Waiting 2 seconds before next print...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('\n✅ All actual bet tickets printed successfully!');
    console.log('📋 Check your printer for the tickets with real cartela data');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  } finally {
    // Close MongoDB connection
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Format cartela numbers into a 5x5 grid with asterisk for zero
function formatCartelaGrid(numbers) {
  if (!numbers || numbers.length !== 25) {
    return 'Numbers: ' + numbers.join(', ');
  }
  
  let grid = '';
  for (let i = 0; i < 5; i++) {
    const row = numbers.slice(i * 5, (i + 1) * 5);
    grid += row.map(num => num === 0 ? '*' : num.toString().padStart(2, '0')).join(' ') + '\n';
  }
  return grid;
}

// Run the test
testActualBetPrinting();

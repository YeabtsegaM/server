const axios = require('axios');

// Simple test for Bingo ticket printing with correct format
async function simpleBingoTest() {
  console.log('🧪 Simple Bingo Ticket Test...');
  
  try {
    console.log('🖨️ Sending Bingo ticket with correct format...');
    
    // Format the ticket content properly
    const cartelaNumbers = [10, 17, 38, 57, 64, 14, 25, 37, 51, 61, 8, 16, 0, 56, 66, 9, 29, 36, 53, 68, 4, 24, 39, 52, 62];
    const cartelaGrid = formatCartelaGrid(cartelaNumbers);
    const dateTime = new Date().toISOString().replace('T', ' ').replace('Z', ' (UTC)');
    
    const ticketContent = `0000000000001
Yeabtsega
yeab
${dateTime}
Bingo #4017 #1 #Stack : Br 5.00
${cartelaGrid}
0000000000001`;
    
    const response = await axios.post('http://localhost:6060/print', {
      jobId: `bingo-simple-${Date.now()}`,
      type: 'ticket', // Use 'ticket' type
      content: ticketContent
    }, {
      timeout: 60000 // 60 second timeout
    });
    
    console.log('✅ Bingo ticket printed successfully!');
    console.log('📋 Check your printer for the ticket');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNABORTED') {
      console.error('❌ Request timed out after 60 seconds');
    }
  }
}

// Format cartela numbers into a 5x5 grid with asterisk for zero
function formatCartelaGrid(numbers) {
  if (!numbers || numbers.length !== 25) {
    // If no numbers provided, use default cartela numbers
    const defaultNumbers = [10, 17, 38, 57, 64, 14, 25, 37, 51, 61, 8, 16, 0, 56, 66, 9, 29, 36, 53, 68, 4, 24, 39, 52, 62];
    return formatGrid(defaultNumbers);
  }
  
  return formatGrid(numbers);
}

// Format numbers into a 5x5 grid
function formatGrid(numbers) {
  let grid = '';
  for (let i = 0; i < 5; i++) {
    const row = numbers.slice(i * 5, (i + 1) * 5);
    grid += row.map(num => num === 0 ? '*' : num.toString().padStart(2, '0')).join(' ') + '\n';
  }
  return grid;
}

simpleBingoTest();
import { connectDatabase } from '../config/database';
import { WinPattern } from '../models/WinPattern';

const samplePatterns = [
  {
    name: 'Horizontal Line',
    pattern: [
      [true, true, true, true, true],
      [false, false, false, false, false],
      [false, false, true, false, false],
      [false, false, false, false, false],
      [false, false, false, false, false]
    ],
    isActive: true,
    cashierId: '688c98726b1ae86d79e4e3cb', // alicebrown
    shopId: 'shop1'
  },
  {
    name: 'Vertical Line',
    pattern: [
      [true, false, false, false, false],
      [true, false, false, false, false],
      [true, false, true, false, false],
      [true, false, false, false, false],
      [true, false, false, false, false]
    ],
    isActive: true,
    cashierId: '688c98726b1ae86d79e4e3cb', // alicebrown
    shopId: 'shop1'
  },
  {
    name: 'Diagonal (Top-Left to Bottom-Right)',
    pattern: [
      [true, false, false, false, false],
      [false, true, false, false, false],
      [false, false, true, false, false],
      [false, false, false, true, false],
      [false, false, false, false, true]
    ],
    isActive: true,
    cashierId: '688c98726b1ae86d79e4e3cd', // bobdavis
    shopId: 'shop1'
  },
  {
    name: 'Cross Pattern',
    pattern: [
      [false, false, true, false, false],
      [false, false, true, false, false],
      [true, true, true, true, true],
      [false, false, true, false, false],
      [false, false, true, false, false]
    ],
    isActive: true,
    cashierId: '688c98726b1ae86d79e4e3cd', // bobdavis
    shopId: 'shop1'
  },
  {
    name: 'Corner Pattern',
    pattern: [
      [true, false, false, false, true],
      [false, false, false, false, false],
      [false, false, true, false, false],
      [false, false, false, false, false],
      [true, false, false, false, true]
    ],
    isActive: true,
    cashierId: '688c98736b1ae86d79e4e3cf', // carolwhite
    shopId: 'shop1'
  }
];

async function seedWinPatterns() {
  try {
    await connectDatabase();
    
    // Clear existing patterns
    await WinPattern.deleteMany({});
    
    // Insert sample patterns
    const createdPatterns = await WinPattern.insertMany(samplePatterns);
    
    // Seeded win patterns successfully
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding win patterns:', error);
    process.exit(1);
  }
}

seedWinPatterns(); 
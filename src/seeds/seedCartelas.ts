import mongoose from 'mongoose';
import { Cartela } from '../models/Cartela';
import Cashier from '../models/Cashier';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bingo2025';

async function seedCartelas() {
  try {
        await mongoose.connect(MONGODB_URI);

    // Get cashier IDs from the database
    const cashiers = await Cashier.find({}).select('_id username').lean();

    if (cashiers.length === 0) {
      return;
    }

    // Clear existing cartelas
    await Cartela.deleteMany({});

    const sampleCartelas = [];

    // Create sample cartelas for each cashier
    for (const cashier of cashiers) {
      // Create 5 sample cartelas per cashier
      for (let i = 1; i <= 5; i++) {
        const cartelaId = i;
        
        // Generate a BINGO pattern following rules
        // B (1-15): First column (0)
        // I (16-30): Second column (1) 
        // N (31-45): Third column (2) - except center
        // G (46-60): Fourth column (3)
        // O (61-75): Fifth column (4)
        
        const bNumbers = Array.from({ length: 15 }, (_, i) => i + 1);
        const iNumbers = Array.from({ length: 15 }, (_, i) => i + 16);
        const nNumbers = Array.from({ length: 15 }, (_, i) => i + 31);
        const gNumbers = Array.from({ length: 15 }, (_, i) => i + 46);
        const oNumbers = Array.from({ length: 15 }, (_, i) => i + 61);
        
        // Shuffle each column's numbers
        const shuffleArray = (arr: number[]) => arr.sort(() => Math.random() - 0.5);
        const shuffledB = shuffleArray([...bNumbers]);
        const shuffledI = shuffleArray([...iNumbers]);
        const shuffledN = shuffleArray([...nNumbers]);
        const shuffledG = shuffleArray([...gNumbers]);
        const shuffledO = shuffleArray([...oNumbers]);
        
        const pattern = Array(5).fill(null).map((_, rowIndex) =>
          Array(5).fill(null).map((_, colIndex) => {
            if (rowIndex === 2 && colIndex === 2) return 0; // Center is free space
            if (colIndex === 0) return shuffledB[rowIndex]; // B column
            if (colIndex === 1) return shuffledI[rowIndex]; // I column
            if (colIndex === 2) return shuffledN[rowIndex]; // N column
            if (colIndex === 3) return shuffledG[rowIndex]; // G column
            if (colIndex === 4) return shuffledO[rowIndex]; // O column
            return 0;
          })
        );

        sampleCartelas.push({
          cartelaId,
          pattern,
          isActive: true, // All cartelas are active by default
          cashierId: cashier._id?.toString() || '',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    // Insert sample cartelas
    const result = await Cartela.insertMany(sampleCartelas);
  } catch (error) {
    console.error('Error seeding cartelas:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the seed function
seedCartelas(); 
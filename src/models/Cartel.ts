import mongoose, { Schema, Document } from 'mongoose';

export interface ICartela extends Document {
  cartelaId: number; // 1-210
  pattern: number[][]; // 5x5 grid with numbers 1-75 (BINGO numbers)
  isActive: boolean;
  cashierId: string;
  shopId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CartelaSchema = new Schema<ICartela>({
  cartelaId: {
    type: Number,
    required: true,
    min: 1,
    max: 210,
    unique: false // Not unique globally, but unique per cashier
  },
  pattern: {
    type: [[Number]],
    required: true,
    validate: {
      validator: function(pattern: number[][]) {
        // Must be 5x5 grid
        if (!Array.isArray(pattern) || pattern.length !== 5) return false;
        if (!pattern.every(row => Array.isArray(row) && row.length === 5)) return false;
        
        // Center cell (2,2) must be 0 (free space)
        if (pattern[2][2] !== 0) return false;
        
        // Validate BINGO rules
        // B (1-15): First column (0)
        // I (16-30): Second column (1) 
        // N (31-45): Third column (2) - except center
        // G (46-60): Fourth column (3)
        // O (61-75): Fifth column (4)
        
        for (let i = 0; i < 5; i++) {
          for (let j = 0; j < 5; j++) {
            if (i === 2 && j === 2) continue; // Skip center
            const cell = pattern[i][j];
            
            // Validate based on column position
            if (j === 0 && (cell < 1 || cell > 15)) return false; // B column
            if (j === 1 && (cell < 16 || cell > 30)) return false; // I column
            if (j === 2 && (cell < 31 || cell > 45)) return false; // N column
            if (j === 3 && (cell < 46 || cell > 60)) return false; // G column
            if (j === 4 && (cell < 61 || cell > 75)) return false; // O column
          }
        }
        
        return true;
      },
      message: 'Pattern must be a 5x5 grid with center as 0 (free space) and follow BINGO rules: B(1-15), I(16-30), N(31-45), G(46-60), O(61-75)'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  cashierId: {
    type: String,
    required: true,
    index: true
  },
  shopId: {
    type: String,
    index: true
  }
}, {
  timestamps: true
});

// Compound index to ensure cartelaId is unique per cashier
CartelaSchema.index({ cashierId: 1, cartelaId: 1 }, { unique: true });

// Index for active cartelas
CartelaSchema.index({ cashierId: 1, isActive: 1 });

export const Cartela = mongoose.model<ICartela>('Cartela', CartelaSchema); 
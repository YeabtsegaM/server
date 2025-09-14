"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const WinPattern_1 = require("../models/WinPattern");
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
        await (0, database_1.connectDatabase)();
        // Clear existing patterns
        await WinPattern_1.WinPattern.deleteMany({});
        // Insert sample patterns
        const createdPatterns = await WinPattern_1.WinPattern.insertMany(samplePatterns);
        // Seeded win patterns successfully
        process.exit(0);
    }
    catch (error) {
        console.error('Error seeding win patterns:', error);
        process.exit(1);
    }
}
seedWinPatterns();
//# sourceMappingURL=seedWinPatterns.js.map
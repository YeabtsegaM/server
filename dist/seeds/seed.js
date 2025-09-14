"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Admin_1 = __importDefault(require("../models/Admin"));
const ShopOwner_1 = __importDefault(require("../models/ShopOwner"));
const Cashier_1 = __importDefault(require("../models/Cashier"));
const Shop_1 = __importDefault(require("../models/Shop"));
dotenv_1.default.config();
async function seedData() {
    try {
        // Connect to MongoDB
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bingo2025');
        // Clear all collections
        await Admin_1.default.deleteMany({});
        await ShopOwner_1.default.deleteMany({});
        await Shop_1.default.deleteMany({});
        await Cashier_1.default.deleteMany({});
        // Create system admin user
        const systemAdmin = new Admin_1.default({
            username: 'systemadmin',
            password: 'admin123',
            fullName: 'System Administrator',
            role: 'systemadmin',
            isActive: true
        });
        await systemAdmin.save();
        // Create additional admin users for testing
        const additionalAdmins = [
            {
                username: 'admin1',
                password: 'password123',
                fullName: 'John Admin',
                role: 'admin',
                isActive: true
            },
            {
                username: 'shopadmin1',
                password: 'password123',
                fullName: 'Sarah Shop Admin',
                role: 'shopadmin',
                isActive: true
            },
            {
                username: 'superagent1',
                password: 'password123',
                fullName: 'Mike Super Agent',
                role: 'superagent',
                isActive: true
            },
            {
                username: 'admin2',
                password: 'password123',
                fullName: 'David Admin',
                role: 'admin',
                isActive: false
            }
        ];
        for (const adminData of additionalAdmins) {
            const additionalAdmin = new Admin_1.default(adminData);
            await additionalAdmin.save();
        }
        // Create sample shop owners
        const shopOwners = [
            {
                username: 'johnsmith',
                password: 'password123',
                firstName: 'John',
                lastName: 'Smith',
                isActive: true
            },
            {
                username: 'janedoe',
                password: 'password123',
                firstName: 'Jane',
                lastName: 'Doe',
                isActive: true
            },
            {
                username: 'mikejohnson',
                password: 'password123',
                firstName: 'Mike',
                lastName: 'Johnson',
                isActive: true
            }
        ];
        const createdShopOwners = [];
        for (const ownerData of shopOwners) {
            const owner = new ShopOwner_1.default(ownerData);
            await owner.save();
            createdShopOwners.push(owner);
        }
        // Create sample shops with new model structure
        const shops = [
            {
                shopName: 'South Plaza Bingo',
                location: '789 South Road, South District',
                owner: createdShopOwners[0]._id,
                margin: 10,
                billingType: 'prepaid',
                prepaidBalance: 50000,
                status: 'active',
                bingoGameNumber: 4000
            },
            {
                shopName: 'North Center Bingo',
                location: '456 North Street, North District',
                owner: createdShopOwners[1]._id,
                margin: 15,
                billingType: 'postpaid',
                prepaidBalance: 0,
                status: 'active',
                bingoGameNumber: 4000
            },
            {
                shopName: 'East Side Gaming',
                location: '321 East Avenue, East District',
                owner: createdShopOwners[2]._id,
                margin: 12,
                billingType: 'prepaid',
                prepaidBalance: 60000,
                status: 'active',
                bingoGameNumber: 4000
            }
        ];
        const createdShops = [];
        for (const shopData of shops) {
            const shop = new Shop_1.default(shopData);
            await shop.save();
            createdShops.push(shop);
        }
        // Create sample cashiers
        const cashiers = [
            {
                username: 'alicebrown',
                password: 'password123',
                fullName: 'Alice Brown',
                shop: createdShops[0]._id,
                isActive: true
            },
            {
                username: 'bobdavis',
                password: 'password123',
                fullName: 'Bob Davis',
                shop: createdShops[0]._id,
                isActive: true
            },
            {
                username: 'carolwhite',
                password: 'password123',
                fullName: 'Carol White',
                shop: createdShops[1]._id,
                isActive: true
            },
            {
                username: 'davidgreen',
                password: 'password123',
                fullName: 'David Green',
                shop: createdShops[2]._id,
                isActive: true
            }
        ];
        for (const cashierData of cashiers) {
            const cashier = new Cashier_1.default(cashierData);
            await cashier.save();
        }
    }
    catch (error) {
        console.error('Error seeding data:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
    }
}
seedData();
//# sourceMappingURL=seed.js.map
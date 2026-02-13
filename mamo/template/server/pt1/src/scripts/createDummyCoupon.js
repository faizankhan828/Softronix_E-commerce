const mongoose = require('mongoose');
const Coupon = require('../models/Coupon');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/')
  .then(async () => {
    try {
      // Check if coupon already exists
      const existingCoupon = await Coupon.findOne({ code: 'DISCOUNT10' });
      
      if (existingCoupon) {
        console.log('Coupon DISCOUNT10 already exists');
      } else {
        // Create a new coupon
        const coupon = new Coupon({
          code: 'DISCOUNT10',
          description: '10% off your order',
          type: 'percentage',
          value: 10,
          minPurchase: 50,
          maxDiscount: 100,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          isActive: true,
          usageLimit: 100,
          usageCount: 0
        });
        
        await coupon.save();
        console.log('Coupon DISCOUNT10 created successfully');
      }
      
      // Create another coupon with usage stats
      const existingFreeCoupon = await Coupon.findOne({ code: 'FREESHIP' });
      
      if (existingFreeCoupon) {
        console.log('Coupon FREESHIP already exists');
      } else {
        const freeCoupon = new Coupon({
          code: 'FREESHIP',
          description: 'Free shipping on your order',
          type: 'shipping',
          value: 10,
          minPurchase: 75,
          startDate: new Date(),
          endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
          isActive: true,
          usageLimit: 50,
          usageCount: 25 // 50% used
        });
        
        await freeCoupon.save();
        console.log('Coupon FREESHIP created successfully');
      }
      
      // Create a limited time coupon
      const existingLimitedCoupon = await Coupon.findOne({ code: 'FLASH25' });
      
      if (existingLimitedCoupon) {
        console.log('Coupon FLASH25 already exists');
      } else {
        const limitedCoupon = new Coupon({
          code: 'FLASH25',
          description: '25% off your order - Limited time offer!',
          type: 'percentage',
          value: 25,
          minPurchase: 100,
          maxDiscount: 200,
          startDate: new Date(),
          endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          isActive: true,
          usageLimit: 20,
          usageCount: 5
        });
        
        await limitedCoupon.save();
        console.log('Coupon FLASH25 created successfully');
      }
      
    } catch (error) {
      console.error('Error creating coupons:', error);
    } finally {
      mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected for seeding orders'))
  .catch(err => console.error('MongoDB connection error:', err));

// Sample user IDs - we'll check if these exist
const userIds = [
  '1', '2', '3', '4', '5'
];

// Sample product IDs - we'll check if these exist
const productIds = [
  '1', '2', '3', '4', '5'
];

// Function to generate a random date within the last 30 days
const getRandomRecentDate = () => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime()));
};

// Function to get random items from an array
const getRandomItems = (array, min = 1, max = 3) => {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Function to create sample orders
const createSampleOrders = async () => {
  try {
    // Check if we already have orders
    const orderCount = await Order.countDocuments();
    if (orderCount > 0) {
      console.log(`Database already has ${orderCount} orders. Skipping seed.`);
      return;
    }

    // Get actual users from database
    const users = await User.find({}).limit(10);
    const actualUserIds = users.map(user => user._id.toString());
    
    // Get actual products from database
    const products = await Product.find({}).limit(10);
    const actualProductIds = products.map(product => product._id.toString());

    // If we don't have users or products, we can't create orders
    if (actualUserIds.length === 0) {
      console.log('No users found in database. Cannot create sample orders.');
      return;
    }

    if (actualProductIds.length === 0) {
      console.log('No products found in database. Cannot create sample orders.');
      return;
    }

    // Create sample orders
    const sampleOrders = [];

    // Create 20 sample orders
    for (let i = 0; i < 20; i++) {
      // Get random user
      const userId = actualUserIds[Math.floor(Math.random() * actualUserIds.length)];
      
      // Get 1-3 random products
      const orderProducts = getRandomItems(products, 1, 3);
      
      // Create order items
      const items = orderProducts.map(product => {
        const quantity = Math.floor(Math.random() * 3) + 1;
        const price = product.price || 29.99;
        
        return {
          productId: product._id.toString(),
          quantity,
          price,
          size: ['S', 'M', 'L', 'XL'][Math.floor(Math.random() * 4)],
          color: ['Black', 'White', 'Blue', 'Red', 'Green'][Math.floor(Math.random() * 5)],
          product: {
            id: product._id.toString(),
            name: product.name || 'Product Name',
            price: product.price || 29.99,
            image: product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/150',
          }
        };
      });
      
      // Calculate order totals
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tax = parseFloat((subtotal * 0.08).toFixed(2));
      const shippingCost = subtotal > 100 ? 0 : 10;
      const total = parseFloat((subtotal + tax + shippingCost).toFixed(2));
      
      // Create order
      const order = {
        userId,
        items,
        shippingAddress: {
          name: 'John Doe',
          addressLine1: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          postalCode: '12345',
          country: 'USA',
          phone: '555-123-4567',
        },
        billingAddress: {
          name: 'John Doe',
          addressLine1: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          postalCode: '12345',
          country: 'USA',
          phone: '555-123-4567',
        },
        paymentMethod: ['credit_card', 'paypal', 'cash_on_delivery'][Math.floor(Math.random() * 3)],
        paymentDetails: {},
        subtotal,
        tax,
        shippingCost,
        total,
        status: ['pending', 'processing', 'shipped', 'delivered'][Math.floor(Math.random() * 4)],
        notes: '',
        trackingNumber: Math.random().toString(36).substring(2, 10).toUpperCase(),
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        createdAt: getRandomRecentDate(),
        updatedAt: new Date(),
      };
      
      sampleOrders.push(order);
    }
    
    // Insert orders into database
    await Order.insertMany(sampleOrders);
    console.log(`Successfully created ${sampleOrders.length} sample orders.`);
  } catch (error) {
    console.error('Error creating sample orders:', error);
  } finally {
    // Disconnect from MongoDB
    mongoose.disconnect();
    console.log('MongoDB disconnected after seeding orders');
  }
};

// Run the function
createSampleOrders();

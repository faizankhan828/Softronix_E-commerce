# E-Commerce Server

This is the backend server for the e-commerce application, providing RESTful API endpoints for the frontend.

## Project Structure

The project follows the MVC (Model-View-Controller) architecture with a clean separation of concerns:

```
server/
├── index.js             # Main server entry point
├── .env                 # Environment variables
├── package.json         # Node.js dependencies
├── src/
│   ├── controllers/     # Business logic controllers
│   ├── middleware/      # Express middleware functions
│   ├── models/          # MongoDB/Mongoose data models
│   └── routes/          # API route definitions
```

## Architecture

- **Models**: Define the data structure and schema for MongoDB using Mongoose
- **Controllers**: Contain the business logic for handling requests
- **Routes**: Define the API endpoints and connect them to the appropriate controllers
- **Middleware**: Implement authentication and other cross-cutting concerns

## Available API Endpoints

- **Authentication**: `/api/auth` - Register, login, password reset
- **Products**: `/api/products` - Product listings, search, and details
- **Cart**: `/api/cart` - Shopping cart management
- **Wishlist**: `/api/wishlist` - User wishlist operations
- **Orders**: `/api/orders` - Order processing and history
- **Users**: `/api/users` - User profile management
- **Coupons**: `/api/coupons` - Discount coupon operations

## Getting Started

1. Install dependencies:

   ```
   npm install
   ```

2. Create a `.env` file with the following variables:

   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017
   JWT_SECRET=your_secret_key
   ```

3. Start the server:
   ```
   npm start
   ```

## Development

For development with automatic restart:

```
npm run dev
```

## Mock Data

The server uses mock data when MongoDB is not available. This is useful for development and testing.

## Technologies Used

- Express.js
- MongoDB / Mongoose
- JSON Web Tokens (JWT)
- bcrypt (for password hashing)

# MongoDB Setup Guide

This application uses MongoDB to store room and booking data. Follow these steps to set up MongoDB:

## 1. Install MongoDB

### Option A: MongoDB Atlas (Cloud - Recommended)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster
4. Get your connection string from the "Connect" button
5. Replace `<password>` with your database password

### Option B: Local MongoDB
1. Install MongoDB locally from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/hotel-booking`

## 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hotel-booking?retryWrites=true&w=majority
```

Or for local MongoDB:

```env
MONGODB_URI=mongodb://localhost:27017/hotel-booking
```

## 3. Run the Application

```bash
npm run dev
```

The application will automatically connect to MongoDB when you make your first API request.

## API Endpoints

### Rooms
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/[id]` - Get single room
- `POST /api/rooms` - Create new room
- `PUT /api/rooms/[id]` - Update room
- `DELETE /api/rooms/[id]` - Delete room

### Bookings
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/[id]` - Get single booking
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/[id]` - Update booking
- `DELETE /api/bookings/[id]` - Delete booking
- `PATCH /api/bookings/[id]/cancel` - Cancel booking

## Database Models

### Room
- roomNumber (String, unique, required)
- roomType (String, required)
- price (Number, required)
- capacity (Number, required)
- amenities (Array of Strings)
- description (String, required)
- status (Enum: available, occupied, maintenance)
- createdAt, updatedAt (auto-generated)

### Booking
- roomId (ObjectId, reference to Room)
- roomNumber (String, required)
- customerName (String, required)
- customerEmail (String, required, validated)
- customerPhone (String, required)
- checkIn (Date, required)
- checkOut (Date, required, must be after checkIn)
- numberOfGuests (Number, required)
- totalPrice (Number, required)
- status (Enum: confirmed, cancelled, completed)
- specialRequests (String, optional)
- createdAt, updatedAt (auto-generated)

# Cloudinary Setup Instructions

## Prerequisites
1. Create a free account at [Cloudinary](https://cloudinary.com/)
2. Get your Cloudinary credentials from the dashboard

## Environment Variables

Add the following environment variables to your `.env.local` file:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## How to Get Your Cloudinary Credentials

1. Sign up at https://cloudinary.com/users/register/free
2. After signing up, you'll be taken to the Dashboard
3. On the Dashboard, you'll see:
   - **Cloud Name**: Displayed at the top
   - **API Key**: Found in the "Account Details" section
   - **API Secret**: Found in the "Account Details" section (click "Reveal" to see it)

## Example `.env.local` file:

```env
MONGODB_URI="mongodb+srv://Hotel:Hotel%40123@cluster0.avbi3gx.mongodb.net/hotel-booking?retryWrites=true&w=majority"
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

## Features

- **Room Images**: Upload up to 5 images per room
- **Booking ID Documents**: Upload NIC/Driver License (image or PDF) for each booking
- All images are stored in Cloudinary and organized in folders:
  - `rooms/` - Room images
  - `bookings/id-documents/` - Customer ID documents

## Image Upload Limits

- **Room Images**: Maximum 5 images per room
- **Booking ID Document**: 1 document per booking (image or PDF)

## Supported Formats

- Images: PNG, JPG, JPEG, WEBP
- Documents: PDF (for ID documents)

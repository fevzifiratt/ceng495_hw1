// models/schema.js
import mongoose from 'mongoose';

// Review Schema (used as a subdocument)
const ReviewSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        trim: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

// User Schema
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    averageRating: {
        type: Number,
        default: 0
    },
    reviews: [ReviewSchema],
    reviewCount: {
        type: Number,
        default: 0
    }
});

// Base Item Schema with common fields
const ItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    seller: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String, // URL to image
        trim: true
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviews: [ReviewSchema],
    reviewCount: {
        type: Number,
        default: 0
    },
    itemType: {
        type: String,
        required: true,
        enum: ['vinyl', 'antique_furniture', 'gps_sports_watch', 'running_shoes']
    }
}, {discriminatorKey: 'itemType'});

// Create the base Item model
const Item = mongoose.models.Item || mongoose.model('Item', ItemSchema);

// Vinyl specific schema
const VinylSchema = new mongoose.Schema({
    age: {
        type: Number // Age in years
    }
});

// Antique Furniture specific schema
const AntiqueFurnitureSchema = new mongoose.Schema({
    material: {
        type: String,
        trim: true
    },
    age: {
        type: Number // Age in years
    }
});

// GPS Sports Watch specific schema
const GPSWatchSchema = new mongoose.Schema({
    batteryLife: {
        type: Number, // Battery life in percentage
        required: true
    }
});

// Running Shoes specific schema
const RunningShoesSchema = new mongoose.Schema({
    size: {
        type: Number,
        required: true
    },
    material: {
        type: String,
        trim: true
    }
});

// Create discriminator models for each type of items
const Vinyl = Item.discriminator('vinyl', VinylSchema);
const AntiqueFurniture = Item.discriminator('antique_furniture', AntiqueFurnitureSchema);
const GPSWatch = Item.discriminator('gps_sports_watch', GPSWatchSchema);
const RunningShoes = Item.discriminator('running_shoes', RunningShoesSchema);

// Create User model
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export {
    User,
    Item,
    Vinyl,
    AntiqueFurniture,
    GPSWatch,
    RunningShoes
};
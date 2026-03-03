const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
    rating:{
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment:{
        type: String
    },
    car:{
        type: mongoose.Schema.ObjectId,
        ref: 'Car',
        required: true
    },
    user:{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }
},{
    timestamps: true
});

module.exports = mongoose.model('Rating', RatingSchema);

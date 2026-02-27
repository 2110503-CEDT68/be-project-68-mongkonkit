const mongoose = require('mongoose');

const CarSchema = new mongoose.Schema({
    name:{
        type: String,
        required: [true,'Please add a rental car provider name'],
        unique: true,
        trim: true,
        maxlength:[50,'Name can not be more than 50 characters']
    },
    address:{
        type: String,
        required: [true,'Please add a rental car provider address']
    },
    tel:{
        type: String,
        required: [true,'Please add a rental car provider telephone number']
    }
},{
    toJSON: {virtuals:true},
    toObject: {virtuals:true}
});

CarSchema.virtual('bookings',{
    ref: 'Booking',
    localField: '_id',
    foreignField: 'car',
    justOne: false
});

module.exports=mongoose.model('Car',CarSchema);
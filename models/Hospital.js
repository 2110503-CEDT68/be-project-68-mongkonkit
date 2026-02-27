const mongoose = require('mongoose');

const HospitalSchema = new mongoose.Schema({
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

HospitalSchema.virtual('appointments',{
    ref: 'Appointment',
    localField: '_id',
    foreignField: 'hospital',
    justOne: false
});

module.exports=mongoose.model('Hospital',HospitalSchema);
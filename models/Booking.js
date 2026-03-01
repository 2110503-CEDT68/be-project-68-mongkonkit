const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    startRent: {
        type: Date,
        required: true
    },
    endRent: {
        type: Date,
        required: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    car: {
        type: mongoose.Schema.ObjectId,
        ref: 'Car',
        required: true
    },
    status: {
        type: String,
        enum: ['renting', 'returned'],
        default: 'renting'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

/* ป้องกัน endRent < startRent */
BookingSchema.pre('save', async function () {

    // 1) endRent ต้องมากกว่า startRent
    if (this.endRent <= this.startRent) {
        throw new Error('End rent time must be after start rent time');
    }

    // 2) ตรวจสอบการจองซ้อน (เฉพาะตอนสร้างใหม่)
    if (!this.isNew) return;

    const overlap = await this.constructor.findOne({
        car: this.car,
        status: 'renting',
        startRent: { $lt: this.endRent },
        endRent: { $gt: this.startRent }
    });

    if (overlap) {
        throw new Error('Car is already booked in this time range');
    }
});

module.exports = mongoose.model('Booking', BookingSchema);

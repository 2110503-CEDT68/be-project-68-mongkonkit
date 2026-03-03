const Rating = require('../models/Rating');
const Booking = require('../models/Booking');
const Car = require('../models/Car');

exports.getRatings = async (req, res) => {
    try {

        let query = {};

        // ถ้ามี carId → เอาเฉพาะ rating ของรถคันนั้น
        if (req.params.carId) {
            query.car = req.params.carId;
        }

        const ratings = await Rating.find(query).populate({
            path: 'user',
            select: 'name'
        });

        res.status(200).json({
            success: true,
            count: ratings.length,
            data: ratings
        });

    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};

exports.addRating = async (req, res) => {
    try {

        // ผูก car และ user
        req.body.car = req.params.carId;
        req.body.user = req.user.id;

        // 🔥 ตรวจสอบว่า user เคยจองรถคันนี้ไหม
        const booking = await Booking.findOne({
            car: req.params.carId,
            user: req.user.id,
            status: "returned"
        });

        if (!booking) {
            return res.status(400).json({
                success: false,
                message: 'You must book this car before giving a rating'
            });
        }

        // 🔥 กันให้ 1 คน รีวิวได้ครั้งเดียว
        const alreadyRated = await Rating.findOne({
            car: req.params.carId,
            user: req.user.id
        });

        if (alreadyRated) {
            return res.status(400).json({
                success: false,
                message: 'You have already rated this car'
            });
        }

        const rating = await Rating.create(req.body);

        res.status(201).json({
            success: true,
            data: rating
        });

    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};

exports.updateRating = async (req, res) => {
    try {

        let rating = await Rating.findById(req.params.id);

        if (!rating) {
            return res.status(404).json({
                success: false,
                message: 'Rating not found'
            });
        }

        // 🔐 เช็คเจ้าของหรือ admin
        if (rating.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }

        rating = await Rating.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        // 🔄 อัปเดตค่าเฉลี่ยใหม่
        await updateAverageRating(rating.car);

        res.status(200).json({
            success: true,
            data: rating
        });

    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};

exports.deleteRating = async (req, res) => {
    try {

        const rating = await Rating.findById(req.params.id);

        if (!rating) {
            return res.status(404).json({
                success: false,
                message: 'Rating not found'
            });
        }

        // 🔐 เช็คเจ้าของหรือ admin
        if (rating.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }

        await rating.deleteOne();

        // 🔄 อัปเดตค่าเฉลี่ยใหม่
        await updateAverageRating(rating.car);

        res.status(200).json({
            success: true,
            data: {}
        });

    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};

const updateAverageRating = async (carId) => {

    const stats = await Rating.aggregate([
        { $match: { car: carId } },
        {
            $group: {
                _id: '$car',
                avgRating: { $avg: '$rating' },
                count: { $sum: 1 }
            }
        }
    ]);

    if (stats.length > 0) {
        await Car.findByIdAndUpdate(carId, {
            averageRating: stats[0].avgRating,
            ratingCount: stats[0].count
        });
    } else {
        await Car.findByIdAndUpdate(carId, {
            averageRating: 0,
            ratingCount: 0
        });
    }
};

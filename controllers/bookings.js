const Booking = require('../models/Booking');
const Car = require('../models/Car');

// @desc     Get all bookings
// @route    GET /api/v1/bookings
// @access   Private
exports.getBookings = async (req, res, next) => {
  try {
    let query;

    // If user is not admin, show only their bookings
    if (req.user.role !== 'admin') {
        query = Booking.find({ user: req.user.id }).populate({
            path:'car',
            select:'name province tel'
        });
    } else {
        if (req.params.carId){
            console.log(req.params.carId);
            query = Booking.find({car:req.params.carId}).populate({
                path:'car',
                select:'name province tel'
            });
        } else {
            query=Booking.find().populate({
                path:'car',
                select:'name province tel'
            });
        }
    }

    const bookings = await query;

    res.status(200).json({
        success: true,
        count: bookings.length,
        data: bookings
    });

  } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Cannot find bookings"
        });
    }
};

// @desc     Get single bookings
// @route    GET /api/v1/bookings/:id
// @access   Private
exports.getBooking=async(req,res,next)=>{
    try {
        const booking=await Booking.findById(req.params.id).populate({
            path:'car',
            select:'name description tel'
        });

        if (!booking){
            return res.status(404).json({success:false,message:`No booking with the id of ${req.params.id}`});
        }

        res.status(200).json({
            success:true,
            data:booking
        });
    } catch(error){
        console.log(error);
        return res.status(500).json({success:false,message:"Cannot find Booking"});
    }
};

exports.addBooking=async (req,res,next)=>{
    try {
        req.body.car=req.params.carId;

        const car=await Car.findById(req.params.carId);

        if (!car){
            return res.status(404).json({success:false,message:`No car with the id of ${req.params.carId}`});
        }

        req.body.user=req.user.id;

        const existedBookings=await Booking.find({user:req.user.id});

        if (existedBookings.length >= 3 && req.user.role != 'admin'){
            return res.status(400).json({success:false,message:`The user with ID ${req.user.id} has already rent 3 cars`});
        }

        const booking = await Booking.create(req.body);
        res.status(200).json({success:true,data:booking});
    }catch(err){
        console.log(err.stack);
        return res.status(500).json({success:false,message:"Cannot create booking"});
    }
};

// @desc     Update booking
// @route    PUT /api/v1/bookings/:id
// @access   Private
exports.updateBooking = async (req, res, next) => {
  try {

    let booking = await Booking.findById(req.params.id);

    // Check if booking exists
    if (!booking) {
        return res.status(404).json({
            success: false,
            message: `No booking with the id of ${req.params.id}`
        });
    }

    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin'){
        return res.status(401).json({success:false,message: `User ${req.user.id} is not authorized to update this booking`});
    }

    booking = await Booking.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true
        }
    );

    res.status(200).json({
        success: true,
        data: booking
    });

  } catch (error) {
        console.log(error);
            return res.status(500).json({
            success: false,
            message: 'Cannot update Booking'
        });
  }
};

exports.deleteBooking=async(req,res,next)=>{
    try{
        const booking = await Booking.findById(req.params.id);

        if (!booking){
            return res.status(404).json({success:false, message: `No booking with the id of ${req.params.id}`})
        }

        if (booking.user.toString() !== req.user.id && req.user.role !== 'admin'){
        return res.status(401).json({success:false,message: `User ${req.user.id} is not authorized to delete this booking`});
    }

        await Booking.findByIdAndDelete(req.params.id);

        res.status(200).json({success:true, data:{}});
    } catch(err){
        console.log(err.stack);
            return res.status(500).json({
            success: false,
            message: 'Cannot delete Booking'
        });
    }
}
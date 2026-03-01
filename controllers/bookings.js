const Booking = require('../models/Booking');
const Car = require('../models/Car');

/* ==============================
   GET ALL BOOKINGS
============================== */
exports.getBookings = async (req, res) => {
  try {
    let query;

    if (req.user.role !== 'admin') {
      query = Booking.find({ user: req.user.id }).populate({
        path: 'car',
        select: 'name province tel'
      });
    } else {
      if (req.params.carId) {
        query = Booking.find({ car: req.params.carId }).populate({
          path: 'car',
          select: 'name province tel'
        });
      } else {
        query = Booking.find().populate({
          path: 'car',
          select: 'name province tel'
        });
      }
    }

    const bookings = await query;

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Cannot find bookings'
    });
  }
};

/* ==============================
   GET SINGLE BOOKING
============================== */
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate({
      path: 'car',
      select: 'name description tel'
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No booking with the id of ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: 'Cannot find booking'
    });
  }
};

/* ==============================
   ADD BOOKING
============================== */
exports.addBooking = async (req, res) => {
  try {
    req.body.car = req.params.carId;
    req.body.user = req.user.id;

    req.body.startRent = new Date(req.body.startRent);
    req.body.endRent   = new Date(req.body.endRent);

    const car = await Car.findById(req.params.carId);
    if (!car) {
      return res.status(404).json({
        success: false,
        message: `No car with the id of ${req.params.carId}`
      });
    }

    const existedBookings = await Booking.countDocuments({
      user: req.user.id
    });

    if (existedBookings >= 3 && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: `User ${req.user.id} has already rent 3 cars`
      });
    }

    const booking = await Booking.create(req.body);

    res.status(201).json({
      success: true,
      data: booking
    });

  } catch (err) {

    // ดัก error จาก model
    if (
      err.message === 'End rent time must be after start rent time' ||
      err.message === 'Car is already booked in this time range'
    ) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};


/* ==============================
   UPDATE BOOKING
============================== */
exports.updateBooking = async (req, res) => {
  try {
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No booking with the id of ${req.params.id}`
      });
    }

    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized`
      });
    }

    booking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: booking
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: 'Cannot update booking'
    });
  }
};

/* ==============================
   DELETE BOOKING
============================== */
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No booking with the id of ${req.params.id}`
      });
    }

    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized`
      });
    }

    await booking.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });

  } catch (err) {
    console.log(err.stack);
    res.status(500).json({
      success: false,
      message: 'Cannot delete booking'
    });
  }
};

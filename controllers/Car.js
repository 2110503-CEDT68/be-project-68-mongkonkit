const Booking = require('../models/Booking.js');
const Car = require('../models/Car');


exports.getCars = async (req, res, next) => {
  let query;

  const reqQuery = { ...req.query };

  // fields ที่ไม่เอาไป query DB
  const removeFields = ['select', 'sort', 'page', 'limit', 'startRent', 'endRent'];
  removeFields.forEach(param => delete reqQuery[param]);

  // advanced filter
  let queryStr = JSON.stringify(reqQuery);
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

  let mongoQuery = JSON.parse(queryStr);

  /* =====================================================
     FILTER รถว่างตามช่วงเวลา
  ====================================================== */
  const { startRent, endRent } = req.query;

  if (startRent && endRent) {
    const start = new Date(decodeURIComponent(startRent));
    const end   = new Date(decodeURIComponent(endRent));


    // เช็ก format วันที่ผิด (Invalid Date)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid startRent or endRent format'
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'endRent must be after startRent'
      });
    }

    // หา booking ที่ "เวลาซ้อน"
    const bookedCars = await Booking.find({
      status: 'renting',
      startRent: { $lt: end },
      endRent:   { $gt: start }
    }).select('car');

    const bookedCarIds = bookedCars.map(b => b.car);

    // เอารถที่ถูกจองแล้วออกจากผลลัพธ์
    mongoQuery._id = { $nin: bookedCarIds };
  }

  // สร้าง query รถ
  query = Car.find(mongoQuery).populate('bookings');

  /* ================================
     SELECT
  ================================= */
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  /* ================================
     SORT
  ================================= */
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  /* ================================
     PAGINATION
  ================================= */
  const page  = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex   = page * limit;

  const total = await Car.countDocuments(mongoQuery);

  query = query.skip(startIndex).limit(limit);

  try {
    const cars = await query;

    const pagination = {};
    if (endIndex < total) {
      pagination.next = { page: page + 1, limit };
    }
    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit };
    }

    res.status(200).json({
      success: true,
      count: cars.length,
      pagination,
      data: cars
    });

  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false });
  }
};




exports.getCar=async (req,res,next)=>{
    try{
        const car = await Car.findById(req.params.id);
        if (!car){
            return res.status(400).json({success:false});
        }
        res.status(200).json({success:true, data:car});
    } catch(err){
        res.status(400).json({success:false});
    }
};



exports.createCar = async (req, res, next) => {
    const car = await Car.create(req.body);

    res.status(201).json({
        success: true,
        data: car
    });
};



exports.updateCar= async(req,res,next)=>{
    try{
        const car = await Car.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators:true
        });
        if (!car){
            return res.status(400).json({success:false});
        }
        res.status(200).json({success:true, data:car});
    } catch(err){
        res.status(400).json({success:false});
    }
};



exports.deleteCar=async (req,res,next)=>{
    try{
        const car = await Car.findById(req.params.id);

        if (!car){
            return res.status(400).json({success:false ,message:`Car not found with id of ${req.params.id}`});
        }
        await Booking.deleteMany({car:req.params.id});
        await Car.deleteOne({_id:req.params.id});
        res.status(200).json({success:true, data:{}});
    } catch(err){
        res.status(400).json({success:false});
    }

};
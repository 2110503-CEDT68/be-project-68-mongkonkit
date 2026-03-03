const express = require('express');
const {
  addRating,
  getRatings,
  updateRating,
  deleteRating
} = require('../controllers/ratings');

const { protect } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(getRatings)
  .post(protect, addRating);

router
  .route('/:id')
  .put(protect, updateRating)
  .delete(protect, deleteRating);

module.exports = router;

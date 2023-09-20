var express = require('express');
var { Book } = require('../models')
var router = express.Router();

function asyncHandler(cb) {
  return async (req, res, next) => {
    try {
      await cb(req, res, next)
    } catch (err) {
      res.render('error', {error:err})
    }
  }
}

/* GET home page. */
router.get('/', (req, res, next) => {
  res.redirect('/books')
});

router.get('/books', asyncHandler( async (req, res, next) => {
  const books = await Book.findAll();
  res.render('booklist', {title: 'Library Database', books});
})
)
module.exports = router;

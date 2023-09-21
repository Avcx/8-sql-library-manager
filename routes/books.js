var express = require("express");
var { Book } = require("../models");
var router = express.Router();

function asyncHandler(cb) {
  return async (req, res, next) => {
    try {
      await cb(req, res, next);
    } catch (err) {
      res.render("error", { error: err });
    }
  };
}

router.get(
  "/",
  asyncHandler(async (req, res, next) => {
    const books = await Book.findAll();
    res.render("index", { title: "Library Database", books });
  })
);

// 'get' route to open the 'new book' form

router.get("/new", (req, res, next) => {
  res.render("new-book", { title: "New Book" });
});

router.post(
  "/new",
  asyncHandler(async (req, res, next) => {
    let book;
    try {
      book = await Book.create(req.body);
      res.redirect("/books");
    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        // checking the error
        book = await Book.build(req.body);
        res.render("new-book", {
          book,
          errors: error.errors,
          title: "New Book",
        });
      } else {
        throw error; // error caught in the asyncHandler's catch block
      }
    }
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res, next) => {
    const book = await Book.findByPk(req.params.id);
    res.render("update-book", { book });
  })
);

router.post(
  "/:id",
  asyncHandler(async (req, res, next) => {
    let book;
    console.log;
    try {
      book = await Book.findByPk(req.params.id);
      if (book) {
        await book.update(req.body);
        res.redirect("/books/");
      } else {
        res.sendStatus(404);
      }
    } catch (error) {
      console.error(error);
      if (error.name === "SequelizeValidationError") {
        // checking the error
        book = await Book.build(req.body);
        res.render("update-book", {
          book,
          errors: error.errors,
          title: `Update Book: ${book.title}`,
        });
      } else {
        throw error; // error caught in the asyncHandler's catch block
      }
    }
  })
);

module.exports = router;

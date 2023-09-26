var express = require("express");
var { Book } = require("../models");
var router = express.Router();

let currentId;

function asyncHandler(cb) {
  return async (req, res, next) => {
    try {
      await cb(req, res, next);
    } catch (err) {
      next(err);
    }
  };
}

router.get(
  "/",
  asyncHandler(async (req, res, next) => {
    const books = await Book.findAll({ order: [["year", "DESC"]] });
    res.render("index", { title: "Library Database", books });
  })
);

// 'get' route to open the 'new book' form

router.get("/new", (req, res, next) => {
  res.render("new-book", { title: "New Book" });
});

router.post(
  "/",
  asyncHandler(async (req, res, next) => {
    let book;
    try {
      book = await Book.create(req.body);
      res.redirect("/books");
    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        book = await Book.build(req.body);
        res.render("new-book", {
          book,
          errors: error.errors,
          title: "New Book",
        });
      } else {
        throw error;
      }
    }
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res, next) => {
    currentId = currentId || req.params.id;
    const book = await Book.findByPk(currentId);
    if (book) {
      res.render("update-book", { book });
    } else {
      res.sendStatus(404);
    }
  })
);

router.post(
  "/:id",
  asyncHandler(async (req, res, next) => {
    let book;
    try {
      book = await Book.findByPk(currentId);
      if (book) {
        await book.update(req.body);
        res.redirect("/books");
      } else {
        res.sendStatus(404);
      }
    } catch (error) {
      console.error(error.errors);
      if (error.name === "SequelizeValidationError") {
        // checking the error
        res.render("update-book", {
          book,
          errors: error.errors,
          title: `Update Book`,
        });
      } else {
        throw error; // error caught in the asyncHandler's catch block
      }
    }
  })
);

router.post(
  "/:id/delete",
  asyncHandler(async (req, res, next) => {
    const book = await Book.findByPk(req.params.id);
    if (book) {
      await book.destroy();
      res.redirect("/books/");
    } else {
      res.sendStatus(404);
    }
  })
);

module.exports = router;

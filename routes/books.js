var express = require("express");
var { Book } = require("../models");
var router = express.Router();

let currentId;
let currentPage = 1;
const itemsPerPage = 12;

function asyncHandler(cb) {
  return async (req, res, next) => {
    try {
      await cb(req, res, next);
    } catch (err) {
      next(err);
    }
  };
}

function create404Error() {
  const error = new Error(`Book id: '${currentId}' does not exist!`);
  error.status = 404;
  throw error;
}

router.get(
  "/",
  asyncHandler(async (req, res, next) => {
    // const books = await Book.findAll();
    currentPage = req.query.page || currentPage;
    const books = await Book.findAndCountAll({
      offset: (currentPage - 1) * itemsPerPage,
      limit: itemsPerPage,
    });
    const numOfPages = Math.ceil(books.count / itemsPerPage);

    res.render("index", {
      title: "Library Database",
      books: books.rows,
      pages: numOfPages,
      currentPage: currentPage,
    });
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
  asyncHandler(async (req, res, next, err) => {
    currentId = req.params.id;
    const book = await Book.findByPk(currentId);
    if (book) {
      res.render("update-book", { book, title: `Update Book: ${book.title}` });
    } else {
      create404Error();
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
        currentId = null;
        res.redirect("/books");
      } else {
        create404Error();
      }
    } catch (error) {
      console.error(error.errors);
      if (error.name === "SequelizeValidationError") {
        // checking the error
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

router.post(
  "/:id/delete",
  asyncHandler(async (req, res, next) => {
    currentId = req.params.id;
    const book = await Book.findByPk(currentId);

    if (book) {
      await book.destroy();
      res.redirect("/books/");
    } else {
      create404Error();
    }
  })
);

module.exports = router;

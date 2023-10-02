var express = require("express");
var { Book } = require("../models");
var router = express.Router();
var { Op } = require("sequelize");

// Variables
let currentId;
let currentPage = 1;
let searchTerm;
const itemsPerPage = 12;

/**
 * Used to try/catch async route functions.
 * @param {Function} cb - An async callback function to be ran.
 * @returns Promise
 */

function asyncHandler(cb) {
  return async (req, res, next) => {
    try {
      await cb(req, res, next);
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Used to query the database.
 * @returns an Object containing database query results.
 */
async function search(newTerm) {
  newTerm ? (searchTerm = newTerm) : (searchTerm = searchTerm);
  return await Book.findAndCountAll({
    where: {
      [Op.or]: {
        title: {
          [Op.substring]: searchTerm,
        },
        author: {
          [Op.substring]: searchTerm,
        },
        genre: {
          [Op.substring]: searchTerm,
        },
        year: {
          [Op.substring]: searchTerm,
        },
      },
    },
    offset: (currentPage - 1) * itemsPerPage,
    limit: itemsPerPage,
  });
}

/**
 * Creates a 404 error with a custom message.
 * @param {String} msg
 */

function create404Error(msg = `Book id: '${currentId}' does not exist!`) {
  const error = new Error(msg);
  error.status = 404;
  throw error;
}

/* GET ROUTE '/'
 * Default get route for '/books'
 * Loades all books from database */

router.get(
  "/",
  asyncHandler(async (req, res, next) => {
    // const books = await Book.findAll()
    req.query.home
      ? (currentPage = 1)
      : (currentPage = req.query.page || currentPage);
    const books = await Book.findAndCountAll({
      offset: (currentPage - 1) * itemsPerPage,
      limit: itemsPerPage,
    });
    const numOfPages = Math.ceil(books.count / itemsPerPage);

    if (!books.count) {
      const err = new Error(`No books exist!`);
      res.render("page-not-found", {
        error: err,
      });
    } else {
      res.render("index", {
        title: "Library Database",
        books: books.rows,
        pages: numOfPages,
        currentPage,
      });
    }
  })
);

/* POST ROUTE '/search'
 * Queries the database for user posted 'searchTerm'
 * */

router.post(
  "/search",
  asyncHandler(async (req, res, next) => {
    currentPage = 1;
    const books = await search(req.body.query);
    const numOfPages = Math.ceil(books.count / itemsPerPage);

    res.render("index", {
      books: books.rows,
      title: `Results for: ${searchTerm}`,
      pages: numOfPages,
      currentPage,
      searchQ: true,
      searchTerm,
    });
  })
);

/* GET ROUTE '/search'
 * Displays results from database search.
 */

router.get(
  "/search",
  asyncHandler(async (req, res, next) => {
    currentPage = req.query.page || currentPage;

    const books = await search();

    const numOfPages = Math.ceil(books.count / itemsPerPage);

    res.render("index", {
      books: books.rows,
      title: `Results for: ${searchTerm}`,
      pages: numOfPages,
      currentPage,
      searchQ: true,
      searchTerm,
    });
  })
);

/* GET ROUTE '/new'
 * Loades 'new-book' page
 */

router.get("/new", (req, res, next) => {
  res.render("new-book", { title: "New Book" });
});

/* POST ROUTE '/new'
 * Attempts to insert a new database entry with user entered data.
 * If entered wrong, it displays errors from the validator.
 */

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

/* GET ROUTE '/:id'
 * Loades information from the selected book
 * and gets on the page ready to edit.
 */

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

/* POST ROUTE '/:id'
 * Updates data for the currently selectd book.
 */

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

/* POST ROUTE '/:id/delete'
 * Deletes the currently selected book.
 */

router.post(
  "/:id/delete",
  asyncHandler(async (req, res, next) => {
    currentId = req.params.id;
    const book = await Book.findByPk(currentId);

    if (book) {
      await book.destroy();
      res.redirect("/books");
    } else {
      create404Error();
    }
  })
);

module.exports = router;

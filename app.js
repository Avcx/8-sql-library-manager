var createError = require("http-errors");
var express = require("express");

var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var bookRouter = require("./routes/books");

var app = express();
var db = require("./models").sequelize;

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/books", bookRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  err.status = err.status || 500;
  err.message = err.message || "An unexpected Error has occured!";
  if (err.status === 404) {
    console.error(err);
    res.render("page-not-found", { error: err });
  } else {
    console.error(err);
    res.render("error", { error: err });
  }
});

// check database connection

const run = async () => {
  try {
    await db.authenticate();
    await db.sync();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

run();

module.exports = app;

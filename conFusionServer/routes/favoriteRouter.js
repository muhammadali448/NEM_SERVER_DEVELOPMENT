const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
var authenticate = require("../authenticate");
const cors = require("./cors");
const Dishes = require("../models/dishes");
const Favorites = require("../models/favorite");
const favoriteRouter = express.Router();
favoriteRouter.use(bodyParser.json());

favoriteRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
    .populate("user")
    .populate("dishes")
      .then(
        favorites => {
          if (!favorites) {
            res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          return res.json([]);  
          }
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(favorites);
        },
        err => next(err)
      )
      .catch(err => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
      .then(
        userFavorite => {
          if (userFavorite === null) {
            var favorite = new Favorites();
            favorite.user = req.user._id;
            favorite.dishes = req.body;
            favorite
              .save()
              .then(favorite => {
                Favorites.findById(favorite._id)
                  .populate("user")
                  .populate("dishes")
                  .then(favorite => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(favorite);
                  });
              })
              .catch(err => {
                return next(err);
              });
          } else {
            var dishes = [];
            for (let index = 0; index < req.body.length; index++) {
              if (userFavorite.dishes.indexOf(req.body[index]._id) !== -1) {
                console.log("Found");
              } else {
                dishes.push(req.body[index]._id);
                userFavorite.dishes.push(req.body[index]._id);
              }
            }
            if (dishes.length > 0) {
              console.log(dishes);
              userFavorite
                .save()
                .then(favorite => {
                  Favorites.findById(favorite._id)
                    .populate("user")
                    .populate("dishes")
                    .then(favorite => {
                      res.statusCode = 200;
                      res.setHeader("Content-Type", "application/json");
                      res.json(favorite);
                    });
                })
                .catch(err => {
                  return next(err);
                });
            } else {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(userFavorite);
            }
          }
        },
        err => next(err)
      )
      .catch(err => next(err));
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOneAndRemove({ user: req.user._id })
      .then(
        resp => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(resp);
        },
        err => next(err)
      )
      .catch(err => next(err));
  });

favoriteRouter
  .route("/:dishId")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
      .then(
        favorites => {
          if (!favorites) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.json({ exists: false, favorites: favorites });
          } else {
            if (favorites.dishes.indexOf(req.params.dishId) < 0) {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              return res.json({ exists: false, favorites: favorites });
            } else {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              return res.json({ exists: true, favorites: favorites });
            }
          }
        },
        err => next(err)
      )
      .catch(err => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    console.log("HIT")
    Favorites.findOne({ user: req.user._id })
      .then(
        favorite => {
          if (favorite != null) {
            console.log("FAVORITE NOT NULL")
            if (favorite.dishes.indexOf(req.params.dishId) < 0) {
              favorite.dishes.push(req.params.dishId);
              favorite.save().then((favorite) => {
                Favorites.findById(favorite._id)
                .populate('user')
                .populate('dishes')
                .then((favorite) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                })
            })
            .catch((err) => {
                return next(err);
            });
            } 
          }
          else {
            console.log("check")
            var favorite = new Favorites({
              user: req.user._id,
              dishes: [req.params.dishId]
            });
            favorite.save().then((favorite) => {
              Favorites.findById(favorite._id)
              .populate('user')
              .populate('dishes')
              .then((favorite) => {
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.json(favorite);
              })
          })
          .catch((err) => {
              return next(err);
          });
          }
        },
        err => next(err)
      )
      .catch(err => next(err));
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    console.log(req.params.dishId)
    Favorites.findOne({ user: req.user._id })
      .then(
        favorite => {
          if (favorite != null) {
            if (favorite.dishes.indexOf(req.params.dishId) !== -1) {
              favorite.dishes.splice(
                favorite.dishes.indexOf(req.params.dishId), 1
              );
              favorite.save().then((favorite) => {
                Favorites.findById(favorite._id)
                .populate('user')
                .populate('dishes')
                .then((favorite) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                })
                .catch((err) => {
                  return next(err);
              });
            })
            } else {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json({
                message: "This dish isn't included in your favorites"
              });
            }
          } else {
            err = new Error("Dish " + req.params.dishId + " not found");
            err.status = 404;
            return next(err);
          }
        },
        err => next(err)
      )
      .catch(err => next(err));
  });

module.exports = favoriteRouter;

const express = require("express");
const jwt = require("jsonwebtoken");
const e = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

module.exports = (options) => {
  return async (req, res, next) => {
    const authState = req.body.user || req.user;
    // console.log(authState); // Add this line
    try {
      if (!options) {
        
        res.locals.requester = authState;

        next();
      } else {
        if (options.authLevel == "teacher") {
          if (authState.user.role != "teacher") {
            return res
              .status(401)
              .json({ error: [{ msg: "You must be a teacher" }] });
          } else {
           
            res.locals.requester = authState;
           

            next();
          }
        }
      }
    } catch (err) {
      console.log(err.response.data);
      return res.status(500).json({ error: [{ msg: "Server Error" }] });
    }
  };
};

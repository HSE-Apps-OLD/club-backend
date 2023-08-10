const express = require('express')
const jwt = require('jsonwebtoken')
const e = require('express')
const axios = require('axios')
const Club = require('../Models/Club')

// Must be used after auth middleware
// clubRole(['officer', 'member'])
module.exports = (options) => {
    return async (req, res, next) => {
        try {
            const { clubURL } = req.params;

            const club = await Club.findOne({ url: clubURL });

            if (!club) {
                return res
                    .status(404)
                    .json({ errors: [{ msg: "This club doesn't exist" }] });
            }

            res.locals.club = club;

            if (options) {
                if (options.authLevel) {
                    if (options.authLevel == "all") {
                        next();
                    } else {
                        const { requester } = res.locals;

                        // Get the user ID from the request object
                        const userId = req.userId;

                        const sponsorPerms = club.sponsors.includes(userId);
                        const officerPerms =
                            club.officers.includes(userId) || sponsorPerms;
                        const membersPerm =
                            club.members.includes(userId) || officerPerms;

                        if (options.authLevel == "member") {
                            if (!membersPerm) {
                                return res
                                    .status(401)
                                    .json({ errors: [{ msg: "Only members" }] });
                            } else {
                                next();
                            }
                        } else if (options.authLevel == "officer") {
                            if (!officerPerms) {
                                return res
                                    .status(401)
                                    .json({ errors: [{ msg: "Only officers" }] });
                            } else {
                                next();
                            }
                        } else if (options.authLevel == "sponsor") {
                            if (!sponsorPerms) {
                                return res
                                    .status(401)
                                    .json({ errors: [{ msg: "Only sponsors" }] });
                            } else {
                                next();
                            }
                        }
                    }
                }
            } else {
                next();
            }
        } catch (err) {
            console.log(err);
            return res
                .status(500)
                .json({ errors: [{ msg: "Server Error" }] });
        }
    };
};

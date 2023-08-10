const mongoose = require('mongoose')

const User = new mongoose.Schema({
    msId: {
        type: String,
        required: true,
        default: "None",
      },
    clubs:{
        type: [mongoose.Schema.ObjectId],
        required: false
    },
    pendingClubs:{
        type: [mongoose.Schema.ObjectId],
        required: false
    }
})

module.exports = mongoose.model('User', User)
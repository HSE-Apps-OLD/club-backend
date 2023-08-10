const mongoose = require('mongoose')
const { emit } = require('./User')

const Club = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true
    },
    getInvolved:{
        type: String,
        require: true
    },
    logo:{
        type: String,
        required: true,
        default: "https://storage.cloud.google.com/hse-key-bucket/default.png"
    },
    sponsors:{
        type: [String],
        default: []
    },
    status:{
        type: String,
        enum: ['application', 'review', 'official'],
        default: 'application'
    },
    members:{
        type: [String],
        default: []
    },
    contact: {
        type: Object,
        default: {}
    },
    officers: {
        type: [mongoose.Schema.ObjectId],
        default: []
    },
    url:{
        type: mongoose.Schema.Types.String,
        required: true
    },
    color: {
        type: mongoose.Schema.Types.String,
        required: true
    },
    titles:{
        type: Object,
        default: {default: "Member"}
    },
    tags:{
        type: Array,
        default: []
    },
    tagline:{
        type: String
    },
    applicants:{
        type: [mongoose.Schema.ObjectId],
        default: []
    },
    settings:{
        autoJoin: Boolean,
        smsDisabled: {
            type: [mongoose.Schema.ObjectId],
            default: []
        }
    },
    announcements:{
        type: [mongoose.Schema.ObjectId],
        default: []
    },
    announcementViewDate:{
        type: Object,
        default: {}
    }

})

module.exports = mongoose.model('Club', Club)
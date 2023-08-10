const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const axios = require('axios')
const dotenv = require('dotenv')

dotenv.config()

const Club = require('../Models/Club')
const Announcement = require('../Models/Announcement')

const auth = require('../middleware/auth')
const clubRole = require('../middleware/clubRole')

const { body, validationResult } = require('express-validator');
const User = require('../Models/User')


const AUTH_API = process.env.AUTH_API


const {isRole ,inClub} = require('../util/clubUtil')


// * Returns all clubs

router.get('/' , async (req, res) => {
    try{

        const clubs = await Club.find()
        res.json(clubs)

    } catch(err) {
        
        console.log(err)
        res.json({'errors': [{"msg": "Server Error"}]}).status(500)
    }
})

// * Returns single club

router.get('/:clubURL',auth(),clubRole(),async(req,res) => {
    try {

        const {club} = res.locals

        res.json(club)

    } catch (err) {

        console.log(err)
        res.json({'errors': [{"msg": "Server Error"}]}).status(500)

    }
})

// * Returns all members of a club as HSE Key Users 

router.get('/:clubURL/members', auth(),clubRole(), async(req,res) => {
    try {

        const {club} = res.locals

        const { data : officers } = await axios.post(`${AUTH_API}/user/aggregate`, {idList: club.officers})
        const { data : members} = await axios.post(`${AUTH_API}/user/aggregate`, {idList: club.members})
        const { data : sponsors} = await axios.post(`${AUTH_API}/user/aggregate`, {idList: club.sponsors})
        const { data : applicants} = await axios.post(`${AUTH_API}/user/aggregate`, {idList: club.applicants})

        res.json({officers,  members, sponsors,  applicants})

    } catch (error) {

        console.log("failed to get all members of the")
        res.status(500).json({'errors': [{"msg": "Server Error"}]})

    }
})

// * Sends SMS announcement to club members with phone number and notifications on

router.post('/:clubURL/announcement', auth(), clubRole({authLevel: 'officer'}), async(req,res) => {

    console.log('hit')

    try {

        const{club, requester} = res.locals

        const smsMessage = `${club.name} | ${requester.name} \n${req.body.message}`

        let idList = club.officers.concat(club.members)

        club.settings.smsDisabled.forEach((smsDisabledId) => {
            idList = idList.filter((id) => !id.equals(smsDisabledId))
        })

        console.log(idList)

        
        await axios.post(`${AUTH_API}/phone/aggregate`, {idList, message: smsMessage})



        const announcement = new Announcement({club: club._id, seen: [], message: req.body.message, senderName:requester.name, date: Date.now() })



        club.announcements.push(announcement)

        club.save()
        announcement.save()

        res.send(club)

    } catch (err) {

        console.log(err)
        return res.status(500).json({'errors': [{"msg": "Server Error"}]})

    }

})



router.get('/:clubURL/announcement', auth(), clubRole({authLevel: 'member'}),  async (req,res) => {
    try {

        const {club, requester} = res.locals

        const announcements = await Announcement.find({_id : {$in: club.announcements}})


        club.save()
        res.json({announcements})


    } catch (err) {
        console.log(err)
        return res.status(500).json({'errors': [{"msg": "Server Error"}]})
    }
})



router.put('/:clubURL/announcement', auth(), clubRole({authLevel: 'member'}),  async (req,res) => {
    console.log('marked read')
    try {

        const {club, requester} = res.locals

        club.announcementViewDate = {...club.announcementViewDate, [requester._id] : Date.now()}

        club.save()
        res.json(club)


    } catch (err) {

    }
})

// * User requests to join / joins club

router.post("/:clubURL/members/", auth(), clubRole(), async (req, res) => {
    try {
        const {requester, club} = res.locals
      const msId = req.body.msId; // Extract the string from the request body

      if(!msId){
        return res.status(400).json({'errors': [{"msg": "Please Login"}]})
      }
   
      const user = await User.findOne({
        msId: msId
      });
  
    

    
      if(inClub(club, user.msId)){
        return res.status(400).json({'errors': [{"msg": "Already in club"}]})
    } else if(isRole('applicant',club, user.msId)){
        return res.status(400).json({'errors': [{"msg": "Application pending"}]})
    }

    
    user.clubs.push( new mongoose.Types.ObjectId(club._id))
    console.log(user.msId)
    club.members.push(user.msId.toString())
      
    // if(club.settings.autoJoin){
            
    //     user.clubs.push( new mongoose.Types.ObjectId(club._id))
    //     club.members.push(new mongoose.Types.ObjectId(user._id))

    // } else {
        
    //     user.pendingClubs.push( new mongoose.Types.ObjectId(club._id))
    //     club.applicants.push(new mongoose.Types.ObjectId(user._id))

    // }
      
  
      user.save();
      club.save();
  
      res.json(club);
     } catch (err) {
       console.log("didnot work");
      return res.status(500).json({ errors: [{ msg: "Server Error" }] });
    }
  });
  

// Accepts member into club
router.put('/:clubURL/members/:id/accept', auth(), clubRole({authLevel: "officer"}), async (req, res) => {

    try{

        const {club} = res.locals

        const {id : idToAccept} = req.params

        if(inClub(club, idToAccept)){
            return res.status(400).json({'errors': [{"msg": "Already in club"}]})
        } else if(!isRole('applicant', club, idToAccept)){
            return res.status(400).json({'errors': [{"msg": "User is not an applicant"}]})
        }
        
        const userToAccept = await User.findById(idToAccept)

        userToAccept.clubs.push( new mongoose.Types.ObjectId(club._id))
        userToAccept.pendingClubs = userToAccept.pendingClubs.filter((clubID) => !club._id.equals(clubID))

        club.members.push(new mongoose.Types.ObjectId(idToAccept))
        club.applicants = club.applicants.filter((userId) => !userId.equals(idToAccept))

        userToAccept.save()
        club.save()

        res.json(club)

    } catch(err) {

        console.log(err)
        return res.status(500).json({'errors': [{"msg": "Server Error"}]})

    }

})


// Promotes Member

router.put('/:clubURL/members/:id/promote', auth(), clubRole({authLevel: "officer"}), async (req, res) => {

    try{

        const {club} = res.locals

        const {id : idToPromote} = req.params

        if(!isRole('member',club, idToPromote)){
            return res.status(400).json({'errors': [{"msg": "You can only promote club members"}]})
        }


        club.officers.push(new mongoose.Types.ObjectId(idToPromote))
        club.members = club.members.filter((userId) => !userId.equals(idToPromote))

        club.save()
        res.json(club)

    } catch(err) {

        console.log(err)
        return res.status(500).json({'errors': [{"msg": "Server Error"}]})

    }

})

// Demotes Member

router.put('/:clubURL/members/:id/demote', auth(), clubRole({authLevel: "sponsor"}), async (req, res) => {

    try{

        const {club} = res.locals

        const {id : idToDemote} = req.params


        if(!isRole('officer',club, idToDemote)){
            return res.status(400).json({'errors': [{"msg": "You can only demote club officers"}]})
        }


        club.members.push(new mongoose.Types.ObjectId(idToDemote))
        club.officers = club.officers.filter((userId) => !userId.equals(idToDemote))

        club.save()

        res.json(club)

    } catch(err) {

        console.log(err)
        return res.status(500).json({'errors': [{"msg": "Server Error"}]})

    }

})


// Kicks User From Club

router.delete('/:clubURL/members/:id', auth(),clubRole({authLevel: "officer"}), async (req, res) => {

    try{

        const {club} = res.locals

        const {id : idToKick} = req.params

        if(!inClub(club, idToKick)){
            return res.status(400).json({'errors': [{"msg": "You can only kick students in the club"}]})
        } else if(isRole('sponsor',club, idToKick)){
            return res.status(400).json({'errors': [{"msg": "You can't kick a sponsor"}]})
        }

        const userToKick = await User.findById(idToKick)

        userToKick.clubs = userToKick.clubs.filter((clubID) => !club._id.equals(clubID) )
        userToKick.save()
        

        club.members = club.members.filter((memberId) => !memberId.equals(idToKick))
        club.officers = club.officers.filter((memberId) => !memberId.equals(idToKick))


        club.save()

        res.json(club)

    } catch(err) {
        return res.status(500).json({'errors': [{"msg": "Server Error"}]})

    }

})


// User leave route 
router.delete('/:clubURL/members/', auth(), async (req, res, next) => {
    // Extract the user ID from the header
    const userId = req.headers['x-user-id'];
    
    // Attach the user ID to the request object
    req.userId = userId;

    // Call the clubRole middleware with the modified request object
    clubRole({authLevel: 'member'})(req, res, next);
}, async (req, res) => {
    try {

        const {club, requester} = res.locals
        const msId = req.userId;
        console.log(msId);
    
        if (isRole('sponsor', club, msId)) {
            console.log('sponsor')
            return res.status(400).json({'errors': [{"msg": "You can't leave as a sponsor"}]})
        }
        
       

        const user = await User.findOne({
            msId: msId
          });

        user.clubs = user.clubs.filter((clubID) => !club._id.equals(clubID))

        club.members = club.members.filter((memberId) => !(memberId ==msId))
        club.officers = club.officers.filter((memberId) => !(memberId == msId))

        user.save()
        club.save()

        res.json(club)

    } catch (err) {

        console.log(err)
        return res.status(500).json({'errors': [{"msg": "Server Error"}]})

    }
});


// Toggle SMS for self user

router.put('/:clubURL/settings/sms', auth(), clubRole({authLevel: 'member'}), async(req, res) => {

    try {

        const {club, requester} = res.locals


 

        if(club.settings.smsDisabled.some((id) => id.equals(requester._id))){
            club.settings.smsDisabled = club.settings.smsDisabled.filter((id) => !id.equals(requester._id))
        } else {
            club.settings.smsDisabled.push(new mongoose.Types.ObjectId(requester._id))
        }



        club.save()
 
        res.send(club)

    } catch (err) {

        console.log(err)
        return res.status(500).json({'errors': [{"msg": "Server Error"}]})

    }
})


// Club Update 
// TODO: CLEAN UP ROUTE

router.put('/:clubURL', auth(), clubRole({authLevel: "officer"}), async (req,res) => {

    const {club} = res.locals

    const {name, description, getInvolved, color, tags, logo, tagline, contact, titles, settings} = req.body

    console.log(contact)

    try{    


            let testClub = {...club, ...req.body}

            if(name){
                club.name = name
            }

                        
            if(logo){
                club.logo = logo
            }

            if(description){
                club.description = description
            }

            if(getInvolved){
                club.getInvolved = getInvolved
            }

            if(color){
                club.color = color
            }

            if(tags){
                club.tags = tags
            }

            if(tagline){
                club.tagline = tagline
            }   

            if(contact){
                club.contact = contact
            }

            if(titles){
                club.titles = titles
            }

            if(settings){
                club.settings = settings
            }
            club.save()
            res.send(club)

    } catch(err) {
        
        console.log(err)
        return res.status(500).json({'errors': [{"msg": "Server Error"}]})

    }
})




// TODO: CLEAN UP ROUTE

router.post('/', 
    auth(),
    [
        body('form.name').notEmpty().withMessage("Please enter a club name"),
        body('form.url').notEmpty().withMessage("Please enter a URL").custom((value, {req}) => value.indexOf(" ") == -1).withMessage("Club ID must not contain spaces"),
        body('form.description').notEmpty().withMessage("Please enter a description"),
        body('form.color').isHexColor().withMessage("Please use a valid color"),
        body("form.tagline").notEmpty().withMessage("Please enter a tagline").isLength({max: 100}).withMessage("Your tagline must be less than 100 characters"),
        body('form.getInvolved').notEmpty().withMessage("Please tell us how students should get involved")
    ],
    async (req,res) => {

        const errors = validationResult(req)

        if(errors.array().length > 0){
            return res.status(400).json({'errors': errors.array()})
        }

        const {requester} = res.locals
        const msId = req.body.msId; // Extract the msId from the request body
        const { name, description, getInvolved, url, color, tags, tagline, settings, logo, contact } = req.body.form; // Extract the form data from the request body

        if(tags.length == 0){
            return res.status(400).json({'errors': [{"msg": "Please add tags to make your club easily searchable"}]})
        }

        // if(requester.role == "student"){
        //     return res.status(400).json({'errors': [{"msg": "You can't create a club as a student yet"}]})
        // }

        try{
      
            const nameUsed = await Club.findOne({name: name})
            const urlUsed = await Club.findOne({url: url})

            if(nameUsed){
                return res.status(400).json({'errors': [{"msg": "Club name has already been used"}]})
            } else if (urlUsed){
                return res.status(400).json({'errors': [{"msg": "Club URL has already been used"}]})
            } else {
                const clubs = await new Club({name, description, getInvolved, sponsors: [msId.toString()], url: url, color, tags, tagline, settings, logo, contact})
                
                const user = await User.findOne({msId: msId});
  
                user.clubs.push(clubs._id)
                user.save()
                clubs.save()
                res.json(clubs)
            }
        } catch(err) {
            console.log(err)
            return res.status(500).json({'errors': [{"msg": "Server Error"}]})
        }
})



router.delete('/:clubURL', auth(), clubRole({authLevel: 'sponsor'}), async(req, res) => {

    try {
        const {club} = res.locals

        await club.remove()
        res.send("Success")
    } catch (err) {

        console.log(err)
        return res.status(500).json({'errors': [{"msg": "Server Error"}]})

    }
})

module.exports = router
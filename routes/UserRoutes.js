const express = require('express')
const router = express.Router()
const User = require('../Models/User')
const Club = require('../Models/Club')
const auth = require('../middleware/auth')


router.post("/", auth(), async (req,res)=>{
    
    const {requester} = res.locals

    try{
      const clubData = await User.findOne({
        msId: requester.user.localAccountId,
      }) 

      if(clubData){


        return res.json({...requester, clubData})
      } else {
        const newUser = new User({ msId: requester.user.localAccountId });
        console.log(newUser);
        newUser.save();
        return res.json({...requester, newUser})
      }

    } catch(err){
      console.log(err)
      return res.json({'errors': [{"msg": "Server Error"}]}).status(500)
    }
    

})

router.post("/bulk", auth(), async (req, res) => {
  const { idList } = req.body;

  try {
      const users = await User.find({
          msId: { $in: idList }
      });

      return res.json(users);

  } catch (err) {
      return res.status(500).json({ 'errors': [{ "msg": "Server Error" }] });
  }
});

router.post('/clubs', auth(), async(req, res) => {
 try{
    const {requester} = res.locals
    const msId = req.body.msId
    const clubUser = await User.findOne({
      msId: msId
    });
    const clubs = await Club.find({_id: {$in: clubUser.clubs}})

    res.json(clubs)
  } catch (err) {
    return res.json({'errors': [{"msg": "Server Error"}]}).status(500)
  }

})


router.get('/clubAnnouncements', auth(), async(req, res) => {

  const {requester} = res.locals

  try{
    const clubUser = await User.findOne(requester._id)

    const clubs = await Club.find({_id: {$in: clubUser.clubs}})



    const announcements = await Announcement.find({_id : {$in: club.announcements}})


    res.json(clubs)
  } catch (err) {
    return res.json({'errors': [{"msg": "Server Error"}]}).status(500)
  }

})

module.exports = router
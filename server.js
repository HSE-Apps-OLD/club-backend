const express = require('express')
const app = express()
const axios = require('axios')
const auth = require('./middleware/auth.js')
const cors = require('cors')
const dotenv = require('dotenv')
dotenv.config()


const {config} = require('./config')
console.log(config) 

const PORT = process.env.PORT || 3005

const mongo = require('./db/mongo')
mongo.on('open', () => console.log("Mongo Connected"))


app.use(cors())
app.use(express.json())

const clubRoutes = require("./routes/ClubRoutes")
const userRoutes = require("./routes/UserRoutes")

app.use('/club/', clubRoutes)
app.use('/user/', userRoutes)






app.get('/', (req,res) => {
 res.send("root route testing")
})


app.listen(PORT, (err) => err ? console.log(err) : console.log(`Running on port ${PORT}`))
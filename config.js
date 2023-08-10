/* const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');

const client = new SecretManagerServiceClient() */
const dotenv = require('dotenv')
dotenv.config()
const mongoURL = process.env.MONGO_URI
exports.config = {}

exports.setConfig = async () => {
/* 
    try{
        const [unParsed] = await client.accessSecretVersion({name: 'projects/hse-clubs/secrets/MONGO_URI/versions/latest'})
        
        exports.config.MONGO_URI = unParsed.payload.data.toString()


    } catch(err) {
        console.log(err) 
    } */

    exports.config.MONGO_URI = mongoURL
}

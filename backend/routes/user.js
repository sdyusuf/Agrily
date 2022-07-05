const express = require('express')
const router = express.Router()
const User = require('../models/user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const {sendMail, sendMailFull} = require('../utils/sendMail')
const { v4: uuidv4 } = require('uuid');
//const {ObjectID} = require('mongodb')

router.post('/api/signup', async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");

    try{
        
    const {firstName, lastName, email, password} = req.body

    const user = await User.findOne({email})

    if(user){
        res.status(409).json({message:'User already exists!'}) //one
    }
    const passwordHash = await bcrypt.hash(password, 10)

    const verificationString = uuidv4()

    const userData = new User({
        firstName,
        lastName,
        email,
        passwordHash,
        isVerified:false,
        verificationString
    })

    const result = await userData.save()
    const {_id} = result 

    console.log (_id);

    try{
        await sendMail(email, verificationString)
    }catch(e){
        console.log(e)
        res.send(e)
    }

    jwt.sign({
        id: _id,
        firstName,
        lastName,
        email,
        isVerified: false,
        verificationString
    }, process.env.JWT_SECRET,
    {expiresIn:'2d'},
    (err, token)=>{
        if(err){
            res.send(err)
        }
        res.status(200).json({token}) 
    })
    }catch(err){
        //res.send(err)
    }
    
})

router.post('/api/login', async(req, res)=>{

    try{
            res.header("Access-Control-Allow-Origin", "*");
            const {email, password} = req.body

            console.log(req.body)

            const user = await User.findOne({email})

            //console.log(user)

            if (!user) return res.sendStatus(401)

            const {_id, isVerified, passwordHash} = user;

            //console.log(password, passwordHash);

            const isCorrect = await bcrypt.compare(password, passwordHash)

            if(isCorrect){
                jwt.sign({
                    id: _id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email,
                    isVerified,
                }, process.env.JWT_SECRET,
                {expiresIn:'2d'},
                (err, token)=>{
                    if(err){
                        res.status(500).json(err)
                    }
                    res.status(200).json({token}) 
                })
            }else{
                res.sendStatus(401)
            }
    }catch(err){
        res.status(500).json(err)
    }
    

})

router.put('/verify', async (req, res) =>{
    res.header("Access-Control-Allow-Origin", "*");
    const {verificationString} = req.body
      
    if(!verificationString) return res.status(401).json({message:'verification string is empty'})

    const result = await User.findOne({verificationString})
    console.log(result)

    if(!result) return res.status(401).json({message:'The email verification code is incorrect!'})
    
    const { _id: id, email, isVerified} = result
  
    await User.updateOne({ _id: id }, {
        isVerified: true
      });  
 
    jwt.sign({id, email, isVerified:true}, process.env.JWT_SECRET, {expiresIn:'2d'}, (err, token) =>{
        if(err) return res.sendStatus(500)
        res.status(200).json({token})       
    })

    

})


router.put('/api/forgot-password/:email', async (req, res) =>{
    
    try{

    }catch(e){

    }

    res.header("Access-Control-Allow-Origin", "*");   
    const {email} = req.params
    console.log(email) 

    const passwordResetCode = uuidv4()
    

    const result = await User.updateOne({email}, { passwordResetCode})

    console.log(result)

    if (result.modifiedCount > 0){
        try{
            await sendMailFull(email, "Agrily - Reset your password", 
                                `To reset your password click this link http://localhost:3000/reset-password/`, 
                                passwordResetCode)
        }catch(e){
            //  console.log(e)
            res.sendStatus(500)
        }

        res.sendStatus(200)
        
    }   

})


router.put('/api/users/:passwordResetCode/reset-password', async (req, res) =>{
    res.header("Access-Control-Allow-Origin", "*"); 

    try{

        const {passwordResetCode} = req.params
        const {newPassword} = req.body

        const newPasswordHash = await bcrypt.hash(newPassword, 10)
        

        const result = await User.updateOne({passwordResetCode}, 
                                            { passwordHash:newPasswordHash,
                                            passwordResetCode:''})

        console.log(result)

        if (result.modifiedCount === 0) return res.sendStatus(404)

        res.sendStatus(200)

    }catch(e){
        res.sendStatus(404) 
    }
    
    

})





// router.post('/api/mail', (req, res)=>{
//     const mail = sendMail()
//     res.send('OK')
// })

module.exports = router 
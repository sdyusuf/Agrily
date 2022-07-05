const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth.js')
const Product = require('../models/Product')
const multer = require('../middleware/multer-config.js')

    router.get('/products', async (req, res) => {
        
        res.header("Access-Control-Allow-Origin", "*");

        try{ 
            const products = await Product.find();
            //const {name, quantity, ownerEmail, ownerName, isSold, soldDate, soldTo} = req.body
            res.status(200).json(products);
        }catch(err){
            res.send(err) 
            console.log(err)
        }  
    })


    router.get('/product/:id', async (req, res) => { // Find one product
        
        res.header("Access-Control-Allow-Origin", "*");

        try{
            const id = req.params.id;
            const product = await Product.findOne({_id: id});
            //const {name, quantity, ownerEmail, ownerName, isSold, soldDate, soldTo} = req.body
            res.status(200).json(product);

        }catch(err){
            res.send(err) 
            console.log(err)
        }
        
    })


    router.get('/products/:email', async (req, res) => { //Get multiple thigs based on email
        
        res.header("Access-Control-Allow-Origin", "*");

        try{
            const email = req.params.email;
            const products = await Product.find({email: email});
            //const {name, quantity, ownerEmail, ownerName, isSold, soldDate, soldTo} = req.body
            res.status(200).json(products);
            console.log(products)

        }catch(err){
            res.send(err) 
            console.log(err)
        }
        
    })


    router.post('/product', (req, res, next) =>{

        //console.log(req.file.filename)
        //console.log(JSON.stringify(req.body))
        
        console.log(req.body)


        //const url = req.protocol + '://' + req.get('host') + '/images/' +req.file.filename;

        //console.log(url)
    
        const product = new Product({
            name: req.body.name,
            quantity: req.body.quantity,
            imageURL: req.body.imageURL,
            ownerEmail: req.body.ownerEmail,
            ownerName: req.body.ownerName,
            description: req.body.description,
            price: req.body.price,
            isSold: false,
            soldDate: req.body.soldDate,
            soldTo: req.body.soldTo
            
        });

    product.save().then(
        () => {
        res.status(201).json({
            message: 'Product saved successfully!'
        });
        }
    ).catch(
        (error) => {
        res.status(400).json({
            error: error
        });
        }
    );

    })

    router.delete('/product/:id', async (req, res) => {
    
        res.header("Access-Control-Allow-Origin", "*");
    
        try{
            const id = req.params.id;
            const product = await Product.deleteOne({_id:id});
            //const {name, quantity, ownerEmail, ownerName, isSold, soldDate, soldTo} = req.body
            res.status(200).json({Mesage:'Deleted Successfully!'});
    
        }catch(err){
            res.send(err) 
            console.log(err)
        }
        
    })


    router.put('/product/:id', multer, (req, res) =>{

        const id = req.params.id;

        const url = req.protocol + '://' + req.get('host');
    
        const product = new Product({
            _id: id,
            name: req.body.name,
            quantity: req.body.quantity,
            imageURL: req.body.imageURL ,//url + '/images/' + req.file.filename,
            ownerEmail: req.body.ownerEmail,
            ownerName: req.body.ownerName,
            description: req.body.description,
            price: req.body.price,
            isSold: false,
            soldDate: req.body.soldDate,
            soldTo: req.body.soldTo
            
        });

        
        Product.updateOne({_id:id}, product).then(
            () => {
            res.status(201).json({
                message: 'Product Updated successfully!'
            });
            }
            ).catch(
            (error) => {
            res.status(400).json({
                error: error
            });
            }
        );
    })


module.exports = router 
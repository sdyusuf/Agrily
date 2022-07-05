const mongoose = require('mongoose');


//defining user schema
const productSchema = mongoose.Schema({
  //id: {type:String , required:true}, 
  name: {type: String, },
  quantity: {type: Number, },
  imageURL:{type:String, },
  ownerEmail: { type: String,  }, //To grab from useUser during data submission
  description: {type: String, },
  price: {type:Number, required:true},
  isSold: {type: Boolean, default: false}, //To assign when payment is made
  soldDate: {type: String}, // To assign when payment is made
  soldTo:{type: String} //To assign when payment is made
  
} );

//plugging unique validator to user schema
//userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Product', productSchema);
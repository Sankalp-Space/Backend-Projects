const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
// Deifne the User schema
const userSchema = new mongoose.Schema({
    name :{
        type: String,
        required: true
    },
    age :{
        type : Number,
        required: true
    },
    email :{
        type : String
    },
    mobile :{
        type : String,
        required: true
    },
    address :{
        type : String,
        required: true
    },
    uniqueIdNumber : { 
        type : Number,
        unique : true,
        required: true
    },
    password :{
        type : String,
        required: true
    },
    role : {
        type: String,
        enum: ['admin', 'voter'],
        default: 'voter'
    },
    isVoted: { 
        type: Boolean,
        default: false
    }

});
userSchema.pre('save', async function(next){
    const user =this;

    //Hash the password only if it has been modified(or is new)
    if(!user.isModified('password')) return next();


    try{
        //hash password generated
        const salt=await bcrypt.genSalt(10);
        //hash password 
        const hashPassword=await bcrypt.hash(user.password ,salt);

        //overwrites the plain password with the hashed one
        user.password=  hashPassword;
        next();

    }catch(err){ 
        return next(err);

    }

});
userSchema.methods.comparePassword = async function(candidatePassword){
    try{
        //Use bcrypt to compare the provided password with the hashed password
        const isMatch = await bcrypt.compare(candidatePassword, this.password);
        return isMatch;
    }catch(err){ 
        throw err;
    }
};
const User =mongoose.model('User',userSchema);
module.exports = User;

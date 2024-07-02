const express = require('express');
const router =express.Router();

const User = require('./../models/user');

const {jwtAuthMiddleware,generateToken}=require('./../jwt');


//post route to add a User
router.post('/signup', async(req, res)=> {
    try{
        const data = req.body; //Assumign the request body contain the user data
        //Creating a new User document using the Mongoose model
        const newUser = new User(data);
        //Saving the new User to the database
        const response = await newUser.save();
        console.log('User data saved');

        const payload={
            id: response.id,
        }
        console.log(JSON.stringify(payload));
        const token = generateToken(payload);
        console.log("Token is : ", token);
        res.status(200).json({response:response,token:token});
    }
    catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal server error'});

    }
})

//Login Route
router.post('/login',async (req, res) => {
    try{
        //Extract UID and passsword from request body
        const {uniqueIdNumber,password} = req.body;

        //Find ther user by username
        const user = await User.findOne({uniqueIdNumber: uniqueIdNumber});
        // If user does not exist or password does not match ,return error
        if(!user || !(await user.comparePassword(password))){
            return res.status(401).json({error: 'Invalid UID or password'});
        }

        //generate Token 
        const payload={
            id: user.id,
        }
    const token = generateToken(payload);

    //return Response
    res.json({token});
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal server error'});
    }

});

//Profile route
router.get('/profile',jwtAuthMiddleware,async (req, res) => { 
    try{
        const userData=req.user;
        const userId = userData.id;
        const user = await User.findById(userId);
        res.status(200).json({user});
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal server error'});

    }

});
router.put('/profile/password',jwtAuthMiddleware, async(req, res)=>{
    try{
        const UserId = req.user.id;//Extract the id from the token
        const { currentPassword, newPassword } = req.body; //Extract the current and new password from request body
        //Finding the user  by UserID
        const user =await User.findById(UserId);
        // If password does not match ,return error
        if(!(await user.comparePassword(currentPassword))){
            return res.status(401).json({error: 'Invalid UID or password'});
        }

        //updating the user's password
        user.password = newPassword;
        //Saving the updated user to the database
        const response = await user.save();
        console.log('password updated');
        res.status(200).json(response);
    }catch(err){

        console.log(err);
        res.status(500).json({error: 'Internal server error'});
    }
});

module.exports =router;

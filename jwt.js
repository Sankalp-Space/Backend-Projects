const jwt = require('jsonwebtoken');
const { constant } = require('lodash');

const jwtAuthMiddleware = (req,res,next) => {
    //First check the request header has authorization or not 
    const authorization = req.headers.authorization
    if(!authorization) return res.status(401).json({ error : 'Token not found '});


    //Extract the jwt token from the request header 
    const token = req.headers.authorization.split(' ')[1];
    if(!token) return res.status(401).json({ error: 'Unauthorized' });
    try{
        //verify the JWT token
        const deocded =jwt.verify(token,process.env.JWT_SECRET);
        
        //Attach user information to the request object
        req.user = deocded;
        next();

    }catch(err){
        console.error(err);
        res.status(401).json({ error: 'Invalid Token' });

    }

}
//Function  to generate JWT token
const generateToken =(userData)=>{
    //Generate a new JWT token using user data 
    return jwt.sign(userData,process.env.JWT_SECRET ,{expiresIn:50000});
}


module.exports = {jwtAuthMiddleware,generateToken}

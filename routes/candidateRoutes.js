const express = require('express');
const router =express.Router();

const Candidate = require('./../models/candidate');

const User = require('./../models/user');

const {jwtAuthMiddleware,generateToken}=require('./../jwt');

const checkAdminRole= async (userID) => {
    try{
        const user = await User.findById(userID);
        if(user.role === 'admin'){
            return true;
        }

    }catch(err){
        return false;
     }
};


//post route to add a Candidate
router.post('/',jwtAuthMiddleware, async(req, res)=> {
    try{
        if(!(await checkAdminRole(req.user.id))){
            return res.status(403).json({message: 'You are not Admin'});
        }
        const data = req.body; //Assumign the request body contain the Candidate data
        //Creating a new Candidate document using the Mongoose model
        const newCandidate = new Candidate(data);
        //Saving the new Candidate to the database
        const response = await newCandidate.save();
        console.log('Candidate data saved');
        res.status(200).json({response:response});
    }
    catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal server error'});

    }
})

router.put('/:candidateId',jwtAuthMiddleware, async(req, res)=>{
    try{
        if(!checkAdminRole(req.user.id)){
            return res.status(403).json({message: 'You are not Admin'});
        }
        const candidateId = req.params.candidateId;//Extract the id from the URL parameter
        const updatedCandidatedata = req.body;//update data for the candidate 
        const response =  await Candidate.findByIdAndUpdate(candidateId, updatedCandidatedata,{
            new: true,// return the updated document
            runValidators: true,//run mongoose validation
        });
        if (!response){
            return res.status(404).json({error: 'Candidate not found'});

        }
        console.log(' Candidate data updated');
        res.status(200).json(response);


    }catch(err){

        console.log(err);
        res.status(500).json({error: 'Internal server error'});
    }
});
router.delete('/:candidateId',jwtAuthMiddleware, async(req, res)=>{
    try{
        if(!checkAdminRole(req.user.id)){
            return res.status(403).json({message: 'You are not Admin'});
        }
        const candidateId = req.params.candidateId;//Extract the id from the URL parameter
        const response =  await Candidate.findByIdAndDelete(candidateId);
        if (!response){
            return res.status(404).json({error: 'Candidate not found'});

        }
        console.log(' Candidate deleted successfully');
        res.status(200).json(response);


    }catch(err){

        console.log(err);
        res.status(500).json({error: 'Internal server error'});
    }
});

//let's start Voting 
router.post('/vote/:candidateId',jwtAuthMiddleware, async(req, res) => {
    //no admin can vote 
    //user can only vote once
    const candidateId = req.params.candidateId;
    const userId = req.user.id;
    try{
        //Find the  Candidate document with the specified CandidateId
        const candidate = await Candidate.findById(candidateId);
        if(!candidate) {
            return res.status(404).json({error: 'Candidate not found'});
        }
        const user = await User.findById(userId);
        if(!user) {
            return res.status(404).json({error: 'User not found'});
        }
        if(user.isVoted){
            return res.status(403).json({error: 'You have already voted'});
        }
        if(user.role === 'admin'){
            return res.status(403).json({error: 'Admins are not allowed to vote'});
        }
        //If user is not admin and not voted, increment the vote count and update the user's voted status
        candidate.votes.push({user: userId});
        candidate.voteCount++;
        await candidate.save();

        user.isVoted = true;
        await user.save();
        res.status(200).json({message : 'Voted successfully'});
        }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal server error'});

    }
});;
//Vote Count 
router.get('/vote/count', async (req, res)=>{
    try{
        const candidates = await Candidate.find().sort({voteCount: 'desc'});
        const voteCounts = candidates.map((data)=>{
            return{
                party: data.partyName,
                count: data.voteCount,
            }
        } );
        res.status(200).json(voteCounts);

    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal server error'});
    }

});
router.get('/list', async (req, res)=>{
    try{
        // list of  all candidates
        const candidates = await Candidate.find({},'name partyName');
        // extracting only necessary data for response  
        /* const allCandidates = allCandidate.map((data)=>{
            return{
                id: data.id,
                partyName: data.partyName,
                candidateName: data.name,
        }}) */
        
        // sending the response with all candidates data  in descending order of votes  count  in JSON format  to the client  as a response to the GET request  /list  endpoint  
        res.status(200).json(candidates);

    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal server error'});
    }
})

module.exports =router;

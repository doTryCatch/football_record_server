const DataModel=require("./Schema")
require("./connectWithMongoose")
const express=require('express')

const fs = require('fs');
const csv = require('csv-parser');
const cors=require("cors")

const app=express()
const PORT=3001




app.use(cors())
app.use(express.json())
// get request handler
app.get("/",async(req,res)=>{
    let  mode,input;
    if(req.query.mode&& req.query.input){
        mode=req.query.mode
        input=req.query.input
    }
    console.log(mode,input)
    try {
        
        let Res = await DataModel.find();
        if ( Res.length === 0) {
                await new Promise((resolve, reject) => {
                    fs.createReadStream('FootbalCSV.csv')
                        .pipe(csv())
                        .on('data', async (data) => {
                            data.GamesPlayed = parseInt(data.GamesPlayed);
                            data.Win = parseInt(data.Win);
                            data.Draw = parseInt(data.Draw);
                            data.Loss = parseInt(data.Loss);
                            data.GoalsFor = parseInt(data.GoalsFor);
                            data.GoalsAgainst = parseInt(data.GoalsAgainst);
                            data.Points = parseInt(data.Points);
                            data.Year = parseInt(data.Year);
                            const footballData = new DataModel(data);
                            console.log(data)
                            await footballData.save();
                        })
                        .on('end', () => {
                            resolve();
                        })
                        .on('error', (error) => {
                            reject(error);
                        });
                });
            
        }
        
        Res = await DataModel.find();
        if(mode=="WinDrawLoss"){
            Res=Res.filter((data)=> data['Year']>parseInt(input))
            const { GamesPlayed, Win, Draw } = Res.reduce(
                (accumulator, data) => ({
                  GamesPlayed: accumulator.GamesPlayed + data.GamesPlayed,
                  Win: accumulator.Win + data.Win,
                  Draw: accumulator.Draw + data.Draw,
                }),
                { GamesPlayed: 0, Win: 0, Draw: 0 }
              );
            
              Res = [{ GamesPlayed, Win, Draw ,Year:input}];
              console.log(Res)

        }else if(mode=="TopTenRecord"){
            Res=Res.filter((data)=> data['Win']>parseInt(input))
            if(Res.length>10){
                Res=Res.splice(0,10)
            }
            console.log(Res)
            
           
          

    
        }else if(mode=="averageGoalFor"){
            Res=Res.filter((data)=> data['Year']===parseInt(input))
            Res = Res.map((data) => ({
                ...data._doc,
                ...{AverageGoalFor: (data['GoalsFor'] / data['GamesPlayed']).toFixed(2)}
              }));
        }
     
        res.status(200).json(Res);
    } catch (error) {

        res.status(500).json({ "message": "Internal server error" });
    }

}) 
//post request handler
app.post("/",async(req,res)=>{
   
    const data=req.body;
    // console.log(data)
    try {
        const footballData = new DataModel({
            "Team": data.team,
            "GamesPlayed": parseInt(data.gamesPlayed),
            "Win": parseInt(data.win),
            "Draw":parseInt(data.draw),
            "Loss": parseInt(data.loss),
            "GoalsFor": parseInt(data.goalsFor),
            "GoalsAgainst": parseInt(data.goalsAgainst),
            "Points": parseInt(data.points),
            "Year": parseInt(data.year)
           
        });

       
        await footballData.save();

       
        res.status(200).json({ message: 'newData saved successfully' });
    } catch (error) {
        console.error('Error saving document:', error);
    
        res.status(500).json({ error: 'Internal Server Error' });
    }
}) 
// update request handler
app.put("/",async(req,res)=>{
    const {data}=req.body;
    console.log(data)
    try{
        const Res = await DataModel.updateOne({Team:data.team,Year:parseInt(data.year) }, { $set: {[data.field]:parseInt(data.newValue)} });
     if( Res.matchedCount > 0){
         res.status(200).json({"msg":"successfully updated!!"})
     }else{
        res.status(200).json({"msg":"Data is not in the list. please give valid info!!"})           
     }

    
             
    }catch(err){
        console.error(err)
        res.status(200).json({"msg":" update failed!!"})  
    }
    
   


}) 
//delete request handler
app.delete("/",async(req,res)=>{
    const {team,year}=req.body;
    console.log({team,year})
    try{
         const Res=await DataModel.deleteOne({ Team:team,Year:parseInt(year)});
         if (Res.deletedCount>0){
            res.status(200).json({"msg":"successfully deleted!!"})
         }else{
            res.status(200).json({"msg":"Data is not in the list. please give valid info!!"})   
         }
       
         
    }catch(err){
        console.error(err)
    }

})
app.listen(PORT,()=>{
    console.log("server is live and ready to go!!")
})
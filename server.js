const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const express=require('express')
const app=express()
const cors=require("cors")
const PORT=3001

const DataModel=require("./Schema")
const databse='/FOOTBALL_RECORD_SET'
const url = "mongodb://127.0.0.1:27017";
mongoose.connect(url + databse,{ useNewUrlParser: true, useUnifiedTopology: true });

// ******************************8
app.use(cors())
app.use(express.json())


app.route("/")
.get(async (req,res)=>{
    let  mode,input;
    if(req.query.mode&& req.query.input){
        mode=req.query.mode
        input=req.query.input
    }
    try {
       
        let Res = await DataModel.find();
      

        if ( Res.length === 0) {
        
            try {
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
                            console.log('CSV file successfully saved');
                            resolve();
                        })
                        .on('error', (error) => {
                            reject(error);
                        });
                });
            } catch (err) {
                console.error("csv data is failed to insert in database",err);
                res.status(500).json({ "message": "Internal server error" });
                return; 
            }
        }

        Res = await DataModel.find();
        if(mode=="WDL"){
            Res=Res.filter((data)=> data['Year']>parseInt(input))
            const { GamesPlayed, Win, Draw } = Res.reduce(
                (accumulator, data) => ({
                  GamesPlayed: accumulator.GamesPlayed + data.GamesPlayed,
                  Win: accumulator.Win + data.Win,
                  Draw: accumulator.Draw + data.Draw,
                }),
                { GamesPlayed: 0, Win: 0, Draw: 0 }
              );
            
              
              // Assign the calculated values back to the 'Res' object if needed
              Res = [{ GamesPlayed, Win, Draw ,Year:input}];

        }else if(mode=="FTR"){
            Res=Res.filter((data)=> data['Win']>parseInt(input))
            if(Res.length>10){
                Res=Res.splice(0,10)
            }
            
           
          

    
        }else if(mode=="AGF"){
            Res=Res.filter((data)=> data['Year']===parseInt(input))
            Res = Res.map((data) => ({
                ...data._doc,
                ...{AverageGoalFor: (data['GoalsFor'] / data['GamesPlayed']).toFixed(2)}
              }));
        }
       console.log(Res)
       
        res.status(200).json(Res);
    } catch (error) {

        res.status(500).json({ "message": "Internal server error" });
    }

}).post(async(req,res)=>{
   
    const data=req.body;
    console.log(data)
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
}).put(async(req,res)=>{
    const {data}=req.body;
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
    
   


}).delete(async(req,res)=>{
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
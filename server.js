const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const express=require('express')
const app=express()
const cors=require("cors")
const PORT=process.env.PORT||3002
// **********************************8
const FootballDataModel=require("./mongoSchema")
// const url = "mongodb+srv://Raone:roshan12@cluster0.muoib0h.mongodb.net/";
const url = "mongodb://127.0.0.1:27017";




// Connect to MongoDB Atlas
mongoose.connect(url + '/FOOTBALL_RECORD_SET', { useNewUrlParser: true, useUnifiedTopology: true });




// *****************************888
//supporting function 
const sorting=(arr)=>{
for (let i = 0; i < arr.length-1; i++) {
   for (let j = i+1; j < arr.length; j++) {
    if(arr[i].Win<arr[j].Win){
        let temp=arr[i]
        arr[i]=arr[j]
        arr[j]=temp
    }
  
    
   }    
}

return arr
}
    

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
       
        let result = await FootballDataModel.find();
      

        if (!result || result.length === 0) {
            console.log("empty")
            try {
                await new Promise((resolve, reject) => {
                    fs.createReadStream('FootbalCSV.csv')
                        .pipe(csv())
                        .on('data', async (row) => {
                            row.GamesPlayed = parseInt(row.GamesPlayed);
                            row.Win = parseInt(row.Win);
                            row.Draw = parseInt(row.Draw);
                            row.Loss = parseInt(row.Loss);
                            row.GoalsFor = parseInt(row.GoalsFor);
                            row.GoalsAgainst = parseInt(row.GoalsAgainst);
                            row.Points = parseInt(row.Points);
                            row.Year = parseInt(row.Year);
                            const footballData = new FootballDataModel(row);
                            console.log(row)
                            await footballData.save();
                        })
                        .on('end', () => {
                            console.log('CSV file successfully processed');
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

        result = await FootballDataModel.find();
        if(mode=="WDL"){
            result=result.filter((item)=> item['Year']>parseInt(input))
            const { GamesPlayed, Win, Draw } = result.reduce(
                (accumulator, item) => ({
                  GamesPlayed: accumulator.GamesPlayed + item.GamesPlayed,
                  Win: accumulator.Win + item.Win,
                  Draw: accumulator.Draw + item.Draw,
                }),
                { GamesPlayed: 0, Win: 0, Draw: 0 }
              );
            
              
              // Assign the calculated values back to the 'result' object if needed
              result = [{ GamesPlayed, Win, Draw ,Year:input}];

        }else if(mode=="FTR"){
            result=result.filter((item)=> item['Win']>parseInt(input))
            result=sorting(result).slice(0,10)
          

    
        }else if(mode=="AGF"){
            result=result.filter((item)=> item['Year']===parseInt(input))
            result = result.map((item) => ({
                ...item._doc,
                ...{AverageGoalFor: (item['GoalsFor'] / item['GamesPlayed']).toFixed(2)}
              }));
        }
       console.log(result)
       
        res.status(200).json(result);
    } catch (error) {
        console.error("nothing happened");
        res.status(500).json({ "message": "Internal server error" });
    }

}).post(async(req,res)=>{
   
    const data=req.body;
    console.log(data)
    // team, gamesPlayed,win,draw,loss,goalsFor,goalsAgainst,points,year 
    try {
        const footballData = new FootballDataModel({
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

        // Save the document asynchronously using async/await
        await footballData.save();

        // Send a success response to the client
        res.status(200).json({ message: 'newData saved successfully' });
    } catch (error) {
        console.error('Error saving document:', error);
        // Send an error response to the client
        res.status(500).json({ error: 'Internal Server Error' });
    }
}).put(async(req,res)=>{
    const {data}=req.body;
    const team=data.team
    const year=data.year
    const field=data.field
    const newValue=data.newValue
    console.log( data)

    try{
        const result = await FootballDataModel.updateOne({Team:team,Year:parseInt(year) }, { $set: {[field]:parseInt(newValue)} });
      console.log(result)
      result.matchedCount > 0?  res.status(200).json({"msg":"successfully updated!!"}):res.status(200).json({"msg":"Data is not in the list. please give valid info!!"})           

    
             
    }catch(err){
        console.error(err)
        res.status(200).json({"msg":" update failed!!"})  
    }
    
   


}).delete(async(req,res)=>{
    const {team,year}=req.body;
    console.log({team,year})
    try{
         const result=await FootballDataModel.deleteOne({ Team:team,Year:parseInt(year)});
         console.log(result)
         result.deletedCount > 0?  res.status(200).json({"msg":"successfully deleted!!"})           :  res.status(200).json({"msg":"Data is not in the list. please give valid info!!"})           
    }catch(err){
        console.error(err)
    }
   
   

    // acknowledged: true,
    // modifiedCount: 0,
    // upsertedId: null,
    // upsertedCount: 0,
    // matchedCount: 1


})
app.listen(PORT,()=>{
    console.log("server is live!!")
})
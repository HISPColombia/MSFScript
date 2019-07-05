"use strict";
//import principal module and setting
const setting=require("./setting.json")
const DhisQuery =require('./modules/DhisQuery')
//Utility
const utility= require("./Utilities")
//create object
let DHISAppQuery = new DhisQuery(setting.testing)

async function settingParameters(id,de,co){
        let dv = await DHISAppQuery.getDataValueProgramIndicators(id);
        console.log(dv.rows)
        dv.rows.forEach(MetaValue=>{
                let pe= MetaValue[0]
                let ou= MetaValue[1]
                let value=MetaValue[2]
                DHISAppQuery.setDataValue(de,pe,co,ou,value)
        }) 

}
async function _run(){
        utility.ConvertToWeekDHIS()
        let pr=await DHISAppQuery.getProgramIndicators();
        pr.programIndicators.forEach(indicator => {
                if(indicator.aggregateExportCategoryOptionCombo!=undefined){ // 
                        let de=indicator.aggregateExportCategoryOptionCombo.split(".")[0]//DataElement
                        let co=indicator.aggregateExportCategoryOptionCombo.split(".")[1]//CategoryCombo
                        settingParameters(indicator.id,de,co)
                }
        });        
}
//start Script
_run()





"use strict";
//import principal module and setting
const setting=require("../setting.json")
const DhisQuery =require('../modules/DhisQuery')
//Utility
const utility= require("../modules/Utilities")
//create object
let DHISAppQuery = new DhisQuery(setting.testing)

async function getWeeks(){
        const startDate = await DHISAppQuery.getDataStore();
        const records = await DHISAppQuery.getValueUpdated(startDate.date);
        var listPeriods="";
        records.events.forEach(event=>{
                if(!listPeriods.includes(utility.ConvertToWeekDHIS(event.eventDate.substring(0,10)))) 
                        if(listPeriods=="")
                                listPeriods=utility.ConvertToWeekDHIS(event.eventDate.substring(0,10))
                        else
                                listPeriods=listPeriods+";"+utility.ConvertToWeekDHIS(event.eventDate.substring(0,10))
        })
        return listPeriods;       
}
async function settingParameters(id,de,co,periods){
        let dv = await DHISAppQuery.getDataValueProgramIndicators(id,periods);
        dv.rows.forEach(MetaValue=>{
                let pe= MetaValue[0]
                let ou= MetaValue[1]
                let value=MetaValue[2]
                console.log(MetaValue)
                DHISAppQuery.setDataValue(de,pe,co,ou,value)
        }) 

}
async function _run(){
        console.log("-Script para la agregación de indicadores")
        console.log("-MSF.2019")
        console.log("-Versión:0.1")
        var periods=await getWeeks()
        console.log("Periodo consultado (Semanas): ",periods)
        let pr=await DHISAppQuery.getProgramIndicators();
        //pr.programIndicators.forEach(indicator => {
             //   if(indicator.aggregateExportCategoryOptionCombo!=undefined){ // 
             //           let de=indicator.aggregateExportCategoryOptionCombo.split(".")[0]//DataElement
             //           let co=indicator.aggregateExportCategoryOptionCombo.split(".")[1]//CategoryCombo
             var indicator="",de="",co="" ;          
             settingParameters(indicator.id,de,co,periods)
             //   }
       // });        
}
//start Script
_run()






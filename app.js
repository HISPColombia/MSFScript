"use strict";
//import principal module and setting
const setting=require("./setting.json")
const DhisQuery =require('./modules/DhisQuery')
//create object
let DHISAppQuery = new DhisQuery(setting.primaryServer)
DHISAppQuery.getProgramIndicators().then(pr=>{
      pr.programIndicators.forEach(indicator => {
        if(indicator.aggregateExportCategoryOptionCombo!=undefined){ // 
                let de=indicator.aggregateExportCategoryOptionCombo.split(".")[0]//DataElement
                let co=indicator.aggregateExportCategoryOptionCombo.split(".")[1]//CategoryCombo

                DHISAppQuery.getDataValueProgramIndicators(indicator.id).then(dv=>{
                        let pe= dv.rows[0][0]
                        let ou= dv.rows[0][1]
                        let value=dv.rows[0][2]
                        DHISAppQuery.setDataValue(de,pe,co,ou,value)
                       
                })
        }
      }); 
})


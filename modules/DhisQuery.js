
module.exports = class DhisQuery {
     constructor(setting){
        this.setting=setting
     }
     //Method to query DHIS API
     _queryApi(url,method){
        const st=this.setting
        const d2=require("d2")
        let headers = new Headers(); 
        headers.set('Authorization', 'Basic ' + Buffer.from(st.user + ":" + st.password).toString('base64'));
        return fetch(url, {method,
                headers: headers,
            })
        .then(response => response.json())
        .then(json =>{return(json)});
     }
     //Method to get program indicators
      getProgramIndicators(){
        const st=this.setting
        let url=st.baseUrl+"programs/"+st.programID+"/programIndicators"
        return this._queryApi(url,"GET")
        .then(resp=>{
            return resp
        })
    }
    //Method to get data values calculated with the analytic dhis process
    getDataValueProgramIndicators(ProgramIndicator){
        const st=this.setting
        //let url = st.baseUrl+'analytics/events/query/'+st.programID+'?dimension=pe:'+st.period+'&dimension=ou:'+st.orgUnit+'&stage='+st.programStageID+'&displayProperty=NAME&outputType=EVENT&skipPaging=true'+'&dimension='+ProgramIndicator
        let url = st.baseUrl+'analytics/events/aggregate/'+st.programID+'?dimension=pe:'+st.period+'&dimension=ou:'+st.orgUnit+'&stage='+st.programStageID+'&displayProperty=NAME&outputType=EVENT&skipPaging=true'
        
        return this._queryApi(url,"GET")
        .then(resp=>{
            return resp
        })
    }
    getValueUpdated(startDate){
         const st=this.setting
         let url = st.baseUrl+'/events?program='+st.programID+'&lastUpdatedStartDate='+startDate
         return this._queryApi(url,"GET")
        .then(resp=>{
            return resp
        })
    }
    setDataValue(de,pe,co,ou,value){
        const st=this.setting
        let url = st.baseUrl+"dataValues?de="+de+"&pe="+pe+"&co="+co+"&ou="+ou+"&value="+value
        console.log(url)
        return this._queryApi(url,"POST")
        .then(resp=>{
            return resp
        })
    }
    
}


module.exports = class DhisQuery {
    constructor(setting){
       this.setting=setting
    }
    //Method to query DHIS API
    async _queryApi(url,method,body){
       const st=this.setting
       require("d2")
       let headers = new Headers(); 
       headers.set('Authorization', 'Basic ' + Buffer.from(st.user + ":" + st.password).toString('base64'));
       return await fetch(url, 
            {
            method,
            headers,
            body
            })
       .then(response => response.json())
       .then(json =>{return(json)});
    }
    //Method to get program indicators
     async getProgramIndicators(){
       const st=this.setting
       let url=st.baseUrl+"programs/"+st.programID+"/programIndicators"
       return await this._queryApi(url,"GET")
   }
   //Method to get data values calculated with the analytic dhis process
   async getDataValueProgramIndicators(ProgramIndicator,periods){
       const st=this.setting
       //let url = st.baseUrl+'analytics/events/query/'+st.programID+'?dimension=pe:'+st.period+'&dimension=ou:'+st.orgUnit+'&stage='+st.programStageID+'&displayProperty=NAME&outputType=EVENT&skipPaging=true'+'&dimension='+ProgramIndicator
       let url = st.baseUrl+'analytics/events/aggregate/'+st.programID+'?dimension=pe:'+periods+'&dimension=ou:'+st.orgUnit+'&stage='+st.programStageID+'&displayProperty=NAME&outputType=EVENT&skipPaging=true'
       return await this._queryApi(url,"GET")
       
   }
   async getValueUpdated(startDate){
        const st=this.setting
        let url = st.baseUrl+'events?fields=eventDate&paging=false&program='+st.programID+'&lastUpdatedStartDate='+startDate
        return await this._queryApi(url,"GET")
   }
   async setDataValue(de,pe,co,ou,value){
       const st=this.setting
       let url = st.baseUrl+"dataValues?de="+de+"&pe="+pe+"&co="+co+"&ou="+ou+"&value="+value
       return await this._queryApi(url,"POST")
   }
   async setDataStore(date){
    //curl "http://localhost:8080/dhis/api/dataStore/AppAggregateIndicators/LastDateExecuted" -X POST -H "Content-Type: application/json" -d "{\"date\":\"2019-07-02\"}" -u admin:district -v
    const st=this.setting
    let url = st.baseUrl+"dataStore/AppAggregateIndicators/LastDateExecuted"
    return await this._queryApi(url,"POST",JSON.stringify( {"date":date} ))
   }
   async getDataStore(){
    const st=this.setting
    let url = st.baseUrl+"dataStore/AppAggregateIndicators/LastDateExecuted" 
    return await this._queryApi(url,"GET")
   }
   
}

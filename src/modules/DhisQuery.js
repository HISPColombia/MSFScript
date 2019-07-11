
module.exports = class DhisQuery {
    constructor(setting,d2){
       this.setting=setting
       this.d2=d2;
    }
    //Method to query DHIS API

    async getResourceSelected(resource,method) {
        const api = this.d2.Api.getApi();
        let result = {};
        try {
            let res = await api.get(resource);
            //if (res.hasOwnProperty(resource)) {
                return res;
            //}
        }
        catch (e) {
            console.error('Could not access to API Resource');
        }
        return result;
    
    
    }
    async getResourceExternalSelected(url,method,body){
        const st=this.setting
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

    async setResourceSelected(resource,payload) {
        const api = this.d2.Api.getApi();
        let result = {};
        try {
            let res = await api.post('/' + resource,payload);
            return res;            
        }
        catch (e) {
            console.error('Could not access to API Resource');
        }
        return result;
    }

    //Method to get program indicators
     async getProgramIndicators(){
       const st=this.setting
       let url="programs/"+st.programID+"/programIndicators"
       return await this.getResourceSelected(url,"GET")
   }
     //Method to query organisation units associated to program
     async getOrganisationUnits(){
        const st=this.setting
        let url="programs/"+st.programID+"/organisationUnits?fields=id"
        return await this.getResourceSelected(url,"GET")
    }
   //Method to get data values calculated with the analytic dhis process
   async getDataValueProgramIndicators(ProgramIndicator,periods,ous){
       
        //let url = st.baseUrl+'analytics/events/query/'+st.programID+'?dimension=pe:'+st.period+'&dimension=ou:'+st.orgUnit+'&stage='+st.programStageID+'&displayProperty=NAME&outputType=EVENT&skipPaging=true'+'&dimension='+ProgramIndicator
       //let url = 'analytics/events/aggregate/'+st.programID+'?dimension=pe:'+periods+'&dimension=ou:'+ous+'&stage='+st.programStageID+'&displayProperty=NAME&outputType=EVENT&skipPaging=true'
        const st=this.setting
        let url="analytics?dimension=dx:"+ProgramIndicator+"&dimension=pe:"+periods+"&dimension=ou:"+ous+"&displayProperty=NAME"
        return await this.getResourceSelected(url,"GET")
       
   }
   async getValueUpdated(startDate){
        const st=this.setting
        let url = 'events?fields=eventDate&paging=false&program='+st.programID+'&lastUpdatedStartDate='+startDate
        return await this.getResourceSelected(url,"GET")
   }
   async setDataValue(de,pe,co,ou,value){
       const st=this.setting
       let url = "dataValues?de="+de+"&pe="+pe+"&co="+co+"&ou="+ou+"&value="+value
       return await this.getResourceSelected(url,"POST")
   }
   async setDataStore(date){
    //curl "http://localhost:8080/dhis/api/dataStore/AppAggregateIndicators/LastDateExecuted" -X POST -H "Content-Type: application/json" -d "{\"date\":\"2019-07-02\"}" -u admin:district -v
    const st=this.setting
    if(date==undefined){
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();
        date = yyyy+"-"+mm+"-"+dd;
    }
    let url = "dataStore/AppAggregateIndicators/LastDateExecuted"
    return await this.setResourceSelected(url,{"date":date})
   }
   async getDataStore(){
    const st=this.setting
    let url = "dataStore/AppAggregateIndicators/LastDateExecuted" 
    return await this.getResourceSelected(url,"GET")
   }
   
}

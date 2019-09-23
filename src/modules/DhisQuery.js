
module.exports = class DhisQuery {
    constructor(setting,d2){
       this.setting=setting
       this.d2=d2;
    }
    //Method to query DHIS API
    async ResourceExternalSelected(url,method,body){
        const st=this.setting
        let headers = new Headers(); 
        headers.append('Content-Type', 'application/json');
        headers.set('Authorization', 'Basic ' + Buffer.from(st.user + ":" + st.password).toString('base64'));
        return fetch(url, 
             {
             method,
             headers,
             body
             })
     }
         //Method to query DHIS API
    async ResourceExternalSelectedBulk(url,method,body){
        const st=this.setting
        let headers = new Headers(); 
        headers.append('Content-Type', 'application/json');
        headers.set('Authorization', 'Basic ' + Buffer.from(st.user + ":" + st.password).toString('base64'));
        return fetch(url, 
             {
             method,
             headers,
             body
             }).then(response => response.json())
             .catch(error => console.error('Error:', error));
     }
     async GetResourceExternalSelected(url,method){
        const st=this.setting
        let headers = new Headers(); 
        headers.append('Content-Type', 'application/json');
        headers.set('Authorization', 'Basic ' + Buffer.from(st.user + ":" + st.password).toString('base64'));
        return fetch(url, 
             {
             method,
             headers
             }).then(response => response.json())
             .catch(error => console.error('Error:', error));
     }


    async getResourceSelected(resource) {
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

    async upResourceSelected(resource,payload) {
        const api = this.d2.Api.getApi();
        let result = {};
        try {
            let res = await api.update('/' + resource,payload);
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
       let url="programs/"+st.programid+"/programIndicators?fields=id,name,programIndicatorGroups[code],aggregateExportCategoryOptionCombo"
       return await this.getResourceSelected(url)
   }
   //Method to get program indicators
   async getIndicators(){
    const st=this.setting
    let url="indicatorGroups/"+st.indicatorgroup+"?fields=indicators~rename(programIndicators)[id,name,indicatorGroups[attributeValues~rename(programIndicatorGroups)[value~rename(code)]],aggregateExportCategoryOptionCombo]"
    const indicators= await this.getResourceSelected(url)
    return indicators.programIndicators.map(i=>{
        var pig=i.indicatorGroups[0].programIndicatorGroups
        delete i["indicatorGroups"]
        i["programIndicatorGroups"]=pig
        return i
    })
    }
     //Method to query organisation units associated to program
     async getOrganisationUnits(){
        const st=this.setting
        let url="programs/"+st.programid+"/organisationUnits?fields=id,name,organisationUnitGroups[code]"
        return await this.getResourceSelected(url)
    }
   //Method to get data values calculated with the analytic dhis process
   async getDataValueProgramIndicators(indicators,periods,ous){       
        let url="analytics?dimension=dx:"+indicators+"&dimension=pe:"+periods+"&dimension=ou:"+ous+"&displayProperty=NAME"
        return await this.getResourceSelected(url)
       
   }
   async getValueUpdated(startDate){
        const st=this.setting
        let url = "events/query.json?programStage="+st.programstageid+"&lastUpdatedStartDate="+startDate+"&dataElement=TthnUslUbW7&order=lastUpdated:desc&totalPages=false"
        //let url = 'events?fields=eventDate&paging=false&program='+st.programid+'&lastUpdatedStartDate='+startDate
        return await this.getResourceSelected(url)
   }
   async setDataValue(de,pe,co,ou,value){
       let url = "dataValues?de="+de+"&pe="+pe+"&co="+co+"&ou="+ou+"&value="+value
       return await this.setResourceSelected(url)
   }
   async setDataValue_ExternalServer(urlBase,de,pe,co,ou,value){
    let url = urlBase+"dataValues?de="+de+"&pe="+pe+"&co="+co+"&ou="+ou+"&value="+value
    return await this.ResourceExternalSelected(url,"POST",{})
    }
    async setDataValue_ExternalServerBulk(urlBase,payload){
        const st=this.setting
        let url = urlBase+"dataValueSets?async="+st.async
        return await this.ResourceExternalSelectedBulk(url,"POST",payload)
        }
    async getSummary_ExternalServerBulk(urlBase,uid){
        const st=this.setting
        let url = urlBase+"system/taskSummaries/DATAVALUE_IMPORT/"+uid
        return await this.GetResourceExternalSelected(url,"GET")
        }
    async getTask_ExternalServerBulk(urlBase,uid){
        const st=this.setting
        let url = urlBase+"system/tasks/DATAVALUE_IMPORT/"+uid
        return await this.GetResourceExternalSelected(url,"GET")
        }
   async setLastDateExecuted(date){
    let url = "dataStore/AppAggregateIndicators/LastDateExecuted"
    return await this.setResourceSelected(url,date)
   }
   async upLastDateExecuted(date){
    let url = "dataStore/AppAggregateIndicators/LastDateExecuted"
    return await this.upResourceSelected(url,date)
   }
   async getLastDateExecuted(){
    let url = "dataStore/AppAggregateIndicators/LastDateExecuted" 
    return await this.getResourceSelected(url)
   }
   async setSetting(data){
    let url = "dataStore/AppAggregateIndicators/setting" 
    return await this.setResourceSelected(url,data)
   }
   async upSetting(data){
    let url = "dataStore/AppAggregateIndicators/setting" 
    return await this.upResourceSelected(url,data)
   }

   async getSetting(){
    let url = "dataStore/AppAggregateIndicators/setting" 
    return await this.getResourceSelected(url)
   }
   async getServerDate(){
    let url = "/system/info" 
    return await this.getResourceSelected(url)
   }
   
}

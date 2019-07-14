import React, { Component } from 'react'

//import principal module, utilities and setting
import DhisQuery from '../modules/DhisQuery'
import utility from "../modules/Utilities"
//materials
import RaisedButton from 'material-ui/RaisedButton';
import Paper from 'material-ui/Paper';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField';
import {Card, CardActions, CardHeader, CardText} from 'material-ui/Card';
//create object

const localStyle = {
    Main: {
        marginTop: 48
    },
    Dialog:{
        width: 350,
        maxWidth: 'none',
    },
    Console:{
        height: 800,
        width: '90%',
        margin: 20,
        textAlign: 'left',
        backgroundColor: '#000000',
        color:"#FFFFFF",
        overflowY: 'scroll'
      }

}

class Main extends Component {
    constructor(props) {
        super(props)
        this.state = {
            result:"\n Script para la agregación de indicadores \n MSF.2019 \n Versión:0.1",
            open: false,
            startDate:"",
            setting:{},
            fistSetting:false,
            fistImport:false
        }
    }
    
      async handleOpen(){
        this.setState({open: true});
      };
    
      handleClose(){
        this.setState({open: false});
      };
     handleSaveSetting(DHISAppQuery){
        //Create 
        if(this.state.fistSetting==true) 
            DHISAppQuery.setSetting(this.state.setting);
         else //update
            DHISAppQuery.upSetting(this.state.setting);
        this.handleClose();
      }

    handleSetValueForm(key, index, event, value) {
        let setting = this.state.setting
        setting[key] = value
        this.setState({ setting });
    }
    handleSetValueFormDate(key, index, event, value) {
        this.setState({NewstartDate:value });
    }
    
    setMatchObjects(key,arrayGroups,type){
        var listGroups={indicators:{},ous:{}};
        try{
         arrayGroups.forEach(group=>{
            
            if(listGroups[type][group.code]){
                listGroups[type][group.code]=listGroups[type][group.code]+";"+key;
            }
            else{
                listGroups[type][group.code]=key;
            }
             listGroups[type][group.code];
           console.log(listGroups)
        })
    }
    catch(err){
         undefined;
    }
    }
    async  getWeeks(DHISAppQuery){
        const records = await DHISAppQuery.getValueUpdated(this.state.startDate);
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
    async  getOrganisationUnits(DHISAppQuery){
        const records = await DHISAppQuery.getOrganisationUnits();
        var listOU=""
        records.organisationUnits.forEach(ou=>{
                if(!listOU.includes(ou.id)){
                    if(listOU=="")
                        listOU=ou.id
                    else
                        listOU=listOU+";"+ou.id
                this.setMatchObjects(ou.id,ou.organisationUnitGroups,"ous")
                } 

        })
        return listOU;       
    }
    async  settingParameters(DHISAppQuery,indicators,de,co,periods,ous){
            this.addResult("\n Step #3. Query data value (from program indicators).. \n");
            let dv = await DHISAppQuery.getDataValueProgramIndicators(indicators,periods,ous);
            dv.rows.forEach(MetaValue=>{
                    let pi=MetaValue[0]
                    let pe= MetaValue[1]
                    let ou= MetaValue[2]
                    let value=MetaValue[3]
                    this.addResult("\n--------------------------------------- \n")                    
                    this.addResult("\n Step #4. Importing data.. \n");
                    this.addResult("\n Period: "+ pe+" Organisation Unit: "+ou+"Value: "+value)
                    //DHISAppQuery.setDataValue(de,pe,co,ou,value)
            }) 

    }
    addResult(text){
        let result=this.state.result;
        result=result+text;
        this.setState({result})
    }
    async _run(){
        //Start setting
        const DHISAppQuery = new DhisQuery(this.state.setting,this.props.d2)
        ////
        var periods=await this.getWeeks(DHISAppQuery)
        this.addResult("\n--------------------------------------- \n")
        this.addResult("\n Step #1 . Setting Periods: "+ periods)        
        const ous=await this.getOrganisationUnits(DHISAppQuery);
        this.addResult("\n Step #2 .Setting Organisation Units: "+ ous)
        let pr=await DHISAppQuery.getProgramIndicators();
        pr.programIndicators.forEach(indicator => {
               if(indicator.aggregateExportCategoryOptionCombo!=undefined){ // 
                       let de=indicator.aggregateExportCategoryOptionCombo.split(".")[0]//DataElement
                       let co=indicator.aggregateExportCategoryOptionCombo.split(".")[1]//CategoryCombo     
                        this.settingParameters(DHISAppQuery,indicator.id,de,co,periods,ous)
              }
       });  
       //update date
       if(this.state.fistImport==true)
            DHISAppQuery.setLastDateExecuted({date:this.state.currentDate})
        else
            DHISAppQuery.upLastDateExecuted({date:this.state.currentDate})
    }
    async geTandShowLastUpdate(DHISAppQuery){
        const {date} = await DHISAppQuery.getLastDateExecuted();
        //get current date
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();
        var currentDate = yyyy+"-"+mm+"-"+dd;

        if(date==undefined)
            this.setState({startDate:currentDate,NewstartDate:currentDate,currentDate,fistImport:true});                     
        else
            this.setState({startDate:date,NewstartDate:currentDate,currentDate,fistImport:false});
         
        this.addResult("\n Última ejecución: "+this.state.startDate);

    }
    resetDate(DHISAppQuery){
        DHISAppQuery.upLastDateExecuted({date:this.state.NewstartDate})
        this.addResult("\n Última fecha de ejecución actualizada : "+this.state.NewstartDate);
        this.setState({startDate:this.state.NewstartDate,open: false})
    }
    async getSetting(DHISAppQuery){
         //get Setting
         const setting= await DHISAppQuery.getSetting()
         //first time
         let  fistSetting=false;
         if(Object.keys(setting).length==0)
             fistSetting=true;
         this.setState({setting,fistSetting});
         //
    }
    componentDidMount(){ 
        const DHISAppQuery = new DhisQuery(this.state.setting,this.props.d2)
        this.getSetting(DHISAppQuery);
        this.geTandShowLastUpdate(DHISAppQuery);       
    }
   
    render() {
        const {d2}=this.props
        const DHISAppQuery = new DhisQuery(this.state.setting,this.props.d2)
        const actions = [
            <FlatButton
              label={d2.i18n.getTranslation("BTN_CANCEL")}
              primary={true}
              onClick={()=>this.handleClose()}
            />,
            <FlatButton
              label={d2.i18n.getTranslation("BTN_SAVE")}
              primary={true}
              keyboardFocused={true}
              onClick={()=>this.handleSaveSetting(DHISAppQuery)}
            />,
          ];
          
        return (
            <div style={localStyle.Main}>
                <RaisedButton
                    label={d2.i18n.getTranslation("BTN_SETTING")}
                    primary={true}
                    keyboardFocused={true}
                    onClick={()=>this.handleOpen(DHISAppQuery)}
                />
                <RaisedButton
                    label={d2.i18n.getTranslation("BTN_RUN")}
                    primary={true}
                    keyboardFocused={true}
                    onClick={() => this._run()}
                />
                <Paper style={localStyle.Console} zDepth={1}>
                <pre>{this.state.result}</pre>
                </Paper>
                <Dialog
                title={d2.i18n.getTranslation("ST_TITLE")}
                actions={actions}
                modal={false}
                open={this.state.open}
                onRequestClose={()=>this.handleClose()}
                contentStyle={localStyle.Dialog}
                >
                     <TextField 
                     value={this.state.setting.programid} 
                     floatingLabelText={d2.i18n.getTranslation("ST_PROGRAMID")} 
                     onChange={(event, index, value) => this.handleSetValueForm("programid", value, event, index)}
                     /><br/>
                     <TextField 
                     value={this.state.setting.programstageid} 
                     floatingLabelText={d2.i18n.getTranslation("ST_PROGRAM_STAGEID")} 
                     onChange={(event, index, value) => this.handleSetValueForm("programstageid", value, event, index)}
       
                     /><br/>
                     
                     <TextField 
                     value={this.state.setting.url} 
                     floatingLabelText={d2.i18n.getTranslation("ST_REMOTE_URL")} 
                     onChange={(event, index, value) => this.handleSetValueForm("url", value, event, index)}
                     
                     />                     
                     <TextField 
                     value={this.state.setting.user} 
                     floatingLabelText={d2.i18n.getTranslation("ST_REMOTE_USER")} 
                     onChange={(event, index, value) => this.handleSetValueForm("user", value, event, index)}
                     
                     /><br/>
                     <TextField 
                     value={this.state.setting.password} 
                     floatingLabelText={d2.i18n.getTranslation("ST_REMOTE_PASSWORD")} 
                     type="password" 
                     onChange={(event, index, value) => this.handleSetValueForm("password", value, event, index)}
                     
                     /><br/>
                     <TextField 
                     value={this.state.setting.maxrecords} 
                     floatingLabelText={d2.i18n.getTranslation("ST_MAX_RECORDS")} 
                     onChange={(event, index, value) => this.handleSetValueForm("maxrecords", value, event, index)}
                     
                     /><br/>

                    <Card>
                        <CardHeader
                        title={d2.i18n.getTranslation("ST_RESET_DATE_IMPORT_TITLE")}
                        subtitle={d2.i18n.getTranslation("ST_RESET_DATE_IMPORT_DESC")}
                        actAsExpander={true}
                        showExpandableButton={true}
                        />
                        <CardText expandable={true}>
                        <TextField 
                            value={this.state.NewstartDate} 
                            style={{width:'50%'}}
                            floatingLabelText={d2.i18n.getTranslation("ST_RESET_DATE_IMPORT")} 
                            onChange={(event, index, value) => this.handleSetValueFormDate("NewstartDate", value, event, index)}
                            
                            /><RaisedButton style={{margin:20}} primary={true} label={d2.i18n.getTranslation("BTN_UPDATE")} onClick={()=>this.resetDate(DHISAppQuery)}/>
                        </CardText>

                    </Card>
                    <br/>

                </Dialog>

              </div>
        )
    }
}
Main.propTypes = {
    d2: React.PropTypes.object.isRequired
}
export default Main
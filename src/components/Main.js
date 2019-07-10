import React, { Component } from 'react'

//import principal module, utilities and setting
import setting from "../setting.json"
import DhisQuery from '../modules/DhisQuery'
import utility from "../modules/Utilities"
import RaisedButton from 'material-ui/RaisedButton';
import Paper from 'material-ui/Paper';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField';
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
        height: 400,
        width: '90%',
        margin: 20,
        textAlign: 'left',
        backgroundColor: '#000000',
        color:"#FFFFFF"
      }

}

class Main extends Component {
    constructor(props) {
        super(props)
        this.state = {
            result:"\n Script para la agregación de indicadores \n MSF.2019 \n Versión:0.1",
            open: false,
        }
    }
    
      handleOpen(){
        this.setState({open: true});
      };
    
      handleClose(){
        this.setState({open: false});
      };
    async  getWeeks(){
        const DHISAppQuery = new DhisQuery(setting.testing,this.props.d2)
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
    async  getOrganisationUnits(){
        const DHISAppQuery = new DhisQuery(setting.testing,this.props.d2)
        const records = await DHISAppQuery.getOrganisationUnits();
        var listOU=""
        records.organisationUnits.forEach(ou=>{
                if(!listOU.includes(ou.id)) 
                        if(listOU=="")
                        listOU=ou.id
                        else
                        listOU=listOU+";"+ou.id
        })
        return listOU;       
    }
    async  settingParameters(id,de,co,periods,ous){
            const DHISAppQuery = new DhisQuery(setting.testing,this.props.d2)
            let dv = await DHISAppQuery.getDataValueProgramIndicators(id,periods,ous);
            dv.rows.forEach(MetaValue=>{
                    let pe= MetaValue[0]
                    let ou= MetaValue[1]
                    let value=MetaValue[2]
                    console.log(MetaValue)
                    DHISAppQuery.setDataValue(de,pe,co,ou,value)
            }) 

    }
    addResult(text){
        let result=this.state.result;
        result=result+text;
        this.setState({result})
    }
    async _run(){
        var periods=await this.getWeeks()
        this.addResult("\n--------------------------------------- \n")
        this.addResult("\n Periodo consultado (Semanas): "+ periods)
        const DHISAppQuery = new DhisQuery(setting.testing,this.props.d2)
        const ous=await this.getOrganisationUnits();
        this.addResult("\n Unidades Organizativas incluidas: "+ ous)
        let pr=await DHISAppQuery.getProgramIndicators();
        //pr.programIndicators.forEach(indicator => {
             //   if(indicator.aggregateExportCategoryOptionCombo!=undefined){ // 
             //           let de=indicator.aggregateExportCategoryOptionCombo.split(".")[0]//DataElement
             //           let co=indicator.aggregateExportCategoryOptionCombo.split(".")[1]//CategoryCombo
             var indicator={id:""},de="",co="" ;          
             settingParameters(indicator.id,de,co,periods,ous)
             //   }
       // });        
    }
   
    render() {
        const {d2}=this.props
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
              onClick={()=>this.handleClose()}
            />,
          ];
          
        return (
            <div style={localStyle.Main}>
                <RaisedButton
                    label={d2.i18n.getTranslation("BTN_SETTING")}
                    primary={true}
                    keyboardFocused={true}
                    onClick={()=>this.handleOpen()}
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
                     <TextField hintText={d2.i18n.getTranslation("ST_PROGRAMID")} /><br/>
                     <TextField hintText={d2.i18n.getTranslation("ST_PROGRAM_STAGEID")} /><br/>
                     <TextField hintText={d2.i18n.getTranslation("ST_REMOTE_URL")} /><br/>
                     <TextField hintText={d2.i18n.getTranslation("ST_REMOTE_USER")} /><br/>
                     <TextField hintText={d2.i18n.getTranslation("ST_REMOTE_PASSWORD")} type="password" /><br/>

                </Dialog>

              </div>
        )
    }
}
Main.propTypes = {
    d2: React.PropTypes.object.isRequired
}
export default Main
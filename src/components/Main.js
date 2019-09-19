import React, { Component } from 'react'

//import principal module, utilities and setting
import DhisQuery from '../modules/DhisQuery'
import utility from "../modules/Utilities"
//materials
import RaisedButton from 'material-ui/RaisedButton';
import Paper from 'material-ui/Paper';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import Settings from 'material-ui/svg-icons/action/settings';
import TextField from 'material-ui/TextField';
import Avatar from 'material-ui/Avatar';
import Chip from 'material-ui/Chip';
import Toggle from 'material-ui/Toggle';
import { Card, CardHeader, CardText } from 'material-ui/Card';
import IconButton from 'material-ui/IconButton';
import {
    Table,
    TableBody,
    TableHeader,
    TableHeaderColumn,
    TableRow,
    TableRowColumn,
} from 'material-ui/Table';

//create object

const localStyle = {
    Main: {
        marginTop: 48
    },
    chip: {
        margin: 4,
    },
    wrapper: {
        display: 'flex',
        flexWrap: 'wrap',
    },
    Dialog: {
        width: 700,
        maxWidth: 'none',
    },
    DialogViewData: {
        width: '95%',
        maxWidth: 'none',
    },
    Console: {
        height: 150,
        width: '95%',
        margin: 20,
        textAlign: 'left',
        backgroundColor: '#000000',
        color: "#FFFFFF",
        overflowY: 'scroll'
    },
    tableResult: {
        height: 400,
        width: '95%',
        margin: 20,
        textAlign: 'left',
        overflowY: 'scroll'
    },
    btn: {
        margin: 5
    },
    textSetting: {
        margin: 10
    },
    setButton:{ margin: 20,display: 'flex',alignItems:'center'}

}

class Main extends Component {
    constructor(props) {
        super(props)
        this.state = {
            result: "\n Script para la agregación de indicadores \n MSF.2019 \n Versión:0.1",
            open: false,
            openvdata: false,
            startDate: "",
            setting: {},
            firstSetting: false,
            firstImport: false,
            rawIndicators: [],
            rawOrgUnits: [],
            dataImported: [],
            Summaryimported: 0,
            Summarynoimported: 0,
            Summaryerror: 0,
            dataValues:[],
            bulk:false
        }
    }

    handleOpen() {
        this.setState({ open: true });
    };

    handleClose() {
        this.setState({ open: false });
    };
    handleOpenViewData() {
        this.setState({ openvdata: true });
    };

    handleCloseViewData() {
        this.setState({ openvdata: false });
    };
    handleSaveSetting(DHISAppQuery) {
        //Create 
        if (this.state.firstSetting == true)
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
        this.setState({ startDate: value });
    }

    validateMatch(indicator, ou) {

        //find indicator
        const ind = this.state.rawIndicators.programIndicators.find(rawIndicator => {
            return rawIndicator.id == indicator;
        })
        if(ind.name.includes("Inpatient Days")){
            return ({
                ouId: undefined,
                ouName: undefined,
                inId: ind.id,
                indName: ind.name,
                de: ind.aggregateExportCategoryOptionCombo.split(".")[0],
                co: ind.aggregateExportCategoryOptionCombo.split(".")[1]
            })
        }
        if(ind.programIndicatorGroups.length==0){
            this.addResult("\n\n Warning, indicator "+indicator+" without programIndicatorGroups")
            return {ouId:undefined}
        }
       
         const group = ind.programIndicatorGroups[0].code;
        
        //find orgUnit
        const our = this.state.rawOrgUnits.organisationUnits.find(rawOrgUnit => {
            return rawOrgUnit.id == ou;
        })
        let indexGroup = our.organisationUnitGroups.findIndex(ouGroup => {
            return ouGroup.code == group //validates that the OU and the indicator have the same code
        })
        if (ind.aggregateExportCategoryOptionCombo!=undefined && our!=undefined && indexGroup > -1){
            return ({
                ouId: our.id,
                ouName: our.name,
                inId: ind.id,
                indName: ind.name,
                de: ind.aggregateExportCategoryOptionCombo.split(".")[0],
                co: ind.aggregateExportCategoryOptionCombo.split(".")[1]
            })
        }
        else{
            console.log("Testing >> Issue #10>>>> Indicator",indicator,"OU>>",ou,"Find Indicator",ind)
            this.addResult("\n\n Warning, no Match of programIndicatorGroups/organisationUnitGroups between indicator:"+indicator+" and org unit"+ou)
            return {ouId:undefined}
        }
    }
    async  getWeeks(DHISAppQuery) {
        const records = await DHISAppQuery.getValueUpdated(this.state.startDate);
        var listPeriods = "";
        if (records.rows.length < 1)
            return "withoutRecords";
        records.rows.forEach(event => {
            //Date exit report
            if(event[17]!="")
                if (!listPeriods.includes(utility.ConvertToWeekDHIS(event[17].substring(0, 10))))
                    if (listPeriods == "")
                        listPeriods = utility.ConvertToWeekDHIS(event[17].substring(0, 10))
                    else
                        listPeriods = listPeriods + ";" + utility.ConvertToWeekDHIS(event[17].substring(0, 10))
            //Date admission date
            if(event[7]!="")
                if (!listPeriods.includes(utility.ConvertToWeekDHIS(event[7].substring(0, 10))))
                    if (listPeriods == "")
                        listPeriods = utility.ConvertToWeekDHIS(event[7].substring(0, 10))
                    else
                        listPeriods = listPeriods + ";" + utility.ConvertToWeekDHIS(event[7].substring(0, 10))

        })
        return listPeriods;
    }
    async  getOrganisationUnits(DHISAppQuery) {
        const records = await DHISAppQuery.getOrganisationUnits();
        var listOU = ""
        this.setState({ rawOrgUnits: records })
        records.organisationUnits.forEach(ou => {
            if (!listOU.includes(ou.id)) {
                if (listOU == "")
                    listOU = ou.id
                else
                    listOU = listOU + ";" + ou.id
            }

        })
        return listOU;
    }
    async  getProgramIndicators(DHISAppQuery) {
        const records = await DHISAppQuery.getProgramIndicators();
        var listIndicator = [], kin = 0;
        this.setState({ rawIndicators: records })
        records.programIndicators.forEach((ind, index) => {
            if (listIndicator[kin] == undefined)
                listIndicator[kin] = ""
            if (!listIndicator[kin].includes(ind.id)) {
                if (listIndicator[kin] == "")
                    listIndicator[kin] = ind.id
                else
                    listIndicator[kin] = listIndicator[kin] + ";" + ind.id
            }
            //
            if (index % (this.state.setting.maxrecords) * 1 == 0 && index > 0) {
                kin = kin + 1;
            }

        })
        return listIndicator;
    }
    async finishExport(lastIndicatorGroup,DHISAppQuery){
        if(lastIndicatorGroup==true){
            if(this.state.bulk==true){
                var resp = await DHISAppQuery.setDataValue_ExternalServerBulk(this.state.setting.url,JSON.stringify({dataValues:this.state.dataValues})); 
                console.log(resp)    
            }
            this.addResult("\n\n Export has finished ")
        }
 
    }
    generateJsonToBulkExport(dataElement,period,categoryOptionCombo,orgUnit,value){
        let dataValues=this.state.dataValues
        dataValues.push({dataElement,period,categoryOptionCombo,orgUnit,value})
        this.setState({dataValues})
    }
    async saveDataValue(DHISAppQuery,dv,kdv,lastIndicatorGroup,acomulativeValue){
        if(kdv<dv.length){
            let MetaValue=dv[kdv]
            let pi = MetaValue[0]
            let pe = MetaValue[1]
            let ou = MetaValue[2]
            let value = MetaValue[3]
            value = value.split(".")[0];
            //validate match, If return ou id then there is match, else there is no match.
            let dataIndicator = this.validateMatch(pi, ou)
            if (dataIndicator.ouId != undefined) {
                this.addResult("\n From:\n\n Indicator: " + dataIndicator.inId + " \n Period: " + pe + "\n Organisation Unit: " + dataIndicator.ouId + " \n Value: " + value)
                this.addResult("\n\n To:\n\n Category: " + dataIndicator.co + "\n Data Element: " + dataIndicator.de)
                //Save in Data Set              

                //Local server
                //DHISAppQuery.setDataValue(dataIndicator.de,pe,dataIndicator.co,ou,value)
                //External Server
                if(this.state.bulk==false){
                    var resp = await DHISAppQuery.setDataValue_ExternalServer(this.state.setting.url,dataIndicator.de, pe, dataIndicator.co, ou, value);
                    if(resp.status==201){
                        //this.addResult("\n--------------------------------------- \n")
                        let dataImported = this.state.dataImported;
                        dataIndicator["value"] = value;
                        dataIndicator["period"] = pe;
                        dataImported.push(dataIndicator)
                        this.setState({ dataImported })
                        this.setState({ Summaryimported: this.state.Summaryimported + 1 })
                        kdv=kdv+1
                        this.saveDataValue(DHISAppQuery,dv,kdv,lastIndicatorGroup,acomulativeValue);
                    }
                    else{
                        this.addResult("\n -->>> API ERROR:  DataValue does't exported  \n")
                        this.setState({ Summarynoimported: this.state.Summarynoimported + 1 })
                    }
                }
                else{
                    this.generateJsonToBulkExport(dataIndicator.de, pe, dataIndicator.co, ou, value);
                    kdv=kdv+1
                    this.saveDataValue(DHISAppQuery,dv,kdv,lastIndicatorGroup,acomulativeValue);
                }
               
            }
            else{
                if(dataIndicator.indName.includes("Inpatient Days")){
                    acomulativeValue.value=acomulativeValue.value+value
                    if(acomulativeValue.metadata=={})
                        acomulativeValue.metadata={de:dataIndicator.de, pe, co:dataIndicator.co, ou}
                }
                kdv=kdv+1
                this.saveDataValue(DHISAppQuery,dv,kdv,lastIndicatorGroup,acomulativeValue); 
            }
        }
        else{ //Sum six indicator in one
            if(this.state.bulk==false){
                var resp = await DHISAppQuery.setDataValue_ExternalServer(this.state.setting.url,acomulativeValue.metadata.de,acomulativeValue.metadata.pe, acomulativeValue.metadata.co, acomulativeValue.metadata.ou, acomulativeValue.value);
                if(resp.status==201){
                    //this.addResult("\n--------------------------------------- \n")
                    let dataImported = this.state.dataImported;
                    dataIndicator["value"] = value;
                    dataIndicator["period"] = pe;
                    dataImported.push(dataIndicator)
                    this.setState({ dataImported })
                    this.setState({ Summaryimported: this.state.Summaryimported + 1 })
                }
                else{
                    this.addResult("\n -->>> API ERROR:  DataValue does't exported  \n")
                    this.setState({ Summarynoimported: this.state.Summarynoimported + 1 })
                }
            }
            else{ 
                this.generateJsonToBulkExport(acomulativeValue.metadata.de,acomulativeValue.metadata.pe, acomulativeValue.metadata.co, acomulativeValue.metadata.ou, acomulativeValue.value);
            }

            this.finishExport(lastIndicatorGroup,DHISAppQuery);            
        }
        
    }
    generateEmptyValue(indicators, periods, ous){

        var listIndicators=indicators.split(";")
        var listperiods=periods.split(";")
        var listous=ous.split(";")
        var listTotal=[]
        listIndicators.forEach(i=>{
            listperiods.forEach(p=>{
                 listous.forEach(o=>{
                    listTotal.push([i,p,o,0.0])
                })
            })
        })
        return listTotal
    }
    async  geTandSetAggregateIndicators(DHISAppQuery, indicators, periods, ous,lastIndicatorGroup) {
        // let dv = await DHISAppQuery.getDataValueProgramIndicators(indicators, periods, ous); //aquí consulta todos los indicadores de analiticas
        //aquí consulta todos los indicadores de analiticas 
        var kimport = 0;
        try {
            DHISAppQuery.getDataValueProgramIndicators(indicators, periods, ous).then(dv => {
                this.addResult("\n--------------------------------------- \n")
                this.addResult("\n Step #4. Exporting data to Remote server.. \n");
                this.addResult("\n--------------------------------------- \n")
                if (dv != undefined) {
                    if (dv.rows != undefined) {
                        if (dv.rows.length < 1) {
                            this.addResult("\n From:\n\n Indicator(s): " + indicators + " \n Period(s): " + periods + "\n Organisation Unit: " + ous)
                            this.addResult("\n -->>> There is no values to export  \n")
                           // var emptyValue=this.generateEmptyValue(indicators, periods, ous)
                            //console.log(">>Empty Value",emptyValue)
                            //this.saveDataValue(DHISAppQuery,emptyValue,0,lastIndicatorGroup)
                            this.setState({ Summarynoimported: this.state.Summarynoimported + 1 })
                            this.finishExport(lastIndicatorGroup,DHISAppQuery);
                        }
                        else{
                            this.saveDataValue(DHISAppQuery,dv.rows,0,lastIndicatorGroup,{metadata:{},value:0})
                            this.finishExport(lastIndicatorGroup,DHISAppQuery);
                        }
                    }//empty rows
                    else {
                        this.addResult("\n From:\n\n Indicator(s): " + indicators + " \n Period(s): " + periods + "\n Organisation Unit: " + ous)
                        this.addResult("\n API ERROR   \n")
                        this.setState({ Summaryerror: this.state.Summaryerror + 1 })
                        this.finishExport(lastIndicatorGroup,DHISAppQuery);
                    }
                }//empty dv
                else {
                    this.addResult("\n From:\n\n Indicator(s): " + indicators + " \n Period(s): " + periods + "\n Organisation Unit: " + ous)
                    this.addResult("\n API ERROR   \n")
                    this.setState({ Summaryerror: this.state.Summaryerror + 1 })
                    this.finishExport(lastIndicatorGroup,DHISAppQuery);
                }
            })
        }
        catch (err) {
            this.addResult("\n Step #4. Exporting data to Remote server.. \n");
            this.addResult("\nError:.------ \n");
            this.addResult(err)
            this.addResult("\n ------------- \n");
            this.finishExport(undefined,undefined);
        }

    }

    async addResult(text) {
        let result = this.state.result;
        let current_datetime = new Date()
        let formatted_date = current_datetime.getFullYear() + "-" + (current_datetime.getMonth() + 1) + "-" + current_datetime.getDate() + " " + current_datetime.getHours() + ":" + current_datetime.getMinutes() + ":" + current_datetime.getSeconds() 
        if(text!="")
            result =  formatted_date+" "+text+" "+result;
        this.setState({ result })
    }

    addZero(i) {
        if (i < 10) {
            i = "0" + i;
        }
        return i;
    }

    async geTandShowLastUpdate(DHISAppQuery) {
        const { date } = await DHISAppQuery.getLastDateExecuted();
        // current server Date
        const {serverDate} = await DHISAppQuery.getServerDate();
        var currentDate=serverDate
        var yyyy=serverDate.substring(0,4)
        var firstDate = yyyy + "-" + "01" + "-" + "01T01:01:01";
        if (date == undefined)
            this.setState({ firstDate: firstDate, startDate: firstDate, NewstartDate: currentDate, firstDate, firstImport: true });
        else
            this.setState({ startDate: date, NewstartDate: currentDate, firstImport: false });

        this.addResult("\n Last Execution: " + this.state.startDate);

    }
    resetDate(DHISAppQuery) {
        DHISAppQuery.upLastDateExecuted({ date: this.state.startDate })
        this.addResult("\n Last updated execution date : " + this.state.startDate);
        this.setState({open: false })
    }
    async getSetting(DHISAppQuery) {
        //get Setting
        const setting = await DHISAppQuery.getSetting()
        //first time
        let firstSetting = false;
        if (Object.keys(setting).length == 0)
            firstSetting = true;
        this.setState({ setting, firstSetting });
        //
    }
    sendSetOfIndicators(DHISAppQuery, pr, periods, ous,kind){
        if(kind<pr.length){
            let lastIndicatorGroup=false
             if(kind==pr.length-1)
                 lastIndicatorGroup=true             
            this.addResult("\n Step #3. Query data value (from program indicators) : " + pr[kind]);
            this.geTandSetAggregateIndicators(DHISAppQuery, pr[kind], periods, ous,lastIndicatorGroup).then(rep=>{
                kind=kind+1;
                this.sendSetOfIndicators(DHISAppQuery, pr, periods, ous,kind)
            });
        }
    }
    async _run() {
        //Start setting
        this.setState ({
            result: "\n Script para la agregación de indicadores \n MSF.2019 \n Versión:0.1",
            open: false,
            openvdata: false,
            startDate: "",
            rawIndicators: [],
            rawOrgUnits: [],
            dataImported: [],
            Summaryimported: 0,
            Summarynoimported: 0,
            Summaryerror: 0,
            dataValues:[]
        })

        const DHISAppQuery = new DhisQuery(this.state.setting, this.props.d2)
        await this.getSetting(DHISAppQuery);
        await this.geTandShowLastUpdate(DHISAppQuery);
        ////
        this.setState({ dataImported: [] })
        /////
        var periods = await this.getWeeks(DHISAppQuery)
        if (periods == "withoutRecords") {
            this.addResult("\n   . There is no event record in this period")
            return 0
        }
        this.addResult("\n--------------------------------------- \n")
        this.addResult("\n Step #1 . Setting Periods: " + periods)
        const ous = await this.getOrganisationUnits(DHISAppQuery);
        this.addResult("\n Step #2 .Setting Organisation Units: " + ous)
        let pr = await this.getProgramIndicators(DHISAppQuery);
        this.sendSetOfIndicators(DHISAppQuery, pr, periods, ous,0);
        //update date
        if (this.state.firstImport == true){
            DHISAppQuery.setLastDateExecuted({ date: this.state.firstDate })
            this.setState({startDate: this.state.firstDate})
        }
        else{
            DHISAppQuery.upLastDateExecuted({ date: this.state.NewstartDate })
            this.setState({startDate: this.state.NewstartDate})
        }
            
    }
    componentDidMount() {
        const DHISAppQuery = new DhisQuery(this.state.setting, this.props.d2)
        this.getSetting(DHISAppQuery);
        this.geTandShowLastUpdate(DHISAppQuery);
    }
    renderDatainTable() {
        const d2 = this.props.d2;
        return (
            <div style={localStyle.tableResult}>
                <div style={localStyle.wrapper}>
                    <Chip style={localStyle.chip}>
                        <Avatar size={32}>{this.state.Summaryimported}</Avatar>
                            Imported
                    </Chip>
                    <Chip  style={localStyle.chip}>
                        <Avatar size={32}>{this.state.Summarynoimported}</Avatar>
                            No Values
                    </Chip>
                    <Chip style={localStyle.chip}>
                        <Avatar size={32}>{this.state.Summaryerror}</Avatar>
                            Errors
                    </Chip>
                </div>
                <Table>
                    <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
                        <TableRow>
                            <TableHeaderColumn>{d2.i18n.getTranslation("TBL_INDICATOR_ID")}</TableHeaderColumn>
                            <TableHeaderColumn>{d2.i18n.getTranslation("TBL_INDICATOR_NAME")}</TableHeaderColumn>
                            <TableHeaderColumn>{d2.i18n.getTranslation("TBL_OU_ID")}</TableHeaderColumn>
                            <TableHeaderColumn>{d2.i18n.getTranslation("TBL_OU_NAME")}</TableHeaderColumn>
                            <TableHeaderColumn>{d2.i18n.getTranslation("TBL_PERIOD")}</TableHeaderColumn>
                            <TableHeaderColumn>{d2.i18n.getTranslation("TBL_DE")}</TableHeaderColumn>
                            <TableHeaderColumn>{d2.i18n.getTranslation("TBL_CO")}</TableHeaderColumn>
                            <TableHeaderColumn>{d2.i18n.getTranslation("TBL_VALUE")}</TableHeaderColumn>

                        </TableRow>
                    </TableHeader>
                    <TableBody displayRowCheckbox={false}>
                        {
                            this.state.dataImported.map(ind => {
                                return (
                                    <TableRow key={ind.inId + ind.ouId + ind.period}>
                                        <TableRowColumn>{ind.inId}</TableRowColumn>
                                        <TableRowColumn>{ind.indName}</TableRowColumn>
                                        <TableRowColumn>{ind.ouId}</TableRowColumn>
                                        <TableRowColumn>{ind.ouName}</TableRowColumn>
                                        <TableRowColumn>{ind.period}</TableRowColumn>
                                        <TableRowColumn>{ind.de}</TableRowColumn>
                                        <TableRowColumn>{ind.co}</TableRowColumn>
                                        <TableRowColumn>{ind.value}</TableRowColumn>
                                    </TableRow>
                                )
                            })
                        }


                    </TableBody>
                </Table>
            </div>)
    }
    renderSetting(DHISAppQuery) {
        const d2 = this.props.d2;
        return (<div>
            <TextField
                value={this.state.setting.programid}
                floatingLabelText={d2.i18n.getTranslation("ST_PROGRAMID")}
                onChange={(event, index, value) => this.handleSetValueForm("programid", value, event, index)}
                style={localStyle.textSetting}
            />
            <TextField
                value={this.state.setting.programstageid}
                floatingLabelText={d2.i18n.getTranslation("ST_PROGRAM_STAGEID")}
                onChange={(event, index, value) => this.handleSetValueForm("programstageid", value, event, index)}
                style={localStyle.textSetting}
            /><br />

            <TextField
                value={this.state.setting.url}
                floatingLabelText={d2.i18n.getTranslation("ST_REMOTE_URL")}
                onChange={(event, index, value) => this.handleSetValueForm("url", value, event, index)}
                style={localStyle.textSetting}
            />
            <TextField
                value={this.state.setting.user}
                floatingLabelText={d2.i18n.getTranslation("ST_REMOTE_USER")}
                onChange={(event, index, value) => this.handleSetValueForm("user", value, event, index)}
                style={localStyle.textSetting}
            /><br />
            <TextField
                value={this.state.setting.password}
                floatingLabelText={d2.i18n.getTranslation("ST_REMOTE_PASSWORD")}
                type="password"
                onChange={(event, index, value) => this.handleSetValueForm("password", value, event, index)}
                style={localStyle.textSetting}
            />
            <TextField
                value={this.state.setting.maxrecords}
                floatingLabelText={d2.i18n.getTranslation("ST_MAX_RECORDS")}
                onChange={(event, index, value) => this.handleSetValueForm("maxrecords", value, event, index)}
                style={localStyle.textSetting}
            /><br />

            <Card style={localStyle.textSetting}>
                <CardHeader
                    title={d2.i18n.getTranslation("ST_RESET_DATE_IMPORT_TITLE")}
                    subtitle={d2.i18n.getTranslation("ST_RESET_DATE_IMPORT_DESC")}
                    actAsExpander={true}
                    showExpandableButton={true}
                />
                <CardText expandable={true}>
                    <TextField
                        value={this.state.startDate}
                        style={{ width: '50%' }}
                        floatingLabelText={d2.i18n.getTranslation("ST_RESET_DATE_IMPORT")}
                        onChange={(event, index, value) => this.handleSetValueFormDate("startDate", value, event, index)}

                    /><RaisedButton style={{ margin: 20 }} primary={true} label={d2.i18n.getTranslation("BTN_UPDATE")} onClick={() => this.resetDate(DHISAppQuery)} />
                </CardText>

            </Card>
            <br />
        </div>
        )
    }

    render() {
        const { d2 } = this.props
        const DHISAppQuery = new DhisQuery(this.state.setting, this.props.d2)
        const actions = [
            <FlatButton
                label={d2.i18n.getTranslation("BTN_CANCEL")}
                primary={true}
                onClick={() => this.handleClose()}
            />,
            <FlatButton
                label={d2.i18n.getTranslation("BTN_SAVE")}
                keyboardFocused={true}
                primary={true}
                onClick={() => this.handleSaveSetting(DHISAppQuery)}
            />,
        ];
        const actionsViewData = [
            <FlatButton
                label={d2.i18n.getTranslation("BTN_CLOSE")}
                onClick={() => this.handleCloseViewData()}
            />
        ];

        return (
            <div style={localStyle.Main}>
                <div style={localStyle.setButton}>
               
                <Paper style={{marginTop:10, width:230}}>
                <div style={{margin: 5}}>
                
                <Toggle
                    label="change running mode"
                    defaultToggled={false}
                    onToggle={(event,value)=>{this.setState({bulk:value})}}
                    />
                </div>
                <RaisedButton
                    label={this.state.bulk?"Run Bulk Mode":"Run one by one mode"}
                    primary={true}
                    onClick={() => this._run()}
                    keyboardFocused={true}
                    style={localStyle.btn}
                />
                </Paper>
                 <div style={{marginLeft:'77%'}}>
                    <IconButton  tooltip={d2.i18n.getTranslation("BTN_SETTING")}  onClick={() => this.handleOpen(DHISAppQuery)}>
                        <Settings />
                    </IconButton>
                </div>
                {/* <RaisedButton
                    label={d2.i18n.getTranslation("BTN_DATA")}
                    onClick={() => this.handleOpenViewData()}
                    style={localStyle.btn}
                /> */}
                </div>
                {this.renderDatainTable()}
                <Paper style={localStyle.Console} zDepth={1}>
                    <pre>{this.state.result}</pre>
                </Paper>

                <Dialog
                    title={d2.i18n.getTranslation("ST_TITLE")}
                    actions={actions}
                    modal={false}
                    open={this.state.open}
                    onRequestClose={() => this.handleClose()}
                    contentStyle={localStyle.Dialog}
                    autoScrollBodyContent={true}
                >
                    {this.renderSetting(DHISAppQuery)}
                </Dialog>
                {/* <Dialog
                    title={d2.i18n.getTranslation("ST_TITLE_DATA")}
                    actions={actionsViewData}
                    modal={false}
                    open={this.state.openvdata}
                    onRequestClose={() => this.handleCloseViewData()}
                    contentStyle={localStyle.DialogViewData}
                >
                    {this.renderDatainTable()}
                </Dialog> */}

            </div>
        )
    }
}
Main.propTypes = {
    d2: React.PropTypes.object.isRequired
}
export default Main
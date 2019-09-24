import React, { Component } from 'react'

//import principal module, utilities and setting
import DhisQuery from '../modules/DhisQuery'
import utility from "../modules/Utilities"
//materials
import RaisedButton from 'material-ui/RaisedButton';
import Paper from 'material-ui/Paper';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import CloudDownload from 'material-ui/svg-icons/file/cloud-download'
import Settings from 'material-ui/svg-icons/action/settings';
import TextField from 'material-ui/TextField';
import Avatar from 'material-ui/Avatar';
import Chip from 'material-ui/Chip';
import Toggle from 'material-ui/Toggle';
import { Card, CardHeader, CardText } from 'material-ui/Card';
import IconButton from 'material-ui/IconButton';
import LinearProgress from 'material-ui/LinearProgress';
import Snackbar from 'material-ui/Snackbar';
import {
    Table,
    TableBody,
    TableHeader,
    TableHeaderColumn,
    TableRow,
    TableRowColumn,
} from 'material-ui/Table';
import { ContentAddCircleOutline } from 'material-ui/svg-icons';

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
    setButton: { margin: 20, display: 'flex', alignItems: 'center' }

}

class Main extends Component {
    constructor(props) {
        super(props)
        this.state = {
            result: "\n Script para la agregación de indicadores \n MSF.2019 \n Versión:0.1",
            open: false,
            openSnackBar: false,
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
            SummaryUpdated:0,
            SummaryIgnored:0,
            Summaryerror: 0,
            dataValues: [],
            bulk: true,
            downloadValue: undefined,
            running: false,
            send:false
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
        if (ind.programIndicatorGroups.length == 0) {
            this.addResult("\n\n Warning, indicator " + indicator + " without programIndicatorGroups")
            return { ouId: undefined }
        }

        const group = ind.programIndicatorGroups[0].code;

        //find orgUnit
        const our = this.state.rawOrgUnits.organisationUnits.find(rawOrgUnit => {
            return rawOrgUnit.id == ou;
        })
        let indexGroup = our.organisationUnitGroups.findIndex(ouGroup => {
            return ouGroup.code == group //validates that the OU and the indicator have the same code
        })
        if (ind.aggregateExportCategoryOptionCombo != undefined && our != undefined && indexGroup > -1) {
            return ({
                ouId: our.id,
                ouName: our.name,
                inId: ind.id,
                indName: ind.name,
                de: ind.aggregateExportCategoryOptionCombo.split(".")[0],
                co: ind.aggregateExportCategoryOptionCombo.split(".")[1]
            })
        }
        else {
            this.addResult("\n\n Warning, no Match of programIndicatorGroups/organisationUnitGroups between indicator:" + indicator + " and org unit" + ou)
            return { ouId: undefined }
        }
    }
    async  getWeeks(DHISAppQuery) {
        const records = await DHISAppQuery.getValueUpdated(this.state.startDate);
        var listPeriods = "";
        if (records.rows.length < 1)
            return "withoutRecords";
        records.rows.forEach(event => {
            //Date exit report
            if (event[17] != "")
                if (!listPeriods.includes(utility.ConvertToWeekDHIS(event[17].substring(0, 10))))
                    if (listPeriods == "")
                        listPeriods = utility.ConvertToWeekDHIS(event[17].substring(0, 10))
                    else
                        listPeriods = listPeriods + ";" + utility.ConvertToWeekDHIS(event[17].substring(0, 10))
            //Date admission date
            if (event[7] != "")
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
        const indicators = await DHISAppQuery.getIndicators()
        const Pindicators = records.programIndicators.concat(indicators)
        records.programIndicators = Pindicators

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
    async getSumaryBulkExport(DHISAppQuery,TaskUid){
        var resp = await DHISAppQuery.getTask_ExternalServerBulk(this.state.setting.url,TaskUid);
        if (resp[0].completed==true){
            var resp = await DHISAppQuery.getSummary_ExternalServerBulk(this.state.setting.url,TaskUid);
            this.setState({Summaryimported:resp.importCount.imported,SummaryUpdated:resp.importCount.updated,SummaryIgnored:resp.importCount.ignored})
            this.setState({ running: false, openSnackBar: true })
            this.addResult("\n\n Export has finished ")
        }
        else{
            setTimeout(()=>this.getSumaryBulkExport(DHISAppQuery,TaskUid),1000)
        }
    }
    async finishExport(lastIndicatorGroup, DHISAppQuery) {
        if (lastIndicatorGroup == true) {
            if (this.state.bulk == true && this.state.send==false) {
                this.setState({ send: true })
                var resp = await DHISAppQuery.setDataValue_ExternalServerBulk(this.state.setting.url, JSON.stringify({ dataValues: this.state.dataValues }));
               
                //generate json to download
                var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ dataValues: this.state.dataValues }));
                this.setState({ downloadValue: dataStr })
                //get Summary
                this.getSumaryBulkExport(DHISAppQuery,resp.response.id)
            }
            else{
                this.setState({ running: false, openSnackBar: true })
                this.addResult("\n\n Export has finished ")
            }


        }

    }
    generateJsonToBulkExport(dataElement, period, categoryOptionCombo, orgUnit, value) {
        let dataValues = this.state.dataValues
        dataValues.push({ dataElement, period, categoryOptionCombo, orgUnit, value })
        this.setState({ dataValues })
    }
    async saveDataValue(DHISAppQuery, dv, kdv, lastIndicatorGroup, cumulativeValue) {
        if (kdv < dv.length) {
            let MetaValue = dv[kdv]
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
                if (this.state.bulk == false) {
                    var resp = await DHISAppQuery.setDataValue_ExternalServer(this.state.setting.url, dataIndicator.de, pe, dataIndicator.co, ou, value);
                    if (resp.status == 201) {
                        //this.addResult("\n--------------------------------------- \n")
                        let dataImported = this.state.dataImported;
                        dataIndicator["value"] = value;
                        dataIndicator["period"] = pe;
                        dataImported.push(dataIndicator)
                        this.setState({ dataImported })
                        this.setState({ Summaryimported: this.state.Summaryimported + 1 })
                        kdv = kdv + 1
                        this.saveDataValue(DHISAppQuery, dv, kdv, lastIndicatorGroup, cumulativeValue);
                    }
                    else {
                        this.addResult("\n -->>> API ERROR:  DataValue does't exported  \n")
                        this.setState({ Summarynoimported: this.state.Summarynoimported + 1 })
                    }
                }
                else {

                    //result
                    let dataImported = this.state.dataImported;
                    dataIndicator["value"] = value;
                    dataIndicator["period"] = pe;
                    dataImported.push(dataIndicator)
                    this.setState({ dataImported })
                    //
                    this.generateJsonToBulkExport(dataIndicator.de, pe, dataIndicator.co, ou, value);
                    kdv = kdv + 1
                    this.saveDataValue(DHISAppQuery, dv, kdv, lastIndicatorGroup, cumulativeValue);
                }

            }
            else {
        
                this.addResult("\n -->>> METADATA ERROR:  program Indicator " + pi + " OrgUnit " + ou + " check aggregateExportCategoryOptionCombo and programIndicatorGroups \n")

                kdv = kdv + 1
                this.saveDataValue(DHISAppQuery, dv, kdv, lastIndicatorGroup, cumulativeValue);
            }
        }
        else { 
            this.finishExport(lastIndicatorGroup, DHISAppQuery);
        }

    }
    generateEmptyValue(indicators, periods, ous, values) {

        var listIndicators = indicators.split(";")
        var listperiods = periods.split(";")
        var listous = ous.split(";")
        var listTotal = []
        listIndicators.forEach(i => {
            listperiods.forEach(p => {
                listous.forEach(o => {
                    if (values.length > 1) {
                        values.forEach(v => {
                            if (i == v[0] && p == v[1] && o == v[2]) {
                                listTotal.push([i, p, o, v[3]])
                            }
                            else {
                                listTotal.push([i, p, o, "0.0"])
                            }
                        })
                    }
                    else {
                        listTotal.push([i, p, o, "0.0"])
                    }
                })
            })
        })
        return listTotal
    }
    async  geTandSetAggregateIndicators(DHISAppQuery, indicators, periods, ous, lastIndicatorGroup) {
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
                        if(this.state.setting.zerovalue==true){
                            var emptyValue = this.generateEmptyValue(indicators, periods, ous, dv.rows)
                            dv.rows = emptyValue
                        }
                        if (dv.rows.length < 1) {
                            this.addResult("\n From:\n\n Indicator(s): " + indicators + " \n Period(s): " + periods + "\n Organisation Unit: " + ous)
                            this.addResult("\n -->>> There is no values to export  \n")
                            this.setState({ Summarynoimported: this.state.Summarynoimported + 1 })
                            this.finishExport(lastIndicatorGroup, DHISAppQuery);
                        }
                        else {
                            this.saveDataValue(DHISAppQuery, dv.rows, 0, lastIndicatorGroup, { metadata: undefined, values: {}, value: 0 })
                            this.finishExport(lastIndicatorGroup, DHISAppQuery);
                        }
                    }//empty rows
                    else {
                        this.addResult("\n From:\n\n Indicator(s): " + indicators + " \n Period(s): " + periods + "\n Organisation Unit: " + ous)
                        this.addResult("\n API ERROR   \n")
                        this.setState({ Summaryerror: this.state.Summaryerror + 1 })
                        this.finishExport(lastIndicatorGroup, DHISAppQuery);
                    }
                }//empty dv
                else {
                    this.addResult("\n From:\n\n Indicator(s): " + indicators + " \n Period(s): " + periods + "\n Organisation Unit: " + ous)
                    this.addResult("\n API ERROR   \n")
                    this.setState({ Summaryerror: this.state.Summaryerror + 1 })
                    this.finishExport(lastIndicatorGroup, DHISAppQuery);
                }
            })
        }
        catch (err) {
            this.addResult("\n Step #4. Exporting data to Remote server.. \n");
            this.addResult("\nError:.------ \n");
            this.addResult(err)
            this.addResult("\n ------------- \n");
            this.finishExport(undefined, undefined);
        }

    }

    async addResult(text) {
        let result = this.state.result;
        let current_datetime = new Date()
        let formatted_date = current_datetime.getFullYear() + "-" + (current_datetime.getMonth() + 1) + "-" + current_datetime.getDate() + " " + current_datetime.getHours() + ":" + current_datetime.getMinutes() + ":" + current_datetime.getSeconds()
        if (text != "")
            result = formatted_date + " " + text + " " + result;
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
        const { serverDate } = await DHISAppQuery.getServerDate();
        var currentDate = serverDate
        var yyyy = serverDate.substring(0, 4)
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
        if (this.state.fixedDate == true)
            this.addResult("\n Working with Fixed Date: ")
        //
        this.handleSaveSetting(DHISAppQuery)
        this.setState({ open: false })
    }
    async getSetting(DHISAppQuery) {
        //get Setting
        const setting = await DHISAppQuery.getSetting()
        //first time
        let firstSetting = false;
        if (Object.keys(setting).length == 0)
            firstSetting = true;
        if(setting==""){
            this.setState({ setting:{}, firstSetting:false });
        }
        else{
            this.setState({ setting, firstSetting });
        }
 
        //
    }
    sendSetOfIndicators(DHISAppQuery, pr, periods, ous, kind) {
        if (kind < pr.length) {
            let lastIndicatorGroup = false
            if (kind == pr.length - 1)
                lastIndicatorGroup = true
            this.addResult("\n Step #3. Query data value (from program indicators) : " + pr[kind]);
            this.geTandSetAggregateIndicators(DHISAppQuery, pr[kind], periods, ous, lastIndicatorGroup).then(rep => {
                kind = kind + 1;
                this.sendSetOfIndicators(DHISAppQuery, pr, periods, ous, kind)
            });
        }
    }
    async _run() {
        //Start setting
        this.setState({
            result: "\n Script para la agregación de indicadores \n MSF.2019 \n Versión:0.1",
            open: false,
            openvdata: false,
            startDate: "",
            rawIndicators: [],
            rawOrgUnits: [],
            dataImported: [],
            Summaryimported: 0,
            Summarynoimported: 0,
            SummaryUpdated:0,
            SummaryIgnored:0,
            Summaryerror: 0,
            dataValues: [],
            downloadValue: undefined,
            running: true,
            send:false,
            openSnackBar: false,
        })

        const DHISAppQuery = new DhisQuery(this.state.setting, this.props.d2)
        await this.getSetting(DHISAppQuery);
        await this.geTandShowLastUpdate(DHISAppQuery);
        
        ////Delete using SQL View
        if(this.state.setting.deletedatavalues==true){
            const resp= await DHISAppQuery.DeleteValueUsingSQlView(this.state.setting.url,"ol50zCevR3K");
            this.addResult("\n Data values deleted")
            console.log(resp)
        }
      
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
        this.sendSetOfIndicators(DHISAppQuery, pr, periods, ous, 0);
        //update date
        if (this.state.fixedDate != true) {
            if (this.state.firstImport == true) {
                DHISAppQuery.setLastDateExecuted({ date: this.state.firstDate })
                this.setState({ startDate: this.state.firstDate })
            }
            else {
                DHISAppQuery.upLastDateExecuted({ date: this.state.NewstartDate })
                this.setState({ startDate: this.state.NewstartDate })
            }
        }
        else {
            this.addResult("\n Working with Fixed Date: ")
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
                    <Chip style={localStyle.chip}>
                        <Avatar size={32}>{this.state.SummaryUpdated}</Avatar>
                        Updated
                    </Chip>
                    <Chip style={localStyle.chip}>
                        <Avatar size={32}>{this.state.SummaryIgnored}</Avatar>
                        Ignored
                    </Chip>
                    <Chip style={localStyle.chip}>
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

                            <TableHeaderColumn style={{ width: '40%' }}>{d2.i18n.getTranslation("TBL_INDICATOR_NAME")}</TableHeaderColumn>
                            <TableHeaderColumn style={{ width: '20%' }}>{d2.i18n.getTranslation("TBL_OU_NAME")}</TableHeaderColumn>
                            <TableHeaderColumn>{d2.i18n.getTranslation("TBL_PERIOD")}</TableHeaderColumn>
                            <TableHeaderColumn>{d2.i18n.getTranslation("TBL_DE")}</TableHeaderColumn>
                            <TableHeaderColumn>{d2.i18n.getTranslation("TBL_CO")}</TableHeaderColumn>
                            <TableHeaderColumn>{d2.i18n.getTranslation("TBL_VALUE")}</TableHeaderColumn>

                        </TableRow>
                    </TableHeader>
                    <TableBody displayRowCheckbox={false}>

                        {
                            this.state.dataImported.map((ind, index) => {
                                return (
                                    <TableRow key={index + ind.inId + ind.ouId + ind.period}>

                                        <TableRowColumn style={{ width: '40%' }} title={ind.inId}>{ind.indName}</TableRowColumn>
                                        <TableRowColumn style={{ width: '20%' }} title={ind.ouId}>{ind.ouName} ({ind.ouId})</TableRowColumn>
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
            />
            <TextField
                value={this.state.setting.indicatorgroup}
                floatingLabelText={d2.i18n.getTranslation("ST_INDICATORGROUP")}
                onChange={(event, index, value) => this.handleSetValueForm("indicatorgroup", value, event, index)}
                style={localStyle.textSetting}
            />
            <br />

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
            <div style={{ width: 250, margin: 20, marginLeft: 10 }}>
                <Toggle
                    label="Async Mode"
                    defaultToggled={this.state.setting.async}
                    onToggle={(event, value) => this.handleSetValueForm("async", undefined, event, value)}
                />
            </div>
            <div style={{ width: 250, margin: 20, marginLeft: 10 }}>
                <Toggle
                    label="Save empty values as zero"
                    defaultToggled={this.state.setting.zerovalue}
                    onToggle={(event, value) => this.handleSetValueForm("zerovalue", undefined, event, value)}
                />
            </div>
            <div style={{ width: 250, margin: 20, marginLeft: 10 }}>
                <Toggle
                    label="Delete datavalues before to export"
                    defaultToggled={this.state.setting.deletedatavalues}
                    onToggle={(event, value) => this.handleSetValueForm("deletedatavalues", undefined, event, value)}
                />
            </div>
            <Card style={localStyle.textSetting}>
                <CardHeader
                    title={d2.i18n.getTranslation("ST_RESET_DATE_IMPORT_TITLE")}
                    subtitle={d2.i18n.getTranslation("ST_RESET_DATE_IMPORT_DESC")}
                    actAsExpander={true}
                    showExpandableButton={true}
                />
                <CardText expandable={true}>
                    <div style={{ width: 345, marginLeft: 5 }}>
                        <Toggle
                            label="Work with fixed date"
                            defaultToggled={this.state.setting.fixedDate}
                            onToggle={(event, value) => this.handleSetValueForm("fixedDate", undefined, event, value)}
                        />
                    </div>
                    <TextField
                        value={this.state.startDate}
                        style={{ width: '50%' }}
                        disabled={!this.state.setting.fixedDate}
                        floatingLabelText={d2.i18n.getTranslation("ST_RESET_DATE_IMPORT")}
                        onChange={(event, index, value) => this.handleSetValueFormDate("startDate", value, event, index)}

                    />

                    <RaisedButton disabled={!this.state.setting.fixedDate} style={{ margin: 20 }} primary={true} label={d2.i18n.getTranslation("BTN_UPDATE")} onClick={() => this.resetDate(DHISAppQuery)} />

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
                <Snackbar
                    open={this.state.openSnackBar}
                    message="Export has finished"
                    autoHideDuration={4000}
                    contentStyle={{ fontSize: 'large', fontWeight: 'bold' }}

                />
                <div style={localStyle.setButton}>

                    <Paper style={{ marginTop: 10, width: 250 }}>
                        <RaisedButton
                            label={"Aggregate Data"}
                            primary={true}
                            onClick={() => this._run()}
                            keyboardFocused={true}
                            style={localStyle.btn}
                            disabled={this.state.running}
                        />
                         {this.state.bulk ?
                            <FlatButton
                                href={this.state.downloadValue}
                                download="data.json"
                                target="_blank"
                                secondary={true}
                                disabled={this.state.downloadValue == undefined ? true : false}
                                icon={<CloudDownload />}
                            /> : ""}
                        <div style={{ margin: 5 }}>

                            <Toggle
                                label={this.state.bulk ? "Bulk" : "One by one"}
                                defaultToggled={this.state.bulk}
                                onToggle={(event, value) => { this.setState({ bulk: value }) }}
                                labelPosition="right"
                                disabled={this.state.running}
                            />
                            </div>

                        {this.state.running ? <LinearProgress mode="indeterminate" /> : ""}
                    </Paper>
                    <div style={{ marginLeft: '77%' }}>
                        <IconButton tooltip={d2.i18n.getTranslation("BTN_SETTING")} onClick={() => this.handleOpen(DHISAppQuery)}>
                            <Settings />
                        </IconButton>
                    </div>
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

            </div>
        )
    }
}
Main.propTypes = {
    d2: React.PropTypes.object.isRequired
}
export default Main
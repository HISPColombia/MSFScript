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
import { Card, CardHeader, CardText } from 'material-ui/Card';
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
    Dialog: {
        width: 350,
        maxWidth: 'none',
    },
    DialogViewData: {
        width: '95%',
        maxWidth: 'none',
    },
    Console: {
        height: 800,
        width: '90%',
        margin: 20,
        textAlign: 'left',
        backgroundColor: '#000000',
        color: "#FFFFFF",
        overflowY: 'scroll'
    },
    btn: {
        margin: 5
    }

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
            fistSetting: false,
            fistImport: false,
            rawIndicators: [],
            rawOrgUnits: [],
            dataImported: []
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
        if (this.state.fistSetting == true)
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
        this.setState({ NewstartDate: value });
    }

    validateMatch(indicator, ou) {

        //find indicator
        const ind = this.state.rawIndicators.programIndicators.find(rawIndicator => {
            return rawIndicator.id == indicator;
        })
        const group = ind.programIndicatorGroups[0].id;
        //find orgUnit
        const our = this.state.rawOrgUnits.organisationUnits.find(rawOrgUnit => {
            let indexGroup = rawOrgUnit.organisationUnitGroups.findIndex(ouGroup => {
                return ouGroup = group //validates that the OU and the indicator have the same code
            })
            return (rawOrgUnit.id == ou && indexGroup > -1);
        })

        return ({
            ouId: our.id,
            ouName: our.name,
            inId: ind.id,
            indName: ind.name,
            de: ind.aggregateExportCategoryOptionCombo.split(".")[0],
            co: ind.aggregateExportCategoryOptionCombo.split(".")[1]
        })
    }
    async  getWeeks(DHISAppQuery) {
        const records = await DHISAppQuery.getValueUpdated(this.state.startDate);
        var listPeriods = "";
        records.events.forEach(event => {
            if (!listPeriods.includes(utility.ConvertToWeekDHIS(event.eventDate.substring(0, 10))))
                if (listPeriods == "")
                    listPeriods = utility.ConvertToWeekDHIS(event.eventDate.substring(0, 10))
                else
                    listPeriods = listPeriods + ";" + utility.ConvertToWeekDHIS(event.eventDate.substring(0, 10))
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
    async  geTandSetAggregateIndicators(DHISAppQuery, indicators, periods, ous) {
        let dv = await DHISAppQuery.getDataValueProgramIndicators(indicators, periods, ous);
        dv.rows.forEach(MetaValue => {
            let pi = MetaValue[0]
            let pe = MetaValue[1]
            let ou = MetaValue[2]
            let value = MetaValue[3]
            //validate match, If return ou id then there is match, else there is no match.
            let dataIndicator = this.validateMatch(pi, ou)
            if (dataIndicator.ouId != undefined) {
                this.addResult("\n--------------------------------------- \n")
                this.addResult("\n Step #4. Importing data.. \n");
                this.addResult("\n--------------------------------------- \n")
                this.addResult("\n From:\n\n Indicator: " + dataIndicator.inId + " \n Period: " + pe + "\n Organisation Unit: " + dataIndicator.ouId + " \n Value: " + value)
                this.addResult("\n\n To:\n\n Category: " + dataIndicator.co + "\n Data Element: " + dataIndicator.de)
                //Save in Data Set
                value=value.split(".")[0];
                DHISAppQuery.setDataValue(dataIndicator.de,pe,dataIndicator.co,ou,value)
                this.addResult("\n--------------------------------------- \n")
                let dataImported = this.state.dataImported;
                dataIndicator["value"] = value;
                dataIndicator["period"] = pe;
                dataImported.push(dataIndicator)
                this.setState({ dataImported })
            }
        })

    }

    async addResult(text) {
        let result = this.state.result;
        result = result + text;
        this.setState({ result })
    }

    async geTandShowLastUpdate(DHISAppQuery) {
        const { date } = await DHISAppQuery.getLastDateExecuted();
        //get current date 2019-07-25T07:10:24.026
        var today = new Date();
        var h = addZero(today.getHours());
        var m = addZero(today.getMinutes());
        var s = addZero(today.getSeconds());
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();
        var currentDate = yyyy + "-" + mm + "-" + dd+"T"+h+":"+m+":"+s;

        if (date == undefined)
            this.setState({ startDate: currentDate, NewstartDate: currentDate, currentDate, fistImport: true });
        else
            this.setState({ startDate: date, NewstartDate: currentDate, currentDate, fistImport: false });

        this.addResult("\n Última ejecución: " + this.state.startDate);

    }
    resetDate(DHISAppQuery) {
        DHISAppQuery.upLastDateExecuted({ date: this.state.NewstartDate })
        this.addResult("\n Última fecha de ejecución actualizada : " + this.state.NewstartDate);
        this.setState({ startDate: this.state.NewstartDate, open: false })
    }
    async getSetting(DHISAppQuery) {
        //get Setting
        const setting = await DHISAppQuery.getSetting()
        //first time
        let fistSetting = false;
        if (Object.keys(setting).length == 0)
            fistSetting = true;
        this.setState({ setting, fistSetting });
        //
    }
    async _run() {
        //Start setting
        const DHISAppQuery = new DhisQuery(this.state.setting, this.props.d2)
        ////
        this.setState({ dataImported: [] })
        /////
        var periods = await this.getWeeks(DHISAppQuery)
        this.addResult("\n--------------------------------------- \n")
        this.addResult("\n Step #1 . Setting Periods: " + periods)
        const ous = await this.getOrganisationUnits(DHISAppQuery);
        this.addResult("\n Step #2 .Setting Organisation Units: " + ous)
        let pr = await this.getProgramIndicators(DHISAppQuery);
        pr.forEach(indicators => {
            this.addResult("\n Step #3. Query data value (from program indicators) : " + indicators);
            this.geTandSetAggregateIndicators(DHISAppQuery, indicators, periods, ous)
        });
        //update date
        if (this.state.fistImport == true)
            DHISAppQuery.setLastDateExecuted({ date: this.state.currentDate })
        else
            DHISAppQuery.upLastDateExecuted({ date: this.state.currentDate })
    }
    componentDidMount() {
        const DHISAppQuery = new DhisQuery(this.state.setting, this.props.d2)
        this.getSetting(DHISAppQuery);
        this.geTandShowLastUpdate(DHISAppQuery);
    }
    renderDatainTable() {
        const d2 = this.props.d2;
        return (
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
                                <TableRow>
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
            </Table>)
    }
    renderSetting(DHISAppQuery) {
        const d2 = this.props.d2;
        return (<div>
            <TextField
                value={this.state.setting.programid}
                floatingLabelText={d2.i18n.getTranslation("ST_PROGRAMID")}
                onChange={(event, index, value) => this.handleSetValueForm("programid", value, event, index)}
            /><br />
            <TextField
                value={this.state.setting.programstageid}
                floatingLabelText={d2.i18n.getTranslation("ST_PROGRAM_STAGEID")}
                onChange={(event, index, value) => this.handleSetValueForm("programstageid", value, event, index)}

            /><br />

            <TextField
                value={this.state.setting.url}
                floatingLabelText={d2.i18n.getTranslation("ST_REMOTE_URL")}
                onChange={(event, index, value) => this.handleSetValueForm("url", value, event, index)}

            />
            <TextField
                value={this.state.setting.user}
                floatingLabelText={d2.i18n.getTranslation("ST_REMOTE_USER")}
                onChange={(event, index, value) => this.handleSetValueForm("user", value, event, index)}

            /><br />
            <TextField
                value={this.state.setting.password}
                floatingLabelText={d2.i18n.getTranslation("ST_REMOTE_PASSWORD")}
                type="password"
                onChange={(event, index, value) => this.handleSetValueForm("password", value, event, index)}

            /><br />
            <TextField
                value={this.state.setting.maxrecords}
                floatingLabelText={d2.i18n.getTranslation("ST_MAX_RECORDS")}
                onChange={(event, index, value) => this.handleSetValueForm("maxrecords", value, event, index)}

            /><br />

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
                        style={{ width: '50%' }}
                        floatingLabelText={d2.i18n.getTranslation("ST_RESET_DATE_IMPORT")}
                        onChange={(event, index, value) => this.handleSetValueFormDate("NewstartDate", value, event, index)}

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
                primary={true}
                keyboardFocused={true}
                onClick={() => this.handleSaveSetting(DHISAppQuery)}
            />,
        ];
        const actionsViewData = [
            <FlatButton
                label={d2.i18n.getTranslation("BTN_CLOSE")}
                primary={true}
                onClick={() => this.handleCloseViewData()}
            />
        ];

        return (
            <div style={localStyle.Main}>
                <RaisedButton
                    label={d2.i18n.getTranslation("BTN_SETTING")}
                    primary={true}
                    keyboardFocused={true}
                    onClick={() => this.handleOpen(DHISAppQuery)}
                    style={localStyle.btn}
                />
                <RaisedButton
                    label={d2.i18n.getTranslation("BTN_RUN")}
                    primary={true}
                    keyboardFocused={true}
                    onClick={() => this._run()}
                    style={localStyle.btn}
                />
                <RaisedButton
                    label={d2.i18n.getTranslation("BTN_DATA")}
                    primary={true}
                    keyboardFocused={true}
                    onClick={() => this.handleOpenViewData()}
                    style={localStyle.btn}
                />
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
                >
                    {this.renderSetting(DHISAppQuery)}
                </Dialog>
                <Dialog
                    title={d2.i18n.getTranslation("ST_TITLE_DATA")}
                    actions={actionsViewData}
                    modal={false}
                    open={this.state.openvdata}
                    onRequestClose={() => this.handleCloseViewData()}
                    contentStyle={localStyle.DialogViewData}
                >
                    {this.renderDatainTable()}
                </Dialog>

            </div>
        )
    }
}
Main.propTypes = {
    d2: React.PropTypes.object.isRequired
}
export default Main
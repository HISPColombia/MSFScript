import React from 'react';
import HeaderBarComponent from 'd2-ui/lib/app-header/HeaderBar';
import headerBarStore$ from 'd2-ui/lib/app-header/headerBar.store';
import withStateFrom from 'd2-ui/lib/component-helpers/withStateFrom';


//Material Components
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import appTheme from '../theme';
import Main from './Main'




const HeaderBar = withStateFrom(headerBarStore$, HeaderBarComponent);
let currentSection;
let sidebarRef;


class AppFront extends React.Component {

  constructor(props, context) {
    super(props, context);

    this.state = {
      snackbarMessage: '',
      showSnackbar: false,
      formValidator: undefined,
      sectionToRender: '',
      informationResource:{},
      textSearch:"",
      hiddenSlide:true
    };

    this.changeSectionHandler = this.changeSectionHandler.bind(this);
    this.changeSearchTextHandler = this.changeSearchTextHandler.bind(this);
  }

  // functions
  //hander of seleccion in islide
  changeSectionHandler(key, searchText) {
    currentSection = key;
    if (key !== 'search' && sidebarRef) {
      sidebarRef.clearSearchBox();
    }

    this.setResourceSelected(currentSection);
  }

  changeSearchTextHandler(searchText){
    this.setState({textSearch:searchText});
  }

  componentDidMount() {
     
  }

  storeRef(ref) {
    sidebarRef = ref;
  }

  // life cycle
  getChildContext() {
    return {
      d2: this.props.d2,
      muiTheme: appTheme
    };
  }

  render() {
    const d2 = this.props.d2;
    const iconStyles = {
      marginRight: 24,
    };

    return (

      <MuiThemeProvider muiTheme={appTheme}>
        <div className="app-wrapper">
          <HeaderBar />       
          <Main d2={d2}/>
        </div>
      </MuiThemeProvider>
    );
  }
}
AppFront.propTypes = {
  d2: React.PropTypes.object.isRequired,
  currentSection: React.PropTypes.string,
  searchText: React.PropTypes.string
};

AppFront.contextTypes = {
  muiTheme: React.PropTypes.object
};

AppFront.childContextTypes = {
  d2: React.PropTypes.object,
  muiTheme: React.PropTypes.object
};

export default AppFront;


import React,{useState} from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { Link } from 'react-router-dom'
import ButtonMui from "@material-ui/core/Button";
import 'semantic-ui-css/semantic.min.css';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import PatientCardDetail from './PatientCard'
import { useHistory } from "react-router-dom";
import {   Tab, Tabs, } from "react-bootstrap";
import ViewPatientHistory from '../History/ViewPatientHistory'


const styles = theme => ({
  root: {
    width: '100%',
  },
  heading: {
    fontSize: theme.typography.pxToRem(15),
  },
  secondaryHeading: {
    fontSize: theme.typography.pxToRem(15),
    color: theme.palette.text.secondary,
  },
  icon: {
    verticalAlign: 'bottom',
    height: 20,
    width: 20,
  },
  details: {
    alignItems: 'center',
  },
  column: {
    flexBasis: '20.33%',
  },
  helper: {
    borderLeft: `2px solid ${theme.palette.divider}`,
    padding: `${theme.spacing.unit}px ${theme.spacing.unit * 2}px`,
  },
  link: {
    color: theme.palette.primary.main,
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
});


function PatientEditCard(props) {
    let history = useHistory();
    const [key, setKey] = useState('home');
    const { classes } = props;
    const patientObj = history.location && history.location.state ? history.location.state.patientObj : {}

    //console.log("p-details ",patientObj);

  return (
    <div className={classes.root}>
      <Card >
        <CardContent>
            <PatientCardDetail patientObj={patientObj}/>

             <ViewPatientHistory patientObj={patientObj}/>
         </CardContent>
      </Card>
    </div>
  );
}

PatientEditCard.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(PatientEditCard);

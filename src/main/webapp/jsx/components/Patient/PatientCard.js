import React, {useState, useEffect} from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelActions from '@material-ui/core/ExpansionPanelActions';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Divider from '@material-ui/core/Divider';
import { Button } from 'semantic-ui-react';
import {Label,} from "semantic-ui-react";
import 'semantic-ui-css/semantic.min.css';
import { Col, Row } from "reactstrap";

import moment from "moment";
import PostPatient from './PostPatient'
import { Link } from 'react-router-dom'
import MatButton from "@material-ui/core/Button";
import { TiArrowBack } from 'react-icons/ti'


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

function PatientCard(props) {
  const { classes } = props;
  const patientObjs = props.patientObj ? props.patientObj : {}
  //console.log(patientObjs)
  const [patientObj, setpatientObj] = useState(patientObjs)
  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);


    const calculate_age = dob => {
      var today = new Date();
      var dateParts = dob.split("-");
      var dateObject = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]);
      var birthDate = new Date(dateObject); // create a date object directlyfrom`dob1`argument
      var age_now = today.getFullYear() - birthDate.getFullYear();
      var m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                  age_now--;
              }
          if (age_now === 0) {
                  return m + " month(s)";
              }
              return age_now + " year(s)";
    };

  
    const CurrentStatus = ()=>{

        return (  <Label color="blue" size="mini">Active</Label>);
}

    const getHospitalNumber = (identifier) => {
      const identifiers = identifier;
      const hospitalNumber = identifiers.identifier.find(obj => obj.type == 'HospitalNumber');
      return hospitalNumber ? hospitalNumber.value : '';
    };

    const getPhoneNumber = (identifier) => {
      const identifiers = identifier;
      const phoneNumber = identifiers.contactPoint.find(obj => obj.type == 'phone');
      return phoneNumber ? phoneNumber.value : '';
    };

    const getAddress = (identifier) => {
      const identifiers = identifier;
      const address = identifiers.address.find(obj => obj.city);
      return address ? address.city : '';
    };

    const PostPatientService =(row)=> {
      setpatientObj({...patientObj, ...row});
      setModal(!modal)
    }

  
  return (
    <div className={classes.root}>
        <ExpansionPanel defaultExpanded>
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>

                <Row>


                    <Col md={11}>
                        <Row className={"mt-1"}>
                            <Col md={12} className={classes.root2} >
                                <b style={{fontSize: "25px", color:'rgb(153, 46, 98)'}}>
                                    {patientObj.surname + ", " + patientObj.firstName + " " + patientObj.otherName}
                                    < span style={{color:'green'}}>
                                             {": "+"Active"}
                                        </span>
                                </b>

                            </Col>
                            <Col md={4} className={classes.root2} style={{marginTop:"10px"}}>
                                    <span>
                                        {" "}
                                        Hospital Number : <b style={{color:'#0B72AA'}}>{getHospitalNumber(patientObj.identifier) }</b>
                                    </span>
                            </Col>

                            <Col md={4} className={classes.root2} style={{marginTop:"10px"}}>
                                    <span>
                                        Date Of Birth : <b style={{color:'#0B72AA'}}>{patientObj.dateOfBirth }</b>
                                    </span>
                            </Col>
                            <Col md={4} className={classes.root2} style={{marginTop:"10px"}}>
                                <span>
                                    {" "}
                                    Age : <b style={{color:'#0B72AA'}}>{calculate_age(patientObj.dateOfBirth) }</b>
                                </span>
                            </Col>
                            <Col md={4} style={{marginTop:"10px"}}>
                                    <span>
                                        {" "}
                                        Sex :{" "}
                                        <b style={{color:'#0B72AA'}}>{patientObj.sex}</b>
                                    </span>

                            </Col>
                            <Col md={4} className={classes.root2} style={{marginTop:"10px"}}>
                                <span>
                                    {" "}
                                    Phone Number : <b style={{color:'#0B72AA'}}>{getPhoneNumber(patientObj.contactPoint)}</b>
                                </span>
                            </Col>
                            <Col md={4} className={classes.root2} style={{marginTop:"10px"}}>
                                <span>
                                    {" "}
                                    Address : <b style={{color:'#0B72AA'}}>{getAddress(patientObj.address)} </b>
                                </span>

                            </Col>


                        </Row>
                    </Col>

                </Row>

            </ExpansionPanelSummary>
            <Divider />
            <ExpansionPanelActions expandIcon={<ExpandMoreIcon />}>
              <div className="float-end" style={{floated:'right'}}>
                    {" "}<Link to={"/"} >
                    <Button
                        floated='right'
                        style={{padding:'0px'}}
                    >
                        <MatButton
                            variant="contained"
                            floated='right'
                            startIcon={<TiArrowBack  />}
                            style={{backgroundColor:"rgb(153, 46, 98)", color:'#fff', height:'35px'}}
                        >
                            <span style={{ textTransform: "capitalize" }}>Back</span>
                        </MatButton>
                    </Button>

                </Link>

                            {" "}<Button  floated='right'  style={{backgroundColor:"#014d88", color:'#fff',height:'35px'}} onClick={() => PostPatientService(patientObj)}>Post Patient</Button>


                </div>
            </ExpansionPanelActions>
        </ExpansionPanel>










            <PostPatient toggle={toggle} showModal={modal} patientObj={patientObj} />
    </div>
  );
}

PatientCard.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(PatientCard);

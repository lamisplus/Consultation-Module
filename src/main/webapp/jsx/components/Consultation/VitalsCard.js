import React, {Fragment, useState, useCallback, useEffect } from "react";
import { Grid, Segment, Label, List, Card, Button, Icon, Feed } from 'semantic-ui-react';
import { Accordion,AccordionSummary,AccordionDetails } from '@material-ui/core'
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import moment from "moment";
import {makeStyles} from "@material-ui/core/styles";
import axios from "axios";
import {token, url as baseUrl} from "../../../api";
import _ from "lodash";
import {toast} from "react-toastify";
import { Link, useHistory } from 'react-router-dom';


const useStyles = makeStyles((theme) => ({
    root: {
        width: '100%',
    },
    heading: {
        fontSize: theme.typography.pxToRem(15),
        fontWeight: 'bolder',
    },
}));

function VitalsCard({props}) {
    const classes = useStyles();
    const patientObj = props.patientObj ? props.patientObj : {}
    const [otherVisitsVitals, setOtherVisitVitals] = useState([]);
    const [latestVitals, setVitalSignDto]= useState({})
    const [previousConsultation, setPreviousConsultation] = useState([]);

    ///GET LIST OF Patients
    async function getLatestVitals() {
        axios
            .get(`${baseUrl}patient/vital-sign/visit/${patientObj.visitId}`,
                { headers: {"Authorization" : `Bearer ${token}`} }
            )
            .then((response) => {
                setVitalSignDto(response.data);
            })
            .catch((error) => {
            });
    }

    const loadOtherVisitsVitals = () => {
        try {
            axios.get(`${baseUrl}patient/vital-sign/person/${patientObj.id}`,
                { headers: {"Authorization" : `Bearer ${token}`}}
            ).then((response)=>{
                if(response.data.length > 0){
                    let otherVisits = _.remove(response.data,{visitId:patientObj.visitId})
                    setOtherVisitVitals(response.data);
                }
            })


        } catch (e) {
            toast.error("An error occurred while fetching vitals", {
                position: toast.POSITION.TOP_RIGHT
            });
        }
    };

    const loadPreviousConsultation = useCallback(async () => {
        try {
            const response = await axios.get(`${baseUrl}consultations/consultations-by-patient-id/${patientObj.id}`, { headers: {"Authorization" : `Bearer ${token}`}});
            setPreviousConsultation(response.data);
        } catch (e) {
            toast.error("An error occurred while fetching previous consultation", {
                position: toast.POSITION.TOP_RIGHT
            });
        }
    }, []);

    useEffect(() => {
        loadOtherVisitsVitals();
        loadPreviousConsultation();
        getLatestVitals();
    }, []);
    return (
        <Grid.Column>
            {  Object.keys(latestVitals).length > 0 &&
                <Segment>

                    <div className={classes.root}>
                        <Accordion style={{minHeight:'45px',padding:'0px 0px 0px 0px'}} defaultExpanded={true}>
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls="panel1a-content"
                                id="panel1a-header"
                                style={{padding:'0px 0px 0px 2px',borderBottom:'2px solid #eee'}}
                            >
                                <Label as='a' color='blue'  style={{width:'100%'}}>
                                    <Typography className={classes.heading}>Current Vitals - Date - { moment(latestVitals.captureDate).format("DD/MM/YYYY hh:mm A")}</Typography>
                                </Label>

                            </AccordionSummary>
                            <AccordionDetails style={{padding:'8px'}}>
                                <List celled style={{width:'100%'}}>
                                    <List.Item style={{paddingBottom:'10px', paddingTop:'10px',borderTop:'1px solid #fff', marginTop:'-5px' }}>Pulse <span style={{color:'rgb(153, 46, 98)'}} className="float-end"><b>{latestVitals.pulse} bpm</b></span></List.Item>
                                    <List.Item style={{paddingBottom:'10px', paddingTop:'10px'}}>Respiratory Rate <span className="float-end"><b style={{color:'rgb(153, 46, 98)'}}>{latestVitals.respiratoryRate} bpm</b></span></List.Item>
                                    <List.Item style={{paddingBottom:'10px', paddingTop:'10px'}}>Temperature <span className="float-end"><b style={{color:'rgb(153, 46, 98)'}}>{latestVitals.temperature} <sup>0</sup>C</b></span></List.Item>
                                    <List.Item style={{paddingBottom:'10px', paddingTop:'10px'}}>Blood Pressure <span  className="float-end"><b style={{color:'rgb(153, 46, 98)'}}>{latestVitals.systolic}/{latestVitals.diastolic}</b></span></List.Item>
                                    <List.Item style={{paddingBottom:'10px', paddingTop:'10px'}}>Height <span  className="float-end"><b style={{color:'rgb(153, 46, 98)'}}>{latestVitals.height} cm</b></span></List.Item>
                                    <List.Item style={{paddingBottom:'10px', paddingTop:'10px'}}>Weight <span  className="float-end"><b style={{color:'rgb(153, 46, 98)'}}>{latestVitals.bodyWeight} kg</b></span></List.Item>
                                    <List.Item style={{paddingBottom:'10px', paddingTop:'10px'}}>BMI <span  className="float-end"><b style={{color:'rgb(153, 46, 98)'}}>{latestVitals.bodyWeight} kg</b></span></List.Item>
                                </List>
                            </AccordionDetails>
                        </Accordion>

                        {otherVisitsVitals && otherVisitsVitals.length > 0 &&
                            otherVisitsVitals.map(vital =>
                                <Accordion>
                                    <AccordionSummary
                                        expandIcon={<ExpandMoreIcon />}
                                        aria-controls="panel2a-content"
                                        id="panel2a-header"
                                        style={{padding:'0px 0px 0px 10px'}}
                                    >
                                        <Typography className={classes.heading} style={{color:'#014d88'}}>Vitals Collection - Date - { moment(vital.captureDate).format("DD/MM/YYYY hh:mm A")}</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails style={{padding:'8px'}}>
                                        <List celled style={{width:'100%'}}>
                                            <List.Item style={{paddingBottom:'10px', paddingTop:'10px',borderTop:'1px solid #fff', marginTop:'-5px' }}>Pulse <span  style={{color:'#014d88'}} className="float-end"><b>{vital.pulse} bpm</b></span></List.Item>
                                            <List.Item style={{paddingBottom:'10px', paddingTop:'10px'}}>Respiratory Rate <span className="float-end" style={{color:'#014d88'}}><b>{vital.respiratoryRate} bpm</b></span></List.Item>
                                            <List.Item style={{paddingBottom:'10px', paddingTop:'10px'}}>Temperature <span className="float-end" style={{color:'#014d88'}}><b>{vital.temperature} <sup>0</sup>C</b></span></List.Item>
                                            <List.Item style={{paddingBottom:'10px', paddingTop:'10px'}}>Blood Pressure <span  className="float-end" style={{color:'#014d88'}}><b>{vital.systolic}/{vital.diastolic}</b></span></List.Item>
                                            <List.Item style={{paddingBottom:'10px', paddingTop:'10px'}}>Height <span  className="float-end" style={{color:'#014d88'}}><b>{vital.height} cm</b></span></List.Item>
                                            <List.Item style={{paddingBottom:'10px', paddingTop:'10px'}}>Weight <span  className="float-end" style={{color:'#014d88'}}><b>{vital.bodyWeight} kg</b></span></List.Item>
                                            <List.Item style={{paddingBottom:'10px', paddingTop:'10px'}}>BMI <span  className="float-end" style={{color:'#014d88'}}><b>{vital.bodyWeight} kg</b></span></List.Item>
                                        </List>
                                    </AccordionDetails>
                                </Accordion>
                            )

                        }
                    </div>
                    <hr />
                    <div>
                        <List>
                          <List.Item>
                              <Link
                                  to={{
                                      pathname: "/patient-consultations-history",
                                      state: { patientObj: patientObj  }
                                  }}>
                                  <Button icon labelPosition='right'  style={{width:'100%',backgroundColor:'#992E62',color:"#fff", padding:'15px'}}  fluid>
                                      <Icon name='eye' />
                                      View Consultation History
                                  </Button>
                              </Link>
                          </List.Item>
        {/*                  <List.Item>
                          <Button icon labelPosition='right' color='blue' fluid>
                              <Icon name='calendar alternate' />
                                Appointment
                            </Button>
                          </List.Item>*/}
                    </List>
                        { previousConsultation &&
                            <Card style={{width:'100%'}}>
        {/*                        <Card.Content style={{padding:'5px'}}>
                                    <Label as='a'   style={{width:'100%',backgroundColor:'#014d88',color:"#fff", padding:'10px'}}>
                                        <Typography className={classes.heading}><b>Previous Clinical Notes</b></Typography>
                                    </Label>

                                </Card.Content>*/}
                                <Card.Content style={{padding:'5px'}}>
                                    <Feed>
                                        {previousConsultation && previousConsultation.length > 0 &&
                                            previousConsultation.map(consultation =>
                                                <Accordion>
                                                    <AccordionSummary
                                                        expandIcon={<ExpandMoreIcon style={{color:'#fff'}} />}
                                                        aria-controls="panel2a-content"
                                                        id="panel2a-header"
                                                        style={{padding:'0px 0px 0px 10px',backgroundColor:'#1678c2',border:'2px solid #ddd',color:'#fff'}}
                                                    >
                                                        <Typography className={classes.heading} >Notes - {consultation.encounterDate}</Typography>
                                                    </AccordionSummary>
                                                    <AccordionDetails style={{padding:'10px 5px',minHeight:100,border:'2px solid #ddd', marginTop:'-10px',fontFamily:'Trebuchet'}}>
                                                        <div dangerouslySetInnerHTML={{__html: consultation.visitNotes}} />
                                                    </AccordionDetails>
                                                </Accordion>
                                            )

                                        }
                                    </Feed>
                                </Card.Content>
                            </Card>
                        }
                    </div>
                </Segment>
            }
        </Grid.Column>
    );
}

export default VitalsCard;
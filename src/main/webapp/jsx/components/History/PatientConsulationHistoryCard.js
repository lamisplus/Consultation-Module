import React, {Fragment} from 'react';
import {FormControl, FormGroup} from "@material-ui/core";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import {Button, Icon, Input, List, Table} from "semantic-ui-react";
import moment from "moment";

function PatientConsultationHistoryCard({visit, testOrders}) {

    return (
        <div>
            <Paper elevation={1} style={{maxHeight: 250, overflow: 'auto',padding:'10px', backgroundColor:'#039be5'}}>
                <h3 style={{color:'#fff '}}>{moment(visit.encounterDate).format("DD/MM/YYYY hh:mm A")}</h3>
            </Paper>

            <h3 style={{marginTop:'20px', color:'#992E62'}}>Clinical Notes</h3>
            <Divider />
            <Paper elevation={1} style={{minHeight:200, maxHeight: 350, scrollbarWidth:'10', overflow: 'auto',border:'1px solid #A5E2FF', marginTop:'5px'}}>
                <div style={{border:'10px solid #fff'}}>
                    <Typography variant="body1" style={{fontFamily:'Trebuchet', fontSize:'18px' }}>

                        <div dangerouslySetInnerHTML={{__html: visit.visitNotes}} />
                    </Typography>
                </div>
            </Paper>

            <h3 style={{marginTop:'20px',color:'#014d88'}}>Presenting Complaints</h3>
            <Divider />
            <Paper elevation={1} style={{minHeight:100, overflow: 'auto',border:'1px solid #A5E2FF', marginTop:'5px'}}>
                <div style={{border:'5px solid #fff'}}>
                    <Table style={{color:'#014d88',borderColor:'#ddd'}} celled >
                        <Table.Header style={{backgroundColor:'#014d88',color:'#fff',borderColor:'#014d88'}}>
                            <Table.Row>
                                <Table.Cell style={{ fontWeight: 'bold'}}>Complaints</Table.Cell>
                                <Table.Cell style={{ fontWeight: 'bold'}}>Onset Date</Table.Cell>
                                <Table.Cell style={{ fontWeight: 'bold'}}>Severity</Table.Cell>
                                {/*<Table.Cell style={{ fontWeight: 'bold'}}>Date Resolved</Table.Cell>*/}
                            </Table.Row>
                        </Table.Header>

                        <Table.Body>
                            {visit.presentingComplaints.map((presentingComplaint, index) => (
                                <Fragment key={`${presentingComplaint.id}~${index}`}>
                                    <Table.Row>
                                        <Table.Cell>
                                            {presentingComplaint.complaint}
                                        </Table.Cell>
                                        <Table.Cell>
                                            {presentingComplaint.onsetDate}
                                        </Table.Cell>
                                        <Table.Cell>
                                            {presentingComplaint.severity}
                                        </Table.Cell>
                                       {/* <Table.Cell>
                                            {presentingComplaint.dateResolved}
                                        </Table.Cell>*/}
                                    </Table.Row>
                                </Fragment>
                            ))}
                        </Table.Body>
                    </Table>
                </div>
            </Paper>

            <h3 style={{marginTop:'20px',color:'#992E62'}}>Clinical Diagnosis</h3>
            <Divider />
            <Paper elevation={1} style={{minHeight:100,border:'5px solid #f7f7f7', marginTop:'5px'}}>
                <div style={{border:'5px solid #fff'}}>
                    <Table style={{color:'#014d88',borderColor:'#ddd'}} celled >
                        <Table.Header style={{backgroundColor:'#992E62',color:'#fff',borderColor:'#ddd'}}>
                            <Table.Row>
                                <Table.Cell style={{ fontWeight: 'bold'}}>Condition</Table.Cell>
                                <Table.Cell style={{ fontWeight: 'bold'}}>Order</Table.Cell>
                                <Table.Cell style={{ fontWeight: 'bold'}}>Certainty</Table.Cell>
                                <Table.Cell style={{ fontWeight: 'bold'}}></Table.Cell>
                            </Table.Row>
                        </Table.Header>

                        <Table.Body>
                            {visit.diagnosisList.map((diagnosis, index) => (
                                <Fragment key={`${diagnosis.id}~${index}`}>
                                    <Table.Row>
                                        <Table.Cell>
                                            {diagnosis.diagnosis}
                                        </Table.Cell>
                                        <Table.Cell>
                                            {diagnosis.diagnosisOrder === 1 ? "Primary" : "Secondary"}
                                        </Table.Cell>
                                        <Table.Cell>
                                            {diagnosis.certainty === 1 ? "Presumed" : "Confirmed"}
                                        </Table.Cell>
                                    </Table.Row>
                                </Fragment>
                            ))}
                        </Table.Body>
                    </Table>
                </div>
            </Paper>



            <h3 style={{marginTop:'20px',color:'teal'}}>Laboratory Test Orders</h3>
            <Divider />
            <Paper elevation={1} style={{minHeight:100,border:'5px solid #f7f7f7', marginTop:'5px'}}>
                <div style={{border:'5px solid #fff'}}>
                    <Table style={{color:'#014d88',borderColor:'#ddd'}} celled >
                        <Table.Header style={{backgroundColor:'teal',color:'#fff',borderColor:'#ddd'}}>
                            <Table.Row>
                                <Table.Cell style={{ fontWeight: 'bold'}}>Condition</Table.Cell>
                                <Table.Cell style={{ fontWeight: 'bold'}}>Order</Table.Cell>
                                <Table.Cell style={{ fontWeight: 'bold'}}>Priority</Table.Cell>
                                <Table.Cell style={{ fontWeight: 'bold'}}></Table.Cell>
                            </Table.Row>
                        </Table.Header>

                        <Table.Body>
                            {testOrders.map((x) => (

                                x.labOrder.tests && x.labOrder.tests.map((diagnosis, index) => (
                                    <Fragment key={`${diagnosis.id}~${index}`}>
                                        <Table.Row>
                                            <Table.Cell>
                                                {diagnosis.labTestName}
                                            </Table.Cell>
                                            <Table.Cell>
                                                {diagnosis.orderDate}
                                            </Table.Cell>
                                            <Table.Cell>
                                                {diagnosis.orderPriorityName}
                                            </Table.Cell>
                                        </Table.Row>
                                    </Fragment>
                                ))
                                ))
                            }
                        </Table.Body>
                    </Table>
                </div>
            </Paper>

            {/*
            <h3 style={{marginTop:'20px',color:'purple '}}>Pharmacy Order</h3>
            <Divider />
            <Paper elevation={1} style={{minHeight:100,border:'5px solid #f7f7f7', marginTop:'5px'}}>
                <div style={{border:'10px solid #fff'}}>
                    <Table style={{color:'#014d88',borderColor:'#ddd'}} celled >
                        <Table.Header style={{backgroundColor:'purple',color:'#fff',borderColor:'#ddd'}}>
                            <Table.Row>
                                <Table.Cell style={{ fontWeight: 'bold'}}>Condition</Table.Cell>
                                <Table.Cell style={{ fontWeight: 'bold'}}>Order</Table.Cell>
                                <Table.Cell style={{ fontWeight: 'bold'}}>Certainty</Table.Cell>
                                <Table.Cell style={{ fontWeight: 'bold'}}></Table.Cell>
                            </Table.Row>
                        </Table.Header>

                        <Table.Body>
                            {visit.diagnosisList.map((diagnosis, index) => (
                                <Fragment key={`${diagnosis.id}~${index}`}>
                                    <Table.Row>
                                        <Table.Cell>
                                            {diagnosis.diagnosis}
                                        </Table.Cell>
                                        <Table.Cell>
                                            {diagnosis.order}
                                        </Table.Cell>
                                        <Table.Cell>
                                            {diagnosis.certainty}
                                        </Table.Cell>
                                    </Table.Row>
                                </Fragment>
                            ))}
                        </Table.Body>
                    </Table>
                </div>
            </Paper>

*/}


        </div>
    );
}

export default PatientConsultationHistoryCard;
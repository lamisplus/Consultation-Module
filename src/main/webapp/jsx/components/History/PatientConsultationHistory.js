import React, { useEffect, useState, useCallback } from 'react';
import { useHistory, Link  } from "react-router-dom";
import MaterialTable, { MTableToolbar, cellStyle, headerStyle } from 'material-table';
import axios from "axios";
import {token, url as baseUrl} from "../../../api";
import { forwardRef } from 'react';
import { Grid,Container, Segment, Label, Icon, List,Button, Feed, Input, Radio } from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';
import AddBox from '@material-ui/icons/AddBox';
import ArrowUpward from '@material-ui/icons/ArrowUpward';
import Check from '@material-ui/icons/Check';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import ChevronRight from '@material-ui/icons/ChevronRight';
import Clear from '@material-ui/icons/Clear';
import DeleteOutline from '@material-ui/icons/DeleteOutline';
import Edit from '@material-ui/icons/Edit';
import FilterList from '@material-ui/icons/FilterList';
import FirstPage from '@material-ui/icons/FirstPage';
import LastPage from '@material-ui/icons/LastPage';
import Remove from '@material-ui/icons/Remove';
import SaveAlt from '@material-ui/icons/SaveAlt';
import Search from '@material-ui/icons/Search';
import ViewColumn from '@material-ui/icons/ViewColumn';
import 'react-toastify/dist/ReactToastify.css';
import { makeStyles } from '@material-ui/core/styles'
import "@reach/menu-button/styles.css";
import ButtonMui from "@material-ui/core/Button";
import MatButton from "@material-ui/core/Button";
import { TiArrowBack } from 'react-icons/ti'
import { toast } from 'react-toastify';
import Box from '@mui/material/Box';
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import PatientCardDetail from "../Patient/PatientCard";
import RecentHistory from "./RecentHistory";
import PatientConsultationHistoryCard from "./PatientConsulationHistoryCard";

const tableIcons = {
    Add: forwardRef((props, ref) => <AddBox {...props} ref={ref} />),
    Check: forwardRef((props, ref) => <Check {...props} ref={ref} />),
    Clear: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
    Delete: forwardRef((props, ref) => <DeleteOutline {...props} ref={ref} />),
    DetailPanel: forwardRef((props, ref) => <ChevronRight {...props} ref={ref} />),
    Edit: forwardRef((props, ref) => <Edit {...props} ref={ref} />),
    Export: forwardRef((props, ref) => <SaveAlt {...props} ref={ref} />),
    Filter: forwardRef((props, ref) => <FilterList {...props} ref={ref} />),
    FirstPage: forwardRef((props, ref) => <FirstPage {...props} ref={ref} />),
    LastPage: forwardRef((props, ref) => <LastPage {...props} ref={ref} />),
    NextPage: forwardRef((props, ref) => <ChevronRight {...props} ref={ref} />),
    PreviousPage: forwardRef((props, ref) => <ChevronLeft {...props} ref={ref} />),
    ResetSearch: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
    Search: forwardRef((props, ref) => <Search {...props} ref={ref} />),
    SortArrow: forwardRef((props, ref) => <ArrowUpward {...props} ref={ref} />),
    ThirdStateCheck: forwardRef((props, ref) => <Remove {...props} ref={ref} />),
    ViewColumn: forwardRef((props, ref) => <ViewColumn {...props} ref={ref} />)
};

const useStyles = makeStyles(theme => ({
    root: {
        width: '100%',
        '& > *': {
            margin: theme.spacing(1)
        }
    },
    card: {
        margin: theme.spacing(20),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    form: {
        width: '100%', // Fix IE 11 issue.
        marginTop: theme.spacing(3)
    },
    submit: {
        margin: theme.spacing(3, 0, 2)
    },
    cardBottom: {
        marginBottom: 20
    },
    Select: {
        height: 45,
        width: 350
    },
    button: {
        margin: theme.spacing(1)
    },
    input: {
        display: 'none'
    },
    error: {
        color: "#f85032",
        fontSize: "11px",
    },
    success: {
        color: "#4BB543 ",
        fontSize: "11px",
    },
    gridItem:{
        padding:'30px'
    }
}));

const PatientConsultationHistory = (props) => {
    const classes =useStyles();
    let history = useHistory();
    const [patientList, setPatientList] = useState([]);
    const patientObj = history.location && history.location.state ? history.location.state.patientObj : {};
    const[selectedVisit,setSelectedVisit] = useState();
    const[labTests,setLabTests] = useState([]);

    ///GET LIST OF Patients
    const patientConsultations = useCallback(async () => {
        try {
            const response = await axios.get(`${baseUrl}consultations/consultations-by-patient-id/${patientObj.id}`, {headers: {"Authorization": `Bearer ${token}`}});
            setPatientList(response.data);
            if(response.data.length > 0 ){
                setSelectedVisit(response.data[0]);
            }
        } catch (e) {
            toast.error("An error occured while fetching consultation !", {
                position: toast.POSITION.TOP_RIGHT
            });
        }

    }, []);


    const loadPatientTests = useCallback(async () => {
         try {
             const response = await axios.get(`${baseUrl}laboratory/orders/visits/${patientObj.id}`,
                         { headers: {"Authorization" : `Bearer ${token}`}});

             if(response.data.length > 0 ){
                 setLabTests(response.data);
             }
         } catch (e) {
             toast.error("An error occured while fetching consultation !", {
                 position: toast.POSITION.TOP_RIGHT
             });
         }

     }, []);

    useEffect(() => {
        patientConsultations()
        loadPatientTests()
    }, []);

    const formatDiagnosis = diagnosisList => {
        return diagnosisList.map(obj => obj.diagnosis) + " ,";
    };
    const formatPresentingComplaints = presentingComplaintsList => {
        return presentingComplaintsList.map(obj => obj.complaint) + " ,";
    };
    const loadConsultationDetails = (row)=>{
        setSelectedVisit(row);
        //console.log(row);
    }
    return (
        <Container style={{width:'100%'}}>
            <br/><br/>
            <Link to={{
                pathname: "/patient-history",
                state: { patientObj: patientObj  }
            }} >
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
            <br/><br/>

            <Card >
                <CardContent>
                    <Grid  columns='equal'  divided>
                        <Grid.Column width={4}  style={{padding:'5px'}} item>
                            <MaterialTable
                                icons={tableIcons}
                                /*title="Patient Consultations"*/
                                title=""
                                columns={[
                                    // { title: " ID", field: "Id" },
                                    {
                                        title: "Consultation Visits", field: "date",
                                        /*                                           cellStyle: {
                                                                                       backgroundColor: '#039be5',
                                                                                       color: '#FFF'
                                                                                   },*/
                                        cellStyle:{
                                            padding:'10px 5px'
                                        },
                                        headerStyle: {
                                            backgroundColor: '#014d88',
                                        }
                                    },
                                    /*                                        { title: "Visit Notes", field: "visitNotes", filtering: false },
                                                                            { title: "Diagnosis List", field: "diagnosisList", filtering: false },
                                                                            { title: "Presenting Complaints", field: "presentingComplaints", filtering: false },
                                                                            { title: "Actions", field: "actions", filtering: false },*/
                                ]}
                                data={ patientList.map((row) => ({
                                    //Id: manager.id,
                                    date:
                                        <div>

                                            <Button
                                                basic
                                                className=" float-end ms-2"
                                                style={{width:'100%',border:'1px dotted #eee'}}
                                                onClick={()=>loadConsultationDetails(row)}
                                            >
                                                <span style={{padding:'10px 0px', fontSize:'16px', color: '#014d88', fontWeight:'bolder',float:'left'}}>{row.encounterDate}</span>
                                            </Button>
                                        </div>
                                }))}

                                options={{
                                    headerStyle: {
                                        backgroundColor: "#014d88",
                                        color: "#fff",
                                        fontSize:'16px',
                                        padding:'10px',
                                        fontWeight:'bolder'
                                    },
                                    searchFieldStyle: {
                                        width : '100%',
                                    },
                                    toolbar: false,
                                    search: false,
                                    filtering: false,
                                    exportButton: false,
                                    /*searchFieldAlignment: 'left',*/
                                    pageSizeOptions:[10,20,100],
                                    pageSize:10,
                                    debounceInterval: 400
                                }}
                            />
                        </Grid.Column>
                        <Grid.Column style={{padding:'0px 10px'}} item>
                            {selectedVisit &&
                                <Card >
                                    <CardContent style={{width:'100%',padding:'5px'}}>
                                        <PatientConsultationHistoryCard visit={selectedVisit} testOrders={labTests}/>
                                    </CardContent>
                                </Card>
                            }

                        </Grid.Column>
                    </Grid>
                </CardContent>
            </Card>




            {/*                        <MaterialTable
                            icons={tableIcons}
                            title="Patient Consultationsz"
                            columns={[
                                // { title: " ID", field: "Id" },
                                {
                                  title: "Encounter Date", field: "date",
                                    cellStyle: {
                                          backgroundColor: '#039be5',
                                          color: '#FFF'
                                        },
                                        headerStyle: {
                                          backgroundColor: '#039be5',
                                        }
                                },
                                { title: "Visit Notes", field: "visitNotes", filtering: false },
                                { title: "Diagnosis List", field: "diagnosisList", filtering: false },
                                { title: "Presenting Complaints", field: "presentingComplaints", filtering: false },
                                { title: "Actions", field: "actions", filtering: false },
                            ]}
                            data={ patientList.map((row) => ({
                                //Id: manager.id,
                                date:row.encounterDate,
                                visitNotes:row.visitNotes,
                                diagnosisList:formatDiagnosis(row.diagnosisList),
                                presentingComplaints:formatPresentingComplaints(row.presentingComplaints),
                                actions:
                                    <div>
                                        <Link
                                            to={{
                                                pathname: "/patient-consultation",
                                                state: { patientObj: row  }
                                            }}>
                                             <Button
                                                icon
                                                inverted
                                                color='blue'
                                                className=" float-end ms-2"
                                             >
                                             <Icon name='eye' />
                                            </Button>
                                        </Link>
                                    </div>

                            }))}

                            options={{
                                headerStyle: {
                                    backgroundColor: "#01579b",
                                    color: "#ccc",
                                },
                                searchFieldStyle: {
                                    width : '200%',
                                    margingLeft: '250px',
                                },
                                filtering: false,
                                exportButton: false,
                                searchFieldAlignment: 'left',
                                pageSizeOptions:[10,20,100],
                                pageSize:10,
                                debounceInterval: 400
                            }}
                        />*/}
        </Container>

    );
};

export default PatientConsultationHistory;

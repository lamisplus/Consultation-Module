import React, {Fragment, useState, useCallback, useEffect } from "react";
import { KeyboardDateTimePicker, MuiPickersUtilsProvider, KeyboardDatePicker } from "@material-ui/pickers";
import { useForm, Controller } from "react-hook-form";
import DateFnsUtils from '@date-io/date-fns';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import axios from "axios";
import { toast } from 'react-toastify';
import {token, url as baseUrl, apiUrl as apiUrl } from "../../../api";
import { Grid, Segment, Label, Icon, List,Button, Card, Feed, Input, Radio } from 'semantic-ui-react';
import 'tinymce/tinymce';
import 'tinymce/icons/default';
import 'tinymce/themes/silver';
import 'tinymce/plugins/link';
import 'tinymce/plugins/image';
import 'tinymce/plugins/table';
import 'tinymce/skins/ui/oxide/skin.min.css';
import 'tinymce/skins/ui/oxide/content.min.css';
import 'tinymce/models/dom/model';
import 'tinymce/skins/content/default/content.min.css';
import { Editor } from '@tinymce/tinymce-react';
import Box from '@mui/material/Box';
import { Checkbox, Table } from 'semantic-ui-react';
import {format} from "date-fns";
import { Link, useHistory } from 'react-router-dom';
import ButtonMui from "@material-ui/core/Button";
import AddPharmacyOrder from './AddPharmacyOrder';
import EditPharmacyOrder from './EditPharmacyOrder';
import { makeStyles } from '@material-ui/core/styles';
import { Accordion,AccordionSummary,AccordionDetails } from '@material-ui/core'
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import _ from "lodash";
import VitalsCard from "../Consultation/VitalsCard";
import { icd10 } from "./icd-10";

const useStyles = makeStyles(theme => ({
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

    root: {
        '& > *': {
            margin: theme.spacing(1)
        }
    },
    input: {
        //border:'1px solid #014d88',
        borderRadius:'0px',
        fontSize:'14px',
        color:'#000'
    },
    error: {
        color: "#f85032",
        fontSize: "11px",
    },
    success: {
        color: "#4BB543 ",
        fontSize: "11px",
    },
    inputGroupText:{
        backgroundColor:'#014d88',
        fontWeight:"bolder",
        color:'#fff',
        borderRadius:'0px'
    },
    label:{
        fontSize:'14px',
        color:'#014d88',
        fontWeight:'600'
    }
}))

const Widget = (props) => {
    const classes = useStyles();
    const patientObj = props.patientObj ? props.patientObj : {}
    //console.log("po", patientObj)
    const [isLabEnabled, setIsLabEnabled] = useState(false);
    const [isPharmacyEnabled, setIsPharmacyEnabled] = useState(false);
    const [hasAllergies, setHasAllergies] = useState(false);
    const [pharmacyModal, setPharmacyModal] = useState(false);
    const [pharmacyOrderModal, setPharmacyOrderModal] = useState(false);
    const [otherVisitsVitals, setOtherVisitVitals] = useState([]);
    //const [previousConsultation, setPreviousConsultation] = useState([]);
    const [encounterDate, setEncounterDate] = useState(new Date());
    const { handleSubmit, control, getValues, setError, setValue } = useForm();
    const [body, SetBody] = useState("");
    const [inputFields, setInputFields] = useState([
        { complaint: null, onsetDate: '', severity: 0, dateResolved: '' }
    ]);
    const [inputFieldsDiagnosis, setInputFieldsDiagnosis] = useState([
        { certainty: '', diagnosis: null, diagnosisOrder: 0 }
    ]);

    const [inputFieldsLab, setInputFieldsLab] = useState([
            { encounterDate: format(new Date(), 'yyyy-MM-dd'), labOrder: '',
            labTest: '', priority: '', status: 0 }
        ]);

    const history = useHistory();
    const toggle = () => setPharmacyModal(!pharmacyModal);
    const toggleOrder = () => setPharmacyOrderModal(!pharmacyOrderModal);
    const [pharmacyOrder, setPharmacyOrder] = useState([]);
    const [editPharmacyOrderValue, setEditPharmacyOrderValue] = useState({
        encounterDateTime: "",
        drugName: "",
        dosageStrength: "",
        dosageStrengthUnit: "",
        dosageFrequency: "",
        startDate: "",
        duration: "",
        durationUnit: "",
        comments: "",
        patientId: patientObj.id,
        orderedBy: "",
        dateTimePrescribed: "",
        visitId: patientObj.visitId
    });
    const [errors, setErrors] = useState({});
    const [prevTests, setPrevTests] = useState([]);

    const pharmacy_by_visitId = useCallback(async () => {
            try {
                const response = await axios.get(`${apiUrl}drug-orders/visits/${patientObj.visitId}`,
                { headers: {"Authorization" : `Bearer ${token}`}});

                if (typeof response.data === 'string') {
                    setPharmacyOrder([]);
                }else {
                    //console.log("red",response.data)
                    setPharmacyOrder(response.data);
                }


            } catch (e) {
                toast.error("An error occurred while fetching pharmacy data", {
                    position: toast.POSITION.TOP_RIGHT
                });
            }
        }, []);

    const validateInputs = () => {

       let temp = { ...errors }
       temp.body = body ? "" : "Visit note is required."

       inputFields.map(x => {
             temp.onsetDate = x.onsetDate ? "" : "On Set Date is required."
             temp.complaint = x.complaint ? "" : "Complaint is required."
             temp.severity = x.severity ? "" : "Severity is required."
       })

       inputFieldsDiagnosis.map(y => {
           temp.diagnosis = y.diagnosis ? "" : "Condition is required."
           temp.diagnosisOrder = y.diagnosisOrder ? "" : "Diagnosis Order is required."
           temp.certainty = y.certainty ? "" : "Diagnosis Certainty is required."
       })

        setErrors({
             ...temp
        })

        return Object.values(temp).every(x => x == "")
    }

    const onSubmit = async (data) => {

        const diagnosisList = [];
        const presentingComplaints = [];
        const labTests = [];

        for (const inputFieldsDiag of inputFieldsDiagnosis) {
            if (inputFieldsDiag.diagnosis) {
                diagnosisList.push(inputFieldsDiag);
            }
        }

        for (const inputField of inputFields) {
            if (inputField.complaint) {
                presentingComplaints.push(inputField);
            }
        }

        for (const inputField of inputFieldsLab) {

            if (inputField.encounterDate) {
                labTests.push({
                "description": inputField.labOrder.slice(2, inputField.labOrder.length),
                "id": 0,
                "labTestGroupId": inputField.labOrder.slice(0, 1),
                "labTestId": inputField.labTest,
                "labTestOrderStatus": inputField.status,
                "orderPriority": inputField.priority,
//                "unitMeasurement": "",
//                "viralLoadIndication": 0
              });
            }
        }

        try {
            const InData = {
                "diagnosisList": diagnosisList,
                "encounterDate": format(new Date(data.encounterDate.toString()), 'yyyy-MM-dd'),
                "id": 0,
                "patientId": patientObj.id,
                "presentingComplaints": presentingComplaints,
                "visitId": patientObj.visitId,
                //"visitNotes": data.visitNote
                "visitNotes": body
            };

            const labOrder = {
                  "orderDate": format(new Date(data.encounterDate.toString()), 'yyyy-MM-dd') + " " + new Date().toLocaleTimeString('en-US',{hour12: false}),
                  //"orderTime": new Date().toLocaleTimeString('en-US',{hour12: false}),
                  "patientId": patientObj.id,
                  "tests": labTests,
                  "visitId": patientObj.visitId
            }

            if (validateInputs()) {
            //console.log('labOrder', labOrder)
                await axios.post(`${baseUrl}consultations`, InData,
                { headers: {"Authorization" : `Bearer ${token}`} }).then(( resp ) =>{
                    //console.log("diagnosis saved", resp)

                    axios.post(`${baseUrl}laboratory/orders`, labOrder,
                    { headers: {"Authorization" : `Bearer ${token}`} }).then(( resp ) =>{
                        //console.log("lab served", resp)

                        toast.success("Successfully Saved Consultation !", {
                            position: toast.POSITION.TOP_RIGHT
                        });

                        history.push('/');
                    }).catch((err) => {
                         toast.error(`An error occured while saving laboratory test! ${err}`, {
                            position: toast.POSITION.TOP_RIGHT
                        });
                    });

                });
            }

        } catch (e) {
            toast.error("An error occured while saving Consultation !", {
                position: toast.POSITION.TOP_RIGHT
            });
        }
    };
    const OnError = (errors) => {
        console.error(errors);
        toast.error("Visit Note Is Required", {
            position: toast.POSITION.TOP_RIGHT
        });
    };

    const [labGroups, setLabGroups] = useState([]);
    const [labTests, setLabTests] = useState([]);

    const [priorities, setPriorities] = useState([]);
    const [complaints, setComplaints] = useState(null);

    const loadLabCheck = useCallback(async () => {
        try {
            const response = await axios.get(`${baseUrl}modules/check?moduleName=lab`, { headers: {"Authorization" : `Bearer ${token}`} });
            setIsLabEnabled(response.data);
        } catch (e) {
            toast.error("An error occurred while fetching lab", {
                position: toast.POSITION.TOP_RIGHT
            });
        }
    }, []);

    const loadPharmacyCheck = useCallback(async () => {
        try {
            const response = await axios.get(`${baseUrl}modules/check?moduleName=pharmacy`, { headers: {"Authorization" : `Bearer ${token}`} });
            setIsPharmacyEnabled(response.data);
        } catch (e) {
            toast.error("An error occurred while fetching pharmacy", {
                position: toast.POSITION.TOP_RIGHT
            });
        }
    }, []);

    const loadOtherVisitsVitals = useCallback(async () => {
        try {
            const response = await axios.get(`${baseUrl}patient/vital-sign/person/${patientObj.id}`, { headers: {"Authorization" : `Bearer ${token}`}});
            if(response.data.length > 0){
                let otherVisits = _.remove(response.data,{visitId:patientObj.visitId})
                setOtherVisitVitals(otherVisits);
            }

        } catch (e) {
            toast.error("An error occurred while fetching vitals", {
                position: toast.POSITION.TOP_RIGHT
            });
        }
    }, []);

//    const loadPreviousConsultation = useCallback(async () => {
//        try {
//            const response = await axios.get(`${baseUrl}consultations/consultations-by-patient-id/${patientObj.id}`, { headers: {"Authorization" : `Bearer ${token}`}});
//            setPreviousConsultation(response.data);
//        } catch (e) {
//            toast.error("An error occurred while fetching previous consultation", {
//                position: toast.POSITION.TOP_RIGHT
//            });
//        }
//    }, []);

    const loadLabGroup = useCallback(async () => {
            try {
                const response = await axios.get(`${baseUrl}laboratory/labtestgroups`, { headers: {"Authorization" : `Bearer ${token}`}});
                setLabGroups(response.data);
                    let arr = [];
                    response.data.map((x) => {
                        x.labTests.map((y) => {
                            arr.push(y);
                        })
                    })
                    setPrevTests(arr);

            } catch (e) {
                toast.error("An error occurred while fetching lap group data", {
                    position: toast.POSITION.TOP_RIGHT
                });
            }
        }, []);

    const priority = useCallback(async () => {
            try {
                const response = await axios.get(`${baseUrl}application-codesets/v2/TEST_ORDER_PRIORITY`, { headers: {"Authorization" : `Bearer ${token}`}});
                //console.log("priority", response.data);
                setPriorities(response.data);
            } catch (e) {
                toast.error("An error occurred while fetching priority data", {
                    position: toast.POSITION.TOP_RIGHT
                });
            }
        }, []);

    useEffect(() => {
        loadPharmacyCheck();
        loadLabCheck();
        loadOtherVisitsVitals();
        //loadPreviousConsultation();
        loadLabGroup();
        priority();
        pharmacy_by_visitId();
        getLatestVitals();

    }, []);

    const [latestVitals, setVitalSignDto]= useState({})
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

    const handleAddFields = () => {
        const values = [...inputFields];
        values.push({ complaint: '', onsetDate: '', severity: 0, dateResolved: '' });
        setInputFields(values);
    };

    const removeHandleAddFields = (e) => {
        e.preventDefault()
        const values = [...inputFields];
        values.pop()
        setInputFields(values);
    };

    const handleAddDiagFields = () => {
        const values = [...inputFieldsDiagnosis];
        values.push({ certainty: '', diagnosis: '', diagnosisOrder: 0 });
        setInputFieldsDiagnosis(values);
    };

    const removeHandleAddDiagFields = (e) => {
        e.preventDefault()
        const values = [...inputFieldsDiagnosis];
        values.pop()
        setInputFieldsDiagnosis(values);
    };

    const handleAddFieldsLab = () => {
        const values = [...inputFieldsLab];

        values.push({ encounterDate: format(new Date(), 'yyyy-MM-dd'), labOrder: '', labTest: '', priority: '', status: '' });

        setInputFieldsLab(values);
    };

    const removeHandleAddFieldsLab = (e) => {
        e.preventDefault()
        const values = [...inputFieldsLab];

        values.pop()
        setInputFieldsLab(values);
    };

    const handleInputChange = (index, event) => {
        const values = [...inputFields];
        if (typeof event === "string") {
            values[index].complaint = event;
        } else if (event.target.name === "onsetDate") {
            values[index].onsetDate = event.target.value;
        } else if (event.target.name === "severity") {
            values[index].severity = event.target.value;
        } else if (event.target.name === "dateResolved") {
            values[index].dateResolved = event.target.value;
        }

        setInputFields(values);

    };

    const handleInputDiagChange = (index, event) => {

        const values = [...inputFieldsDiagnosis];
        if (typeof event === "string") {
            values[index].diagnosis = event;
        } else if (event.target.name === "certainty") {
            values[index].certainty = event.target.value;
        } else if (event.target.name === "diagnosisOrder") {
            values[index].diagnosisOrder = event.target.value;
        }
        setInputFieldsDiagnosis(values);

    };

    const labCascade = id => {
        labGroups.forEach(function (x) {
              if (x.id == id) {
                setLabTests(x.labTests)
              }
        });
    }

    const handleInputLabChange = (index, event) => {
            const values = [...inputFieldsLab];
            if (event.target.name === "labOrder") {
                const str = event.target.value;
                values[index].labOrder = str;
                labCascade(str.slice(0,1))
            }
            else if (event.target.name === "labTest") {
                values[index].labTest = event.target.value;
            }
            else if (event.target.name === "priority") {
                values[index].priority = event.target.value;
            }
            else if (event.target.name === "status") {
                values[index].status = event.target.value;
            }

        setInputFieldsLab(values);
    };

    const handleAddPharmacyOrder = () => {
        setPharmacyModal(!pharmacyModal);
    };

    const handleEditPharmacyOrder = (pharmacy) => {
            console.log(pharmacy);
            setEditPharmacyOrderValue(pharmacy);
            setPharmacyOrderModal(!pharmacyOrderModal);
     };

    const handleDelete = async (id) => {
        console.log(id)
           await axios.delete(`${apiUrl}drug-orders/${id}`,
            { headers: {"Authorization" : `Bearer ${token}`}}).then(resp => {
            console.log("drug order deleted");
             toast.success("Successfully deleted drug order!", {
                    position: toast.POSITION.TOP_RIGHT
                });
            });
     }


    return (
        <Grid columns='equal'>
            <VitalsCard props={props} />
              {/*<Grid.Column>
                <Segment>

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
                </List>
                    { previousConsultation &&
                        <Card style={{width:'100%'}}>
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
                </Segment>
              </Grid.Column>*/}
            <Grid.Column width={11}>
                <form onSubmit={handleSubmit(onSubmit, OnError)}>
                    <Label as='a' color='black' style={{width:'100%',height:'35px',fontSize:'16px'}}>
                        <b>Physical Examination</b>
                    </Label>

                    <Segment>
                        <div className="input-group input-group-sm mb-3" >
                            <span className="input-group-text" style={{height:'40px',backgroundColor:'#014d88',color:'#fff', fontSize:'14px'}}>Encounter Dates</span>
                            <MuiPickersUtilsProvider utils={DateFnsUtils} >
                                <Controller
                                    name="encounterDate"
                                    control={control}
                                    defaultValue={encounterDate}
                                    rules={{ required: true }}
                                    render={({ field: { ref, ...rest }}) => (
                                        <KeyboardDateTimePicker
                                            style={{height:'40px', border:'1px solid #014d88'}}
                                            disableFuture
                                            format="dd/MM/yyyy hh:mm a"
                                            value={encounterDate}
                                            onChange={setEncounterDate}
                                            className="form-control"
                                            invalidDateMessage={"Encounter date is required"}
                                            {...rest}
                                        />
                                    )}
                                    />
                            </MuiPickersUtilsProvider>
                        </div>

                        <div className="input-group input-group-sm " >
                        <Label as='a'  style={{backgroundColor:'#014d88', color:'#fff',width:'100%',height:'35px',fontSize:'16px'}}>
                            {"Patient's visit note"}
                        </Label>
                          {errors.body !="" ? (
                              <span className={classes.error}>{errors.body}</span>
                            ) : "" }
                            {/* <span className="input-group-text" style={{height:'300px',backgroundColor:'#014d88',color:'#fff', fontSize:'14px'}}>Visit Note</span>
                           <Controller
                                name="visitNote"
                                control={control}
                                rules={{ required: true }}
                                render={({ field: { ref, ...rest }}) => (
                                    <textarea  style={{ minHeight: 300,border:'1px solid #014d88', fontSize:'16px' }} className="form-control" {...rest} ></textarea>
                                )}
                            />*/}
                            <Editor
                                textareaName='visitNote'
                                initialValue=""
                                 init={{
                                   width: 1000,
                                   height: 300,
                                   menubar: false,
                                   plugins: [],
                                   toolbar: 'undo redo | formatselect | ' +
                                   'bold italic backcolor | alignleft aligncenter ' +
                                   'alignright alignjustify | bullist numlist outdent indent | ' +
                                   'removeformat | help',
                                   content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                                 }}
                                onEditorChange={(newText) => SetBody(newText)}
                             />
                        </div>
                        <br/>
                        <Label as='a'  style={{backgroundColor:'#014d88', color:'#fff',width:'100%',height:'35px',fontSize:'16px'}}>
                            Presenting Complaints
                        </Label>

                        <Table style={{color:'#014d88',borderColor:'#014d88'}} celled >
                            <Table.Header>
                                <Table.Row>
                                    <Table.Cell style={{ fontWeight: 'bold'}}>Complaints</Table.Cell>
                                    <Table.Cell style={{ fontWeight: 'bold'}}>Onset Date</Table.Cell>
                                    <Table.Cell style={{ fontWeight: 'bold'}}>Severity</Table.Cell>
                                    {/*<Table.Cell style={{ fontWeight: 'bold'}}>Date Resolved</Table.Cell>*/}
                                </Table.Row>
                            </Table.Header>

                            <Table.Body>

                                    {inputFields.map((inputField, index) => (
                                        <Fragment key={`${inputField}~${index}`}>
                                            <Table.Row>
                                            <Table.Cell>
                                                {/*<Input
                                                    id="complaint"
                                                    name="complaint"
                                                    type="text"
                                                    fluid
                                                    placeholder='Enter Presenting Complaints'
                                                    value={inputField.complaint}
                                                    onChange={event => handleInputChange(index, event)}
                                                />*/}
                                                <Autocomplete
                                                  id="complaint"
                                                  getOptionLabel={(icd10) => `${icd10.code} ${icd10.desc}`}
                                                  disablePortal
                                                  options={icd10}
                                                  isOptionEqualToValue={(option, value) =>
                                                    option.code === value.code
                                                  }
                                                  noOptionsText={"No Complaints Available"}
                                                  renderOption={(props, icd10) => (
                                                    <Box component="li" {...props} key={icd10.code}>
                                                        {icd10.code} {icd10.desc}
                                                    </Box>
                                                  )}
                                                  renderInput={(params) => <TextField {...params} label="Select complaints"/>}
                                                  value={inputFields.complaint}
                                                  onChange={(event, newValue) => handleInputChange(index, `${newValue.code} ${newValue.desc}`)}
                                                />

                                                {errors.complaint !="" ? (
                                                  <span className={classes.error}>{errors.complaint}</span>
                                                ) : "" }
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Input
                                                    className={classes.input}
                                                    id="onsetDate"
                                                    name="onsetDate"
                                                    type="date"
                                                    fluid
                                                    placeholder='Onset Date'
                                                    value={inputField.onsetDate}
                                                    onChange={event => handleInputChange(index, event)}
                                                />

                                                {errors.onsetDate !="" ? (
                                                     <span className={classes.error}>{errors.onsetDate}</span>
                                                   ) : "" }
                                            </Table.Cell>
                                            <Table.Cell>
                                                <select
                                                    style={{
                                                       //border: "1px solid #014d88",
                                                       borderRadius:'0px',
                                                       fontSize:'14px',
                                                       color:'#000'
                                                     }}
                                                    className="ui fluid selection dropdown"
                                                    value={inputField.severity}
                                                    onChange={event => handleInputChange(index, event)}
                                                    name="severity"
                                                    id="severity">
                                                    <option>Select</option>
                                                    <option value="0">0</option>
                                                    <option value="1">1</option>
                                                    <option value="2">2</option>
                                                    <option value="3">3</option>
                                                    <option value="4">4</option>
                                                    <option value="5">5</option>
                                                    <option value="6">6</option>
                                                    <option value="7">7</option>
                                                    <option value="8">8</option>
                                                    <option value="9">9</option>
                                                    <option value="10">10</option>
                                                </select>

                                                   {errors.severity != "" ? (
                                                      <span className={classes.error}>{errors.severity}</span>
                                                    ) : "" }
                                            </Table.Cell>
                                            {/*<Table.Cell>
                                                <Input
                                                    id="dateResolved"
                                                    name="dateResolved"
                                                    type="date"
                                                    fluid
                                                    placeholder='Date Resolved'
                                                    value={inputField.dateResolved}
                                                    onChange={event => handleInputChange(index, event)}
                                                />
                                            </Table.Cell>*/}
                                            </Table.Row>
                                        </Fragment>
                                    ))}

                            </Table.Body>

                            <Table.Footer>
                                <Table.Row>
                                    <Table.HeaderCell>
                                        <Button color="blue" size="tiny" type="button" onClick={() => handleAddFields()}>
                                            <Icon name='plus' /> Add More
                                        </Button>
                                        {" "}
                                        <Button color="red" size="tiny" type="button" onClick={e => removeHandleAddFields(e)}>
                                            <Icon name='minus' /> Remove
                                        </Button>
                                    </Table.HeaderCell>
                                </Table.Row>
                            </Table.Footer>
                        </Table>
                        <br/>
                        <Label as='a' style={{backgroundColor:'#992E62', color:'#fff', width:'100%',height:'35px',fontSize:'16px'}}>
                            Clinical Diagnosis
                        </Label>

                        <Table style={{color:'#992E62',borderColor:'#992E62'}} celled>
                            <Table.Header>
                                <Table.Row>
                                    <Table.Cell style={{ fontWeight: 'bold'}}>Condition</Table.Cell>
                                    <Table.Cell style={{ fontWeight: 'bold'}}>Order</Table.Cell>
                                    <Table.Cell style={{ fontWeight: 'bold'}}>Certainty</Table.Cell>
                                    {/*<Table.Cell style={{ fontWeight: 'bold'}}></Table.Cell>*/}
                                </Table.Row>
                            </Table.Header>

                            <Table.Body>
                                {inputFieldsDiagnosis.map((diagInputField, diagIndex) => (
                                    <Fragment key={`${diagInputField}~${diagIndex}`}>
                                        <Table.Row>
                                            <Table.Cell>
                                                {/*<Input
                                                    id="diagnosis"
                                                    name="diagnosis"
                                                    type="text"
                                                    fluid
                                                    placeholder='Condition'
                                                    value={diagInputField.diagnosis}
                                                    onChange={event => handleInputDiagChange(diagIndex, event)}
                                                />*/}
                                               <Autocomplete
                                                  id="diagnosis"
                                                  getOptionLabel={(icd10) => `${icd10.code} ${icd10.desc}`}
                                                  disablePortal
                                                  options={icd10}
                                                  isOptionEqualToValue={(option, value) =>
                                                    option.code === value.code
                                                  }
                                                  noOptionsText={"No Condition"}
                                                  renderOption={(props, icd10) => (
                                                    <Box component="li" {...props} key={icd10.code}>
                                                        {icd10.code} {icd10.desc}
                                                    </Box>
                                                  )}
                                                  renderInput={(params) => <TextField {...params} label="Select conditions"/>}
                                                  value={inputFieldsDiagnosis.diagnosis}
                                                  onChange={(event, newValue) => handleInputDiagChange(diagIndex, `${newValue.code} ${newValue.desc}`)}
                                                />

                                                {errors.diagnosis !="" ? (
                                                  <span className={classes.error}>{errors.diagnosis}</span>
                                                ) : "" }
                                            </Table.Cell>
                                            <Table.Cell>
                                                <select
                                                    style={{
                                                       //border: "1px solid #014d88",
                                                       borderRadius:'0px',
                                                       fontSize:'14px',
                                                       color:'#000'
                                                     }}
                                                    className="ui fluid selection dropdown"
                                                    value={diagInputField.diagnosisOrder}
                                                    onChange={event => handleInputDiagChange(diagIndex, event)}
                                                    name="diagnosisOrder"
                                                    id="diagnosisOrder">
                                                    <option>Select</option>
                                                    <option value="1">Primary</option>
                                                    <option value="2">Secondary</option>
                                                </select>

                                                 {errors.diagnosisOrder !="" ? (
                                                  <span className={classes.error}>{errors.diagnosisOrder}</span>
                                                ) : "" }
                                            </Table.Cell>
                                            <Table.Cell>
                                                <select
                                                    style={{
                                                       //border: "1px solid #014d88",
                                                       borderRadius:'0px',
                                                       fontSize:'14px',
                                                       color:'#000'
                                                     }}
                                                    className="ui fluid selection dropdown"
                                                    value={diagInputField.certainty}
                                                    onChange={event => handleInputDiagChange(diagIndex, event)}
                                                    name="certainty"
                                                    id="certainty">
                                                    <option>Select</option>
                                                    <option value="1">Presumed</option>
                                                    <option value="2">Confirmed</option>
                                                </select>

                                                 {errors.certainty !="" ? (
                                                  <span className={classes.error}>{errors.certainty}</span>
                                                ) : "" }
                                            </Table.Cell>
                                            {/*<Table.Cell></Table.Cell>*/}
                                        </Table.Row>
                                    </Fragment>
                                ))}
                            </Table.Body>

                            <Table.Footer>
                                <Table.Row>
                                    <Table.HeaderCell>

                                        <Button style={{backgroundColor:'#992E62',color:'#fff'}} size="tiny" type="button" onClick={() => handleAddDiagFields()}>
                                            <Icon name='plus' /> Add More
                                        </Button>
                                            {" "}
                                        <Button color="red" size="tiny" type="button" onClick={e => removeHandleAddDiagFields(e)}>
                                            <Icon name='minus' /> Remove
                                        </Button>
                                    </Table.HeaderCell>

                                </Table.Row>
                            </Table.Footer>
                        </Table>
                        <br/>
                        { isLabEnabled && <div>
                            <Label as='a' color='teal' style={{width:'100%',height:'35px',fontSize:'16px'}}>
                                Laboratory Test Orders
                            </Label>

                            <Table color="teal" celled>
                                <Table.Header>
                                    <Table.Row>
                                        <Table.Cell style={{ fontWeight: 'bold'}}>Lab Test Group</Table.Cell>
                                        <Table.Cell style={{ fontWeight: 'bold'}}>Lab Test</Table.Cell>
                                        <Table.Cell style={{ fontWeight: 'bold'}}>Priority</Table.Cell>
                                        {/*<Table.Cell style={{ fontWeight: 'bold'}}>Status</Table.Cell>*/}
                                    </Table.Row>
                                </Table.Header>

                                <Table.Body>
                                   {inputFieldsLab.map((labInputField, labIndex) => (
                                        <Fragment key={`${labInputField}~${labIndex}`}>
                                            <Table.Row>
                                                <Table.Cell>
                                                    <select
                                                        style={{
                                                           //border: "1px solid #014d88",
                                                           borderRadius:'0px',
                                                           fontSize:'14px',
                                                           color:'#000'
                                                         }}
                                                        className="ui fluid selection dropdown"
                                                        value={labInputField.labOrder}
                                                        onChange={ e => handleInputLabChange(labIndex, e)}
                                                        name="labOrder"
                                                        id="labOrder">
                                                        <option>Select</option>
                                                        {
                                                            labGroups.filter(e => e.groupName !== "Others").map((d)=> (
                                                                <option key={d.id} value={`${d.id}-${d.groupName}`}>
                                                                    {d.groupName}
                                                                </option>
                                                            ))
                                                        }
                                                    </select>

                                                </Table.Cell>
                                                <Table.Cell>
                                                    <select
                                                         style={{
                                                           //border: "1px solid #014d88",
                                                           borderRadius:'0px',
                                                           fontSize:'14px',
                                                           color:'#000'
                                                         }}
                                                        className="ui fluid selection dropdown"
                                                        value={labInputField.labTest}
                                                        onChange={e => handleInputLabChange(labIndex, e)}
                                                        name="labTest"
                                                        id="labTest">
                                                        <option>Select</option>
                                                             { labInputField.labTest === "" ?
                                                                labTests.map((d)=> (
                                                                    <option key={d.id} value={d.id}>
                                                                        {d.labTestName}
                                                                    </option>
                                                                ))
                                                                : prevTests.map((d)=> (
                                                                    <option key={d.id} value={d.id}>
                                                                        {d.labTestName}
                                                                    </option>
                                                                ))
                                                            }
                                                    </select>
                                                </Table.Cell>
                                                <Table.Cell>
                                                <select
                                                    style={{
                                                       //border: "1px solid #014d88",
                                                       borderRadius:'0px',
                                                       fontSize:'14px',
                                                       color:'#000'
                                                     }}
                                                    className="ui fluid selection dropdown"
                                                    value={labInputField.priority}
                                                    onChange={e => handleInputLabChange(labIndex, e)}
                                                    name="priority"
                                                    id="priority">
                                                    <option>Select</option>
                                                       {
                                                            priorities.map((d)=> (
                                                                <option key={d.id} value={d.id}>
                                                                    {d.display}
                                                                </option>
                                                            ))
                                                        }
                                                </select>

                                                </Table.Cell>
                                               {/* <Table.Cell>
                                                    <select
                                                        className="ui fluid selection dropdown"
                                                        value={labInputField.status}
                                                        onChange={e => handleInputLabChange(labIndex, e)}
                                                        name="status"
                                                        id="status">
                                                        <option>Select</option>
                                                        <option value="0">Pending Collection</option>
                                                      <option value="1">Sample Collected</option>
                                                        <option value="2">Sample Transferred</option>
                                                        <option value="3">Sample Verified</option>
                                                        <option value="4">Sample Rejected</option>
                                                        <option value="5">Result Available</option>
                                                    </select>
                                                </Table.Cell> */}
                                            </Table.Row>
                                        </Fragment>
                                    ))}
                                </Table.Body>

                                <Table.Footer>
                                    <Table.Row>
                                        <Table.HeaderCell>

                                            <Button color='blue' size="tiny" type="button" onClick={() => handleAddFieldsLab()}>
                                                <Icon name='plus' /> Add Test
                                            </Button>
                                                  {" "}
                                            <Button color="red" size="tiny" type="button" onClick={e => removeHandleAddFieldsLab(e)}>
                                                <Icon name='minus' /> Remove
                                            </Button>
                                        </Table.HeaderCell>

                                    </Table.Row>
                                </Table.Footer>
                            </Table>
                        </div>}
                        <br/>
                        <Label as='a' color='purple' style={{width:'100%',height:'35px',fontSize:'16px'}}>
                            Pharmacy Order
                        </Label>
                        <br/>
                        <br/>
                        <>
                        {
                           pharmacyOrder.length > 0 ? pharmacyOrder.map((pharmacy, i) => (
                            <div className="page-header" key={i}>
                                  <p><b>Drug</b> {pharmacy.drugName} {" "}<b>Date Ordered:</b>  {pharmacy.dateTimePrescribed.replace("@", " ")}

                                      <Label as='a' color="blue" size="tiny" onClick={() => handleEditPharmacyOrder(pharmacy)}>
                                      <Icon name='eye' /> View</Label>
                                      {" "}
                                      <Label as='a' color="red" size="tiny" onClick={() => handleDelete(pharmacy.id)}>
                                      <Icon name='delete' /> Delete</Label>
                                  </p>
                                  <hr/>
                                  {/*<br /> Start at {pharmacy.startDate} for {pharmacy.dosageFrequency} to be taken {pharmacy.duration} time(s) a day
                                  <br />
                                  Instructions: {pharmacy.comments}  <br />
                                  </p>

                                  <br/>*/}
                            </div>
                            )) :
                            <p>No previous pharmacy record for this patient</p>
                        }

                        </>
                        <br/>
                        { isPharmacyEnabled &&
                            <div>
                                <ButtonMui
                                    variant="contained"
                                    color="primary"
                                    className="ms-2"
                                    onClick={() => handleAddPharmacyOrder()}
                                >
                                    <span style={{ textTransform: "capitalize" }}>Add Pharmacy Order</span>
                                </ButtonMui>
                            </div>
                        }
                    </Segment>
                    <Button type={"submit"} variant="contained" color={"primary"}>Submit</Button>
                </form>
          </Grid.Column>

            <AddPharmacyOrder toggle={toggle} patientObj={patientObj} showModal={pharmacyModal} />
            <EditPharmacyOrder toggle={toggleOrder} patientObj={patientObj}
             showModal={pharmacyOrderModal} editPharmacyOrderValue={editPharmacyOrderValue}/>
        </Grid>
    );
  };

export default Widget;

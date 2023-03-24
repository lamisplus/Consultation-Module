import React, {Fragment, useState, useCallback, useEffect } from "react";
import { KeyboardDateTimePicker, MuiPickersUtilsProvider, KeyboardDatePicker } from "@material-ui/pickers";
import { useForm, Controller } from "react-hook-form";
import DateFnsUtils from '@date-io/date-fns';
import axios from "axios";
import { toast } from 'react-toastify';
import {token, url as baseUrl, apiUrl as apiUrl } from "../../../api";
import { Grid, Segment, Label, Icon, List,Button, Card, Feed, Input, Radio } from 'semantic-ui-react';
import {  Checkbox, Table } from 'semantic-ui-react';
import {format} from "date-fns";
import { Link, useHistory } from 'react-router-dom';
import ButtonMui from "@material-ui/core/Button";

const Widget = (props) => {
    let history = useHistory();
    const patientObj = history.location && history.location.state ? history.location.state.patientObj : {}
    //console.log("pb",patientObj)
    const [patient, setPatient] = useState({});
    const [isLabEnabled, setIsLabEnabled] = useState(false);
    const [isPharmacyEnabled, setIsPharmacyEnabled] = useState(false);
    const [hasAllergies, setHasAllergies] = useState(false);
    const [pharmacyModal, setPharmacyModal] = useState(false);
    const [latestVitals, setLatestVitals] = useState([]);
    const [previousConsultation, setPreviousConsultation] = useState([]);
    const [encounterDate, setEncounterDate] = useState(new Date());
    const { handleSubmit, control, getValues, setError, setValue } = useForm();
    const [inputFields, setInputFields] = useState(patientObj.presentingComplaints);
    const [inputFieldsDiagnosis, setInputFieldsDiagnosis] = useState(patientObj.diagnosisList);
    const [inputFieldsLab, setInputFieldsLab] = useState([
            { encounterDate: format(new Date(), 'yyyy-MM-dd'), labOrder: '',
            labTest: '', priority: '', status: '' }
        ]);
    const [saving, setSaving] = useState(false);
    const [drugs, setDrugs] = useState([]);
    const [dosageUnits, setDosageUnits] = useState([]);
    const [durationUnits, setDurationUnits] = useState([]);
    const [editPharmacyOrder, setEditPharmacyOrder] = useState({
        encounterDateTime: "",
        drugName: "",
        dosageStrength: "",
        dosageStrengthUnit: "",
        dosageFrequency: "",
        startDate: "",
        duration: "",
        durationUnit: "",
        comments: "",
        orderedBy: "",
        dateTimePrescribed: ""
    });

    const toggle = () => setPharmacyModal(!pharmacyModal);

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

        try {
            const InData = {
                "diagnosisList": diagnosisList,
                "encounterDate": patientObj.encounterDate,
                "patientId": patientObj.patientId,
                "id": patientObj.id,
                "presentingComplaints": presentingComplaints,
                "visitId": patientObj.visitId,
                "visitNotes": patientObj.visitNotes
            };

            await axios.put(`${baseUrl}consultations/${patientObj.id}`, InData,
            { headers: {"Authorization" : `Bearer ${token}`} }).then(( resp ) => {
                console.log("diagnosis updated successfully", resp)
            });

            for (const inputField of inputFieldsLab) {
            //console.log("input",inputField)
                if (inputField.id) {
                    labTests.push({
                    "id": inputField.id,
                    "labTestGroupId": inputField.labOrder,
                    "labTestId": inputField.labTest,
                    "labTestOrderStatus": inputField.status,
                    "orderPriority": inputField.priority,
                  });
                }
            }

            const labOrder = {
                  "id": inputFieldsLab[0].id,
                  "orderDate": inputFieldsLab[0].orderDate,
                  "patientId": patientObj.patientId,
                  "tests": labTests,
                  "visitId": patientObj.visitId
            }

            console.log("lb", labOrder)

            axios.put(`${baseUrl}laboratory/orders/${inputFieldsLab[0].orderId}`, labOrder,
            { headers: {"Authorization" : `Bearer ${token}`} }).then(( resp ) => {
               console.log("lab updated successfully", resp)
                for (const pharm of editPharmacyOrder) {
                    console.log("pharm", pharm)
                    axios.put(`${apiUrl}drug-orders/${pharm.id}`, pharm,
                       { headers: {"Authorization" : `Bearer ${token}`}}).then(resp => {
                           console.log("drug updated successfully", resp );
                       });
               }
            });

            toast.success("Successfully updated patient consultation!", {
                position: toast.POSITION.TOP_RIGHT
            });
           history.push('/');

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

    const loadLatestVitals = useCallback(async () => {
        try {
            const response = await axios.get(`${baseUrl}patient/vital-sign/person/${patientObj.patientId}`, { headers: {"Authorization" : `Bearer ${token}`}});
            setLatestVitals(response.data);
        } catch (e) {
            toast.error("An error occurred while fetching vitals", {
                position: toast.POSITION.TOP_RIGHT
            });
        }
    }, []);

    const loadLabGroup = useCallback(async () => {
            try {
                const response = await axios.get(`${baseUrl}laboratory/labtestgroups`, { headers: {"Authorization" : `Bearer ${token}`}});
                setLabGroups(response.data);
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

    const pharmacy_by_visitId = useCallback(async () => {
        try {
            const response = await axios.get(`${apiUrl}drug-orders/visits/${patientObj.visitId}`,
            { headers: {"Authorization" : `Bearer ${token}`}});

            if (typeof response.data === 'string') {
                setEditPharmacyOrder([]);
            }else {
                setEditPharmacyOrder(response.data);
            }
        } catch (e) {
            toast.error("An error occurred while fetching pharmacy data", {
                position: toast.POSITION.TOP_RIGHT
            });
        }
    }, []);

    const labtest_by_visitId = useCallback(async () => {
        try {
            const response = await axios.get(`${baseUrl}laboratory/orders/visits/${patientObj.visitId}`,
            { headers: {"Authorization" : `Bearer ${token}`}});

            const labTests = [];

            for (const lab of response.data) {

                for (const data of lab.labOrder.tests) {
                    let labId = data.id;
                    let labTestDesc = data.description;
                    let labTestGroup = data.labTestGroupId;
                    let labTestId = data.labTestId;
                    let orderPriority = data.orderPriority;
                    let labTestOrderStatus = data.labTestOrderStatus;

                    let labdata = {
                      labOrder: labTestGroup,
                      labTest: labTestId,
                      priority: orderPriority,
                      status: labTestOrderStatus,
                      id: labId,
                      orderId: lab.labOrder.id,
                      orderDate: lab.labOrder.orderDate
                      };

                    labTests.push(labdata)
                }
            }

             setInputFieldsLab(labTests);
        } catch (e) {
            toast.error("An error occurred while fetching lab tests order data", {
                position: toast.POSITION.TOP_RIGHT
            });
        }
    }, []);

    let drugRows = null;
    let dosageUnitsRows = null;
    let durationUnitsRows = null;

    const loadDosageUnits = useCallback(async () => {
        try {
            const response = await axios.get(`${baseUrl}application-codesets/v2/DOSE_STRENGTH_UNIT`,
            { headers: {"Authorization" : `Bearer ${token}`}});
            setDosageUnits(response.data);
        } catch (e) {
            toast.error("An error occurred while fetching DOSE STRENGTH UNIT", {
                position: toast.POSITION.TOP_RIGHT
            });
        }
    }, []);

    const loadDurationUnits = useCallback(async () => {
        try {
            const response = await axios.get(`${baseUrl}application-codesets/v2/AGE_UNIT`,
            { headers: {"Authorization" : `Bearer ${token}`}});
            setDurationUnits(response.data);
        } catch (e) {
            toast.error("An error occurred while fetching DOSE STRENGTH UNIT", {
                position: toast.POSITION.TOP_RIGHT
            });
        }
    }, []);

    const loadPharmacyDrugs = useCallback(async () => {
        try {
            const response = await axios.get(`${apiUrl}drugs`,
            { headers: {"Authorization" : `Bearer ${token}`}});
            setDrugs(response.data);
        } catch (e) {
            toast.error("An error occurred while fetching drugs", {
                position: toast.POSITION.TOP_RIGHT
            });
        }
    }, []);

    useEffect(() => {
        loadPharmacyCheck();
        loadLabCheck();
        loadLatestVitals();
        loadLabGroup();
        priority();
        labtest_by_visitId();
        pharmacy_by_visitId();
        loadDosageUnits();
        loadDurationUnits();
        loadPharmacyDrugs();
    }, [loadPharmacyCheck, loadLabCheck, loadLatestVitals,
    loadLabGroup, priority, labtest_by_visitId, pharmacy_by_visitId,
    loadDosageUnits, loadDurationUnits, loadPharmacyDrugs]);

    const handleAddFields = () => {
        const values = [...inputFields];
        values.push({ complaint: '', onsetDate: '', severity: 0, dateResolved: '' });
        setInputFields(values);
    };

    const handleAddDiagFields = () => {
        const values = [...inputFieldsDiagnosis];
        values.push({ certainty: '', diagnosis: '', diagnosisOrder: 0 });
        setInputFieldsDiagnosis(values);
    };

    const handleAddFieldsLab = () => {
        const values = [...inputFieldsLab];
        values.push({ encounterDate: format(new Date(), 'yyyy-MM-dd'), labOrder: '', labTest: '', priority: '', status: '' });
        setInputFieldsLab(values);
    };

    const handleInputChange = (index, event) => {
        const values = [...inputFields];
        if (event.target.name === "complaint") {
            values[index].complaint = event.target.value;
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
        if (event.target.name === "diagnosis") {
            values[index].diagnosis = event.target.value;
        } else if (event.target.name === "certainty") {
            values[index].certainty = event.target.value;
        } else if (event.target.name === "diagnosisOrder") {
            values[index].diagnosisOrder = event.target.value;
        }
        setInputFieldsDiagnosis(values);
    };

    const labCascade = id => {
        labGroups.forEach(function (x) {
              if ( x.id == id) {
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
            } else if (event.target.name === "priority") {
                values[index].priority = event.target.value;
            }
            else if (event.target.name === "status") {
                values[index].status = event.target.value;
            }

            setInputFieldsLab(values);
        };

    const handleInputChangePharmacyOrderDto = (index, e) => {
        const values = [...editPharmacyOrder];
        if (e.target.name === "encounterDateTime") {
            values[index].encounterDateTime = e.target.value;
        }
        else if (e.target.name === "drugName") {
            values[index].drugName = e.target.value;
        }
        else if (e.target.name === "dosageStrength") {
            values[index].dosageStrength = e.target.value;
        }
        else if (e.target.name === "dosageStrengthUnit") {
            values[index].dosageStrengthUnit = e.target.value;
        }
        else if (e.target.name === "dosageFrequency") {
            values[index].dosageFrequency = e.target.value;
        }
        else if (e.target.name === "startDate") {
            values[index].startDate = e.target.value;
        }
        else if (e.target.name === "duration") {
            values[index].duration = e.target.value;
        }
        else if (e.target.name === "durationUnit") {
            values[index].durationUnit = e.target.value;
        }
        else if (e.target.name === "comments") {
            values[index].comments = e.target.value;
        }
        else if (e.target.name === "orderedBy") {
            values[index].orderedBy = e.target.value;
        }
        else if (e.target.name === "dateTimePrescribed") {
            values[index].dateTimePrescribed = e.target.value;
        }
        setEditPharmacyOrder(values);
    };

    const handleAddPharmacyOrder = () => {
        setPharmacyModal(!pharmacyModal);
    };

    if (drugs && drugs.length > 0) {
        drugRows = drugs.map((drug, index) => (
            <option key={drug.name} value={drug.name}>{drug.name}</option>
        ));
    }
    if (dosageUnits && dosageUnits.length > 0) {
        dosageUnitsRows = dosageUnits.map((dosageUnit, index) => (
            <option key={dosageUnit.display} value={dosageUnit.display}>{dosageUnit.display}</option>
        ));
    }
    if (durationUnits && durationUnits.length > 0) {
        durationUnitsRows = durationUnits.map((durationUnit, index) => (
            <option key={durationUnit.display} value={durationUnit.display}>{durationUnit.display}</option>
        ));
    }

    return (
        <Grid columns='equal'>
            <Grid.Column>
                { latestVitals && latestVitals.length > 0 &&
                    <Segment>
                        <Label as='a' color='blue' ribbon>
                            Recent Vitals
                        </Label>
                        <br/>
                        <List celled>
                            <List.Item>Pulse <span className="float-end"><b>{latestVitals[latestVitals.length - 1].pulse}bpm</b></span></List.Item>
                            <List.Item>Respiratory Rate <span className="float-end"><b>{latestVitals[latestVitals.length - 1].respiratoryRate}bpm</b></span></List.Item>
                            <List.Item>Temperature <span className="float-end"><b>{latestVitals[latestVitals.length - 1].temperature}<sup>0</sup>C</b></span></List.Item>
                            <List.Item>Blood Presure <span  className="float-end"><b>{latestVitals[latestVitals.length - 1].systolic}/{latestVitals[latestVitals.length - 1].diastolic}</b></span></List.Item>
                            <List.Item>Height <span  className="float-end"><b>{latestVitals[latestVitals.length - 1].height}m</b></span></List.Item>
                            <List.Item>Weight <span  className="float-end"><b>{latestVitals[latestVitals.length - 1].bodyWeight}kg</b></span></List.Item>
                        </List>
                    </Segment>
                }

                { previousConsultation &&
                    <Segment>
                        <Label as='a' color='black' ribbon>
                            Conditions
                        </Label>
                        <br/>

                        { previousConsultation.map((consultation, i) => (
                            <div>
                                {consultation.diagnosisList.map((diagnosis, j)=> (
                                    <Label as='a'  color='white'  size="mini" pointing>
                                        {diagnosis.diagnosis}
                                    </Label>
                                ))}
                            </div>
                        ))}
                    </Segment>
                }


                { hasAllergies &&
                    <Segment>
                        <Label as='a' color='red' ribbon>
                            Allergies
                        </Label>
                        <br/><br/>

                        <Label.Group color='blue'>
                            <Label as='a'  size="mini">dust</Label>
                            <Label as='a'  size="mini">smoke</Label>
                        </Label.Group>
                    </Segment>
                }
            </Grid.Column>

            <Grid.Column width={10}>
                <form onSubmit={handleSubmit(onSubmit, OnError)}>
                    <Label as='a' color='black' ribbon>
                        <b>Physical Examination</b>
                    </Label>

                    <Segment>
                        <div className="input-group input-group-sm mb-3">
                            <span className="input-group-text">Encounter Date</span>
                            <MuiPickersUtilsProvider utils={DateFnsUtils}>
                                <Controller
                                    name="encounterDate"
                                    control={control}
                                    defaultValue={encounterDate}
                                    rules={{ required: true }}
                                    render={({ field: { ref, ...rest }}) => (
                                        <KeyboardDateTimePicker
                                            disableFuture
                                            format="dd/MM/yyyy hh:mm a"
                                            value={patientObj.encounterDate}
                                            onChange={setEncounterDate}
                                            className="form-control"
                                            invalidDateMessage={"Encounter date is required"}
                                            {...rest}
                                        />
                                    )}
                                    />
                            </MuiPickersUtilsProvider>
                        </div>

                        <div className="input-group input-group-sm mb-3">
                            <span className="input-group-text">Visit Note</span>
                            <Controller
                                name="visitNote"
                                control={control}
                                rules={{ required: false }}
                                render={({ field: { ref, ...rest }}) => (
                                    <textarea
                                    className="form-control"
                                    style={{ minHeight: 300,border:'1px solid #014d88', fontSize:'16px' }}
                                    {...rest}
                                    >{patientObj.visitNotes}</textarea>
                                )}
                            />
                        </div>
                        <br/>
                        <Label as='a' color='red' ribbon>
                            Presenting Complaints
                        </Label>
                        <Table color="red" celled>
                            <Table.Header>
                                <Table.Row>
                                    <Table.Cell style={{ fontWeight: 'bold'}}>Complaints</Table.Cell>
                                    <Table.Cell style={{ fontWeight: 'bold'}}>Onset Date</Table.Cell>
                                    <Table.Cell style={{ fontWeight: 'bold'}}>Severity</Table.Cell>
                                    <Table.Cell style={{ fontWeight: 'bold'}}>Date Resolved</Table.Cell>
                                </Table.Row>
                            </Table.Header>

                            <Table.Body>
                                    {inputFields && inputFields.map((inputField, index) => (
                                        <Fragment key={`${inputField}~${index}`}>
                                            <Table.Row>
                                            <Table.Cell>
                                                <Input
                                                    id="complaint"
                                                    name="complaint"
                                                    type="text"
                                                    fluid
                                                    placeholder='Enter Presenting Complaints'
                                                    value={inputField.complaint}
                                                    onChange={event => handleInputChange(index, event)}
                                                />
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Input
                                                    id="onsetDate"
                                                    name="onsetDate"
                                                    type="date"
                                                    fluid
                                                    placeholder='Onset Date'
                                                    value={inputField.onsetDate}
                                                    onChange={event => handleInputChange(index, event)}
                                                />
                                            </Table.Cell>
                                            <Table.Cell>
                                                <select
                                                    class="ui fluid selection dropdown"
                                                    value={inputField.severity}
                                                    onChange={event => handleInputChange(index, event)}
                                                    name="severity"
                                                    id="severity">
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
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Input
                                                    id="dateResolved"
                                                    name="dateResolved"
                                                    type="date"
                                                    fluid
                                                    placeholder='Date Resolved'
                                                    value={inputField.dateResolved}
                                                    onChange={event => handleInputChange(index, event)}
                                                />
                                            </Table.Cell>
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
                                    </Table.HeaderCell>
                                </Table.Row>
                            </Table.Footer>
                        </Table>
                        <br/>
                        <Label as='a' color='pink' ribbon>
                            Clinical Diagnosis
                        </Label>
                        <Table color="pink" celled>
                            <Table.Header>
                                <Table.Row>
                                    <Table.Cell style={{ fontWeight: 'bold'}}>Condition</Table.Cell>
                                    <Table.Cell style={{ fontWeight: 'bold'}}>Order</Table.Cell>
                                    <Table.Cell style={{ fontWeight: 'bold'}}>Certainty</Table.Cell>
                                    <Table.Cell style={{ fontWeight: 'bold'}}></Table.Cell>
                                </Table.Row>
                            </Table.Header>

                            <Table.Body>
                                {inputFieldsDiagnosis && inputFieldsDiagnosis.map((diagInputField, diagIndex) => (
                                    <Fragment key={`${diagInputField}~${diagIndex}`}>
                                        <Table.Row>
                                            <Table.Cell>
                                                <Input
                                                    id="diagnosis"
                                                    name="diagnosis"
                                                    type="text"
                                                    fluid
                                                    placeholder='Condition'
                                                    value={diagInputField.diagnosis}
                                                    onChange={event => handleInputDiagChange(diagIndex, event)}
                                                />
                                            </Table.Cell>
                                            <Table.Cell>
                                                <select
                                                    className="ui fluid selection dropdown"
                                                    value={diagInputField.diagnosisOrder}
                                                    onChange={event => handleInputDiagChange(diagIndex, event)}
                                                    name="diagnosisOrder"
                                                    id="diagnosisOrder">
                                                    <option></option>
                                                    <option value="1">Primary</option>
                                                    <option value="2">Secondary</option>
                                                </select>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <select
                                                    className="ui fluid selection dropdown"
                                                    value={diagInputField.certainty}
                                                    onChange={event => handleInputDiagChange(diagIndex, event)}
                                                    name="certainty"
                                                    id="certainty">
                                                    <option></option>
                                                    <option value="1">Presumed</option>
                                                    <option value="2">Confirmed</option>
                                                </select>
                                            </Table.Cell>
                                            <Table.Cell></Table.Cell>
                                        </Table.Row>
                                    </Fragment>
                                ))}
                            </Table.Body>

                            <Table.Footer>
                                <Table.Row>
                                    <Table.HeaderCell>

                                        <Button color="blue" size="tiny" type="button" onClick={() => handleAddDiagFields()}>
                                            <Icon name='plus' /> Add More
                                        </Button>
                                    </Table.HeaderCell>

                                </Table.Row>
                            </Table.Footer>
                        </Table>
                        <br/>
                        { isLabEnabled && <div>
                            <Label as='a' color='teal' ribbon>
                                Lab Test
                            </Label>

                            <Table color="teal" celled>
                                <Table.Header>
                                    <Table.Row>
                                        <Table.Cell style={{ fontWeight: 'bold'}}>Lab Test Group</Table.Cell>
                                        <Table.Cell style={{ fontWeight: 'bold'}}>Lab Test</Table.Cell>
                                        <Table.Cell style={{ fontWeight: 'bold'}}>Priority</Table.Cell>
                                        <Table.Cell style={{ fontWeight: 'bold'}}>Status</Table.Cell>
                                    </Table.Row>
                                </Table.Header>

                                <Table.Body>
                                   {inputFieldsLab && inputFieldsLab.map((labInputField, labIndex) => (
                                        <Fragment key={`${labInputField}~${labIndex}`}>
                                            <Table.Row>
                                                <Table.Cell>
                                                    <select
                                                        className="ui fluid selection dropdown"
                                                        value={labInputField.labOrder}
                                                        onChange={ e => handleInputLabChange(labIndex, e)}
                                                        name="labOrder"
                                                        id="labOrder">
                                                        <option></option>
                                                        {
                                                            labGroups.map((d)=> (
                                                                <option key={d.id} value={`${d.id}-${d.groupName}`}>
                                                                    {d.groupName}
                                                                </option>
                                                            ))
                                                        }
                                                    </select>

                                                </Table.Cell>
                                                <Table.Cell>
                                                    <select
                                                        className="ui fluid selection dropdown"
                                                        value={labInputField.labTest}
                                                        onChange={e => handleInputLabChange(labIndex, e)}
                                                        name="labTest"
                                                        id="labTest">
                                                        <option></option>
                                                             {
                                                                labTests.map((d)=> (
                                                                    <option key={d.id} value={d.id}>
                                                                        {d.labTestName}
                                                                    </option>
                                                                ))
                                                            }
                                                    </select>

                                                </Table.Cell>
                                                <Table.Cell>
                                                <select
                                                    className="ui fluid selection dropdown"
                                                    value={labInputField.priority}
                                                    onChange={e => handleInputLabChange(labIndex, e)}
                                                    name="priority"
                                                    id="priority">
                                                    <option></option>
                                                       {
                                                            priorities.map((d)=> (
                                                                <option key={d.id} value={d.id}>
                                                                    {d.display}
                                                                </option>
                                                            ))
                                                        }
                                                </select>

                                                </Table.Cell>
                                                <Table.Cell>
                                                    <select
                                                        className="ui fluid selection dropdown"
                                                        value={labInputField.status}
                                                        onChange={e => handleInputLabChange(labIndex, e)}
                                                        name="status"
                                                        id="status">
                                                        <option></option>
                                                          <option value="0">Pending Collection</option>
                                                            <option value="1">Sample Collected</option>
                                                            <option value="2">Sample Transferred</option>
                                                            <option value="3">Sample Verified</option>
                                                            <option value="4">Sample Rejected</option>
                                                            <option value="5">Result Available</option>

                                                    </select>
                                                </Table.Cell>
                                            </Table.Row>
                                        </Fragment>
                                    ))}
                                </Table.Body>

                                <Table.Footer>
                                    <Table.Row>
                                        <Table.HeaderCell>

                                            <Label as='a' color="blue" size="tiny" onClick={() => handleAddFieldsLab()}>
                                                <Icon name='plus' /> Add Test
                                            </Label>
                                        </Table.HeaderCell>

                                    </Table.Row>
                                </Table.Footer>
                            </Table>
                        </div>}
                        <br/>
                        <Label as='a' color='purple' ribbon>
                            Pharmacy Order
                        </Label>
                        <br/>
                        <br/>

                           {   editPharmacyOrder.length > 0 ?
                               editPharmacyOrder.map((d, index)=> (
                                  <Fragment key={index}>
                                      <div className="row">
                                          <div className="col-md-6">
                                                <Input
                                                   label="Order Date"
                                                   type="date"
                                                   name="encounterDateTime"
                                                   id="encounterDateTime"
                                                   fluid
                                                   onChange={e => handleInputChangePharmacyOrderDto(index, e)}
                                                   value={d.encounterDateTime.substring(0,10)}
                                               />
                                          </div>
                                          <div className="col-md-6">
                                              <select
                                                  label="Drug Name"
                                                  className="ui fluid selection dropdown"
                                                  onChange={e => handleInputChangePharmacyOrderDto(index, e)}
                                                  value={d.drugName}
                                                  name="drugName"
                                                  id="drugName">
                                                  <option></option>
                                                  {drugRows}
                                              </select>
                                          </div>
                                     </div>
                                     <br />
                                     <div className="row">
                                        <div className="col-md-6">
                                             <Input
                                                 label="Dosage Strength"
                                                 type="text"
                                                 name="dosageStrength"
                                                 id="dosageStrength"
                                                 fluid
                                                 onChange={e => handleInputChangePharmacyOrderDto(index, e)}
                                                 value={d.dosageStrength}
                                             />
                                        </div>
                                         <div className="col-md-6">
                                          <select
                                              className="ui fluid selection dropdown"
                                              name="dosageStrengthUnit"
                                              id="dosageStrengthUnit"
                                              onChange={e => handleInputChangePharmacyOrderDto(index, e)}
                                              value={d.dosageStrengthUnit}
                                              >
                                              <option></option>
                                              {dosageUnitsRows}
                                          </select>
                                       </div>
                                     </div>
                                     <br/>
                                     <div className="row">

                                         <div className="col-md-6">
                                           <Input
                                              label="Drug Brand"
                                              type="text"
                                              name="brand"
                                              id="brand"
                                              fluid
                                              onChange={e => handleInputChangePharmacyOrderDto(index, e)}
                                              value={d.brand}
                                           />
                                         </div>
                                         <div className="col-md-6">
                                              <Input
                                                  label="Dosage Frequency"
                                                  type="text"
                                                  name="dosageFrequency"
                                                  id="dosageFrequency"
                                                  fluid
                                                  onChange={e => handleInputChangePharmacyOrderDto(index, e)}
                                                  value={d.dosageFrequency}
                                              />
                                         </div>
                                    </div>
                                    <br/>
                                       <div className="row">
                                           <div className="col-md-4">
                                                <Input
                                                    label="Start Date"
                                                    type="date"
                                                    name="startDate"
                                                    id="startDate"
                                                    fluid
                                                    onChange={e => handleInputChangePharmacyOrderDto(index, e)}
                                                    value={d.startDate}
                                                />
                                           </div>
                                           <div className="col-md-4">
                                                 <Input
                                                    label="Duration"
                                                    type="text"
                                                    name="duration"
                                                    id="duration"
                                                    fluid
                                                    onChange={e => handleInputChangePharmacyOrderDto(index, e)}
                                                    value={d.duration}
                                                />
                                           </div>
                                           <div className="col-md-4">
                                               <select

                                                     className="ui fluid selection dropdown"
                                                     name="durationUnit"
                                                     id="durationUnit"
                                                     onChange={e => handleInputChangePharmacyOrderDto(index, e)}
                                                     value={d.durationUnit}
                                                     >
                                                     <option></option>
                                                     {durationUnitsRows}
                                                 </select>
                                           </div>
                                      </div>
                                      <br/>
                                      <div className="row">
                                       <Input
                                             label="Comments"
                                             type="text"
                                             name="comments"
                                             id="comments"
                                             onChange={e => handleInputChangePharmacyOrderDto(index, e)}
                                             value={d.comments}
                                         />
                                     </div>
                                     <hr/>
                                     </Fragment>
                                  )) : "No pharmacy order for patient."
                           }

                    </Segment>
                    <Button type={"submit"} variant="contained" color={"primary"}>Submit</Button>
                </form>
          </Grid.Column>
          <Grid.Column>
            <Segment>
            <List>
                  <List.Item>
                      <Link
                          to={{
                              pathname: "/",
                              state: { patientObj: patientObj  }
                          }}>
                          <Button icon labelPosition='right' color='green' fluid>
                              <Icon name='angle double left' />
                              Back
                          </Button>
                      </Link>
                  </List.Item>
                  <List.Item>
                  <Button icon labelPosition='right' color='blue' fluid>
                      <Icon name='calendar alternate' />
                        Appointment
                    </Button>
                  </List.Item>
            </List>
                { previousConsultation &&
                    <Card>
                        <Card.Content>
                            <b>Previous Clinical Notes</b>
                        </Card.Content>
                        <Card.Content>
                            <Feed>
                                { previousConsultation.map((consultation, i) => (
                                    <div>
                                        <Feed.Event>
                                            <Feed.Content>
                                                <Feed.Date content={consultation.encounterDate} />
                                                <Feed.Summary>
                                                    {consultation.visitNotes}
                                                </Feed.Summary>
                                            </Feed.Content>
                                        </Feed.Event>
                                        <hr/>
                                    </div>
                                )) }
                            </Feed>
                        </Card.Content>
                    </Card>
                }
            </Segment>
          </Grid.Column>
        </Grid>
    );
  };

export default Widget;

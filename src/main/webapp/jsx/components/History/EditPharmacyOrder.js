import React, {Fragment, useState, useCallback, useEffect} from 'react';
import { Form,Row, Card,CardBody, FormGroup, Label, Input, InputGroup,InputGroupText} from 'reactstrap';
import MatButton from '@material-ui/core/Button'
import { makeStyles } from '@material-ui/core/styles'
import SaveIcon from '@material-ui/icons/Save'
import CancelIcon from '@material-ui/icons/Cancel'
import axios from "axios";
import { toast} from "react-toastify";
import {token, url as baseUrl, apiUrl as apiUrl } from "../../../api";
import { useHistory } from "react-router-dom";
import {  Modal, Button } from "react-bootstrap";
import {format} from "date-fns";

import 'react-summernote/dist/react-summernote.css'; // import styles
import { Spinner } from "reactstrap";

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
}));

const EditPharmacyOrder = (props) => {
    const patientObj = props.patientObj;
    const pharmacyOrder = props.editPharmacyOrderValue;
    const [saving, setSaving] = useState(false);
    const classes = useStyles();
    const [drugs, setDrugs] = useState([]);
    const [dosageUnits, setDosageUnits] = useState([]);
    const [durationUnits, setDurationUnits] = useState([]);

    const [pharmacyOrderEdit, setPharmacyOrderEdit] = useState({
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

    const handleInputChangePharmacyOrderDto = e => {
        console.log(e)
        setPharmacyOrderEdit({...pharmacyOrderEdit, [e.target.name]: e.target.value});
    };

    const handleSubmit = async (e) => {
        try {
            e.preventDefault();
            setSaving(true);

            console.log(pharmacyOrder)

//            axios.put(`${apiUrl}drug-orders/${pharmacyOrder.id}`, pharmacyOrder,
//            { headers: {"Authorization" : `Bearer ${token}`}}).then(resp => {
//                console.log("drug updated successfully", resp );
//                 toast.success("Successfully Saved drug order!", {
//                    position: toast.POSITION.TOP_RIGHT
//                });
//            });
//

            setSaving(false);
            props.toggle()
        } catch (e) {
            toast.error("An error occurred while saving drug prescription", {
                position: toast.POSITION.TOP_RIGHT
            });
        }
    };

    const loadDosageUnits = useCallback(async () => {
        try {
            const response = await axios.get(`${baseUrl}application-codesets/v2/DOSE_STRENGTH_UNIT`, { headers: {"Authorization" : `Bearer ${token}`}});
            setDosageUnits(response.data);
        } catch (e) {
            toast.error("An error occurred while fetching DOSE STRENGTH UNIT", {
                position: toast.POSITION.TOP_RIGHT
            });
        }
    }, []);

    const loadDurationUnits = useCallback(async () => {
        try {
            const response = await axios.get(`${baseUrl}application-codesets/v2/AGE_UNIT`, { headers: {"Authorization" : `Bearer ${token}`}});
            setDurationUnits(response.data);
        } catch (e) {
            toast.error("An error occurred while fetching DOSE STRENGTH UNIT", {
                position: toast.POSITION.TOP_RIGHT
            });
        }
    }, []);

    const loadPharmacyDrugs = useCallback(async () => {
        try {
            const response = await axios.get(`${apiUrl}drugs`, { headers: {"Authorization" : `Bearer ${token}`}});
            //console.log("drugs", response.data[0].id)
            if (response.data[0].id > 0) {
                 setDrugs(response.data);
            }
        } catch (e) {
            toast.error("An error occurred while fetching drugs", {
                position: toast.POSITION.TOP_RIGHT
            });
        }
    }, []);

    useEffect(() => {
        loadPharmacyDrugs();
        loadDosageUnits();
        loadDurationUnits();
    }, [loadPharmacyDrugs, loadDosageUnits, loadDurationUnits]);

    let drugRows = null;
    let dosageUnitsRows = null;
    let durationUnitsRows = null;
    if (drugs && drugs.length > 0) {
        //console.log("drugs", drugs);
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
        <div>
            <Modal show={props.showModal} toggle={props.toggle} className="fade" size="lg">
                <Modal.Header toggle={props.toggle} style={{backgroundColor:"#eeeeee"}}>
                    Patient Drug Prescription
                    <Button
                        variant=""
                        className="btn-close"
                        onClick={props.toggle}
                    ></Button>
                </Modal.Header>
                <Modal.Body>
                    <Card >
                        <CardBody>
                            <form>
                                <div className="row">
                                    <div className="form-group  mb-3">
                                        <FormGroup>
                                            <Label>Encounter Date</Label>
                                            <InputGroup>
                                                <Input
                                                    type="date"
                                                    name="encounterDateTime"
                                                    id="encounterDateTime"
                                                    onChange={handleInputChangePharmacyOrderDto}
                                                    value={pharmacyOrder.encounterDateTime.substring(0,10)}
                                                />
                                            </InputGroup>

                                        </FormGroup>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="form-group mb-3 col-md-4">
                                        <FormGroup>
                                            <Label>Select Drugs</Label>
                                            <InputGroup>
                                                <Input
                                                    type="select"
                                                    name="drugName"
                                                    id="drugName"
                                                    onChange={handleInputChangePharmacyOrderDto}
                                                    value={pharmacyOrder.drugName}
                                                >
                                                    <option value={""}></option>
                                                    {drugRows}
                                                </Input>
                                            </InputGroup>
                                        </FormGroup>
                                    </div>

                                    <div className="form-group mb-3 col-md-4">
                                        <FormGroup>
                                            <Label>Dosage Strength</Label>
                                            <InputGroup>
                                                <Input
                                                    type="text"
                                                    name="dosageStrength"
                                                    id="dosageStrength"
                                                    onChange={handleInputChangePharmacyOrderDto}
                                                    value={pharmacyOrder.dosageStrength}
                                                />

                                            </InputGroup>
                                        </FormGroup>
                                    </div>
                                    <div className="form-group mb-3 col-md-4">
                                        <FormGroup>
                                            <Label>Dosage Unit</Label>
                                            <InputGroup>
                                                <Input
                                                    type="select"
                                                    name="dosageStrengthUnit"
                                                    id="dosageStrengthUnit"
                                                    onChange={handleInputChangePharmacyOrderDto}
                                                    value={pharmacyOrder.dosageStrengthUnit}
                                                >
                                                    <option value={""}></option>
                                                    {dosageUnitsRows}
                                                </Input>
                                            </InputGroup>
                                        </FormGroup>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="form-group mb-3">
                                        <FormGroup>
                                            <Label>Drug Brand Name</Label>
                                            <InputGroup>
                                                <Input
                                                    type="text"
                                                    name="brand"
                                                    id="brand"
                                                    onChange={handleInputChangePharmacyOrderDto}
                                                    value={pharmacyOrder.brand}
                                                />

                                            </InputGroup>
                                        </FormGroup>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="form-group mb-3 col-md-6">
                                        <FormGroup>
                                            <Label>Dose Frequency</Label>
                                            <InputGroup>
                                                <Input
                                                    type="text"
                                                    name="dosageFrequency"
                                                    id="dosageFrequency"
                                                    onChange={handleInputChangePharmacyOrderDto}
                                                    value={pharmacyOrder.dosageFrequency}
                                                />

                                            </InputGroup>
                                        </FormGroup>
                                    </div>
                                    <div className="form-group mb-3 col-md-6">
                                        <FormGroup>
                                            <Label>Start Date</Label>
                                            <InputGroup>
                                                <Input
                                                    type="date"
                                                    name="startDate"
                                                    id="startDate"
                                                    onChange={handleInputChangePharmacyOrderDto}
                                                    value={pharmacyOrder.startDate}
                                                />
                                            </InputGroup>
                                        </FormGroup>
                                    </div>
                                    <div className="form-group mb-3 col-md-6">
                                        <FormGroup>
                                            <Label>Duration</Label>
                                            <InputGroup>
                                                <Input
                                                    type="text"
                                                    name="duration"
                                                    id="duration"
                                                    onChange={handleInputChangePharmacyOrderDto}
                                                    value={pharmacyOrder.duration}
                                                />

                                            </InputGroup>
                                        </FormGroup>
                                    </div>

                                    <div className="form-group mb-3 col-md-6">
                                        <FormGroup>
                                            <Label>Duration Unit</Label>
                                            <InputGroup>
                                                <Input
                                                    type="select"
                                                    name="durationUnit"
                                                    id="durationUnit"
                                                    onChange={handleInputChangePharmacyOrderDto}
                                                    value={pharmacyOrder.durationUnit}
                                                >
                                                    <option value={""}></option>
                                                    {durationUnitsRows}
                                                </Input>
                                            </InputGroup>
                                        </FormGroup>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="form-group mb-3">
                                        <FormGroup>
                                            <Label>Other Instructions</Label>
                                            <InputGroup>
                                                <Input
                                                    type="textarea"
                                                    name="comments"
                                                    id="comments"
                                                    onChange={handleInputChangePharmacyOrderDto}
                                                    value={pharmacyOrder.comments}
                                                />

                                            </InputGroup>
                                        </FormGroup>
                                    </div>
                                </div>



                                {saving ? <Spinner /> : ""}
                                <br />

                               {/* <MatButton
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    className={classes.button}
                                    startIcon={<SaveIcon />}
                                    onClick={handleSubmit}
                                >
                                    {!saving ? (
                                        <span style={{ textTransform: "capitalize" }}>Update</span>
                                    ) : (
                                        <span style={{ textTransform: "capitalize" }}>Saving...</span>
                                    )}
                                </MatButton>*/}

                                <MatButton
                                    variant="contained"
                                    className={classes.button}
                                    startIcon={<CancelIcon />}
                                    onClick={props.toggle}
                                >
                                    <span style={{ textTransform: "capitalize" }}>Cancel</span>
                                </MatButton>

                            </form>
                        </CardBody>
                    </Card>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default EditPharmacyOrder;

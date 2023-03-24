import React, {useState, useEffect} from 'react';
import { Form,Row, Card,CardBody} from 'reactstrap';
import MatButton from '@material-ui/core/Button'
import { makeStyles } from '@material-ui/core/styles'
import SaveIcon from '@material-ui/icons/Save'
import CancelIcon from '@material-ui/icons/Cancel'
import axios from "axios";
import { toast} from "react-toastify";
import { url as baseUrl, token } from "./../../../api";
import { useHistory } from "react-router-dom";
import {  Modal, Button } from "react-bootstrap";
import {format} from 'date-fns';
import 'react-summernote/dist/react-summernote.css'; // import styles
import { Spinner } from "reactstrap";
import Select from "react-select";


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
}))
let newDate = new Date()

const PostPatient = (props) => {
    const patientObj = props.patientObj;
    //console.log(patientObj)
    const [selectedOption, setSelectedOption] = useState();
    let history = useHistory();
    const classes = useStyles()
    const [services, setServices]= useState([]);
    //const [values, setValues] = useState([]);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        ServicesPost()
    }, []);
    ///GET LIST OF Post Services
    async function ServicesPost() {
        axios
            .get(`${baseUrl}patient/vital-sign/post-service`,
                { headers: {"Authorization" : `Bearer ${token}`} }
            )
            .then((response) => {
                const filterService = response.data.filter((x) => x.moduleServiceCode!=='consultation-code')

                setServices(
                    Object.entries(filterService).map(([key, value]) => ({
                        label: value.moduleServiceName,
                        value: value.moduleServiceCode,
                    })))

            })
            .catch((error) => {
            });
    }

    const [postServices, setPostServices]= useState({
        encounterDate:format(new Date(newDate), 'yyyy-MM-dd'),
        facilityId: 1,
        personId:"",
        serviceCode:"",
        visitId: ""
    })


    /**** Submit Button Processing  */
    const handleSubmit = (e) => {
        e.preventDefault();

        setSaving(true);
        let serviceArr = []
        selectedOption.forEach(function (value, index, array) {
            serviceArr.push(value['value'])
        })
        postServices.personId=patientObj.id
        postServices.visitId=patientObj.visitId
        postServices.serviceCode=serviceArr
        axios.post(`${baseUrl}patient/post`, postServices,
            { headers: {"Authorization" : `Bearer ${token}`}},

        )
            .then(response => {
                setSaving(false);
                props.patientObj.commenced=true
                toast.success("Service Checkin successful");
                props.toggle()
                //props.patientsVitalsSigns()

            })
            .catch(error => {
                setSaving(false);
                toast.error("Something went wrong");

            });

    }

    return (
        <div >

            <Modal show={props.showModal} toggle={props.toggle} className="fade" size="lg">
                <Modal.Header toggle={props.toggle} style={{backgroundColor:"#eeeeee"}}>
                    Post Patient
                    <Button
                        variant=""
                        className="btn-close"
                        onClick={props.toggle}
                    ></Button>
                </Modal.Header>
                <Modal.Body>
                    <Card >
                        <CardBody>
                            <form >
                                <div className="row">

                                    <Select
                                        onChange={setSelectedOption}
                                        value={selectedOption}
                                        options={services}
                                        isMulti="true"
                                        noOptionsMessage="true"
                                    />

                                </div>

                                {saving ? <Spinner /> : ""}
                                <br />

                                <MatButton
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    className={classes.button}
                                    startIcon={<SaveIcon />}
                                    onClick={handleSubmit}
                                >
                                    {!saving ? (
                                        <span style={{ textTransform: "capitalize" }}>Save</span>
                                    ) : (
                                        <span style={{ textTransform: "capitalize" }}>Saving...</span>
                                    )}
                                </MatButton>

                            </form>
                        </CardBody>
                    </Card>
                </Modal.Body>

            </Modal>
        </div>
    );
}

export default PostPatient;

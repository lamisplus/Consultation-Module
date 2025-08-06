import React, { Fragment, useState, useCallback, useEffect } from "react";
import {
  KeyboardDateTimePicker,
  MuiPickersUtilsProvider,
} from "@material-ui/pickers";
import { useForm, Controller } from "react-hook-form";
import DateFnsUtils from "@date-io/date-fns";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import axios from "axios";
import { toast } from "react-toastify";
import { token, url as baseUrl, apiUrl } from "../../../api";
import { Grid, Segment, Label, Icon, Button, Input } from "semantic-ui-react";
import "tinymce/tinymce";
import "tinymce/icons/default";
import "tinymce/themes/silver";
import "tinymce/plugins/link";
import "tinymce/plugins/image";
import "tinymce/plugins/table";
import "tinymce/skins/ui/oxide/skin.min.css";
import "tinymce/skins/ui/oxide/content.min.css";
import "tinymce/models/dom/model";
import "tinymce/skins/content/default/content.min.css";
import { Editor } from "@tinymce/tinymce-react";
import Box from "@mui/material/Box";
import { Table } from "semantic-ui-react";
import { format } from "date-fns";
import { useHistory } from "react-router-dom";
import AddPharmacyOrder from "./AddPharmacyOrder";
import EditPharmacyOrder from "./EditPharmacyOrder";
import { makeStyles } from "@material-ui/core/styles";
import * as moment from "moment";
import _ from "lodash";
import VitalsCard from "../Consultation/VitalsCard";
import { icd10 } from "./icd-10";
import PostClient from "../Patient/PostClient";
import useSanitizeEditorInput from "../../../hooks/useSanitizeEditorInput";
import { DrugInfo } from "../Patient/DrugInfo";

const useStyles = makeStyles(theme => ({
  card: {
    margin: theme.spacing(20),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  form: {
    width: "100%",
    marginTop: theme.spacing(3),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
  cardBottom: {
    marginBottom: "1.3em",
  },
  button: {
    margin: theme.spacing(1),
  },
  root: {
    "& > *": {
      margin: theme.spacing(1),
    },
  },
  input: {
    borderRadius: 0,
    fontSize: "8em",
    color: "#000",
  },
  error: {
    color: "#f85032",
    fontSize: ".7em",
  },
  success: {
    color: "#4BB543",
    fontSize: ".7em",
  },
  inputGroupText: {
    backgroundColor: "#014d88",
    fontWeight: "bolder",
    color: "#fff",
    borderRadius: 0,
  },
  label: {
    fontSize: ".8em",
    color: "#014d88",
    fontWeight: "600",
  },
}));

const Widget = props => {
  const classes = useStyles();
  const patientObj = props.patientObj ? props.patientObj : {};
  const [patientObjs, setpatientObjs] = useState(patientObj);
  const history = useHistory();

  // Module enablement states
  const [isLabEnabled, setIsLabEnabled] = useState(false);
  const [isPharmacyEnabled, setIsPharmacyEnabled] = useState(false);

  // Modal states
  const [pharmacyModal, setPharmacyModal] = useState(false);
  const [pharmacyOrderModal, setPharmacyOrderModal] = useState(false);
  const [modalPost, setModalPost] = useState(false);

  // Form states
  const [encounterDate, setEncounterDate] = useState(new Date());
  const { handleSubmit, control } = useForm();
  const [body, setBody] = useState("");
  const [signature, setSignature] = useState({ name: "" });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // Dynamic form fields
  const [inputFields, setInputFields] = useState([
    { complaint: null, onsetDate: "", severity: 0, dateResolved: "" },
  ]);
  const [inputFieldsDiagnosis, setInputFieldsDiagnosis] = useState([
    { certainty: "", diagnosis: null, diagnosisOrder: 0 },
  ]);
  const [inputFieldsLab, setInputFieldsLab] = useState([
    {
      encounterDate: format(new Date(), "yyyy-MM-dd"),
      labOrder: "",
      labTest: "",
      priority: "",
      status: 0,
    },
  ]);

  // Data states
  const [pharmacyOrder, setPharmacyOrder] = useState([]);
  const [labGroups, setLabGroups] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [prevTests, setPrevTests] = useState([]);
  const [isAddmedication, setIsAddmedication] = useState(false);
  console.log("pharmacyOrder: ", pharmacyOrder);
  // Edit pharmacy order state
  const [editPharmacyOrderValue, setEditPharmacyOrderValue] = useState(null);

  // Toggle functions
  const toggle = () => {
    setPharmacyModal(!pharmacyModal);
  };

  const toggleOrder = () => setPharmacyOrderModal(!pharmacyOrderModal);
  const togglePost = () => setModalPost(!modalPost);

  // API calls
  const loadLabCheck = useCallback(async () => {
    try {
      const response = await axios.get(
        `${baseUrl}modules/check?moduleName=lab`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsLabEnabled(response.data);
    } catch (e) {
      toast.error("Error loading lab module", {
        position: toast.POSITION.TOP_CENTER,
      });
    }
  }, []);

  const loadPharmacyCheck = useCallback(async () => {
    try {
      const response = await axios.get(
        `${baseUrl}modules/check?moduleName=pharmacy`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsPharmacyEnabled(response.data);
    } catch (e) {
      toast.error("Error loading pharmacy module", {
        position: toast.POSITION.TOP_CENTER,
      });
    }
  }, []);

  const loadLabGroup = useCallback(async () => {
    try {
      const response = await axios.get(`${baseUrl}laboratory/labtestgroups`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLabGroups(response.data);
      const allTests = response.data.flatMap(group => group.labTests);
      setPrevTests(allTests);
    } catch (e) {
      toast.error("Error loading lab test groups", {
        position: toast.POSITION.TOP_CENTER,
      });
    }
  }, []);

  const loadPriorities = useCallback(async () => {
    try {
      const response = await axios.get(
        `${baseUrl}application-codesets/v2/TEST_ORDER_PRIORITY`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPriorities(response.data);
    } catch (e) {
      toast.error("Error loading priority data", {
        position: toast.POSITION.TOP_CENTER,
      });
    }
  }, []);

  const loadPharmacyOrders = useCallback(async () => {
    try {
      const response = await axios.get(
        `${apiUrl}drug-orders/visits/${patientObj.visitId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (typeof response.data === "string") {
        setPharmacyOrder([]);
      } else {
        setPharmacyOrder(response.data);
      }
    } catch (e) {
      toast.error("Error loading pharmacy orders", {
        position: toast.POSITION.TOP_CENTER,
      });
    }
  }, [patientObj.visitId]);

  const [drugsOrdered, setDrugsOrdered] = useState([]);

  const fetchPatientDrugOrder = async patientId => {
    try {
      const response = await axios.get(
        `${baseUrl}drug-orders/get-patient-drugOrder/${patientId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setDrugsOrdered(response.data);
    } catch (error) {
      console.error("Error fetching drug order:", error.message);
      throw error;
    }
  };

  useEffect(() => fetchPatientDrugOrder(patientObj?.id), []);

  // Form validation
  const validateInputs = () => {
    let temp = { ...errors };
    temp.body = body ? "" : "Visit note is required.";

    inputFields.forEach(x => {
      temp.onsetDate = x.onsetDate ? "" : "Onset Date is required.";
      temp.complaint = x.complaint ? "" : "Complaint is required.";
      temp.severity = x.severity ? "" : "Severity is required.";
    });

    inputFieldsDiagnosis.forEach(y => {
      temp.diagnosis = y.diagnosis ? "" : "Condition is required.";
      temp.diagnosisOrder = y.diagnosisOrder
        ? ""
        : "Diagnosis Order is required.";
      temp.certainty = y.certainty ? "" : "Diagnosis Certainty is required.";
    });

    setErrors({ ...temp });
    return Object.values(temp).every(x => x === "");
  };

  const [submittedConsultationId, setSubmittedConsultationId] = useState(0);
  const [submittedLabId, setSubmittedLabId] = useState(0);
  const [submittedLPharmId, setSubmittedPhrmId] = useState(0);
  // Form submission
  const onSubmit = async data => {
    if (!validateInputs()) {
      return;
    }
    try {
      const diagnosisList = inputFieldsDiagnosis
        .filter(field => field.diagnosis)
        .map(field => ({ ...field }));

      const presentingComplaints = inputFields
        .filter(field => field.complaint)
        .map(field => ({ ...field }));

      const consultationData = {
        diagnosisList,
        encounterDate: format(
          new Date(data.encounterDate.toString()),
          "yyyy-MM-dd"
        ),
        id: 0,
        patientId: patientObj.id,
        presentingComplaints,
        visitId: patientObj.visitId,
        visitNotes: body,
        signature: signature.name,
      };

      if (!submitted) {
        const responseConsultation = await axios.post(
          `${baseUrl}consultations`,
          consultationData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSubmittedConsultationId(responseConsultation.data.id);
      } else {
        //TO DO
        //Implement Update API call
        const responseConsultation = await axios.put(
          `${baseUrl}consultations/${submittedConsultationId}`,
          consultationData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSubmittedConsultationId(responseConsultation.data.id);
        toast.success("Consultation Updated", {
          position: toast.POSITION.TOP_RIGHT,
        });
      }

      // Handle lab tests if any
      const labTests = inputFieldsLab
        .filter(
          field =>
            field.encounterDate &&
            field.labOrder &&
            field.labTest &&
            field.priority
        )
        .map(field => {
          const labOrderParts = field.labOrder.split("-");
          const labTestGroupId = parseInt(labOrderParts[0], 10);
          const description =
            labOrderParts.length > 1
              ? labOrderParts.slice(1).join("-")
              : field.labOrder.slice(2);

          return {
            description: description,
            labTestGroupId: labTestGroupId,
            labTestId: parseInt(field.labTest, 10),
            orderPriority: parseInt(field.priority, 10),
            labTestOrderStatus: 0,
            clinicalNote: null,
            labNumber: null,
            viralLoadIndication: 0,
          };
        });

      if (labTests.length > 0) {
        const labOrderData = {
          patientId: patientObj.id,
          visitId: patientObj.visitId,
          orderDate: format(
            new Date(data.encounterDate.toString()),
            "yyyy-MM-dd HH:mm:ss"
          ),
          tests: labTests,
          orderedDate: null,
          labOrderIndication: null,
        };

        try {
          if (!submitted) {
            const responseLab = await axios.post(
              `${baseUrl}laboratory/orders`,
              labOrderData,
              {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 15000,
              }
            );
            setSubmittedLabId(responseLab.data.id);
          } else {
            //TO DO
            //Implement Update API call
            const responseLab = await axios.put(
              `${baseUrl}laboratory/orders/${submittedLabId}`,
              labOrderData,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            setSubmittedLabId(responseLab.data.id);
            toast.success("Lab form Updated", {
              position: toast.POSITION.TOP_RIGHT,
            });
          }

          toast.success("Successfully saved consultation and lab orders!", {
            position: toast.POSITION.TOP_CENTER,
          });
        } catch (labError) {
          toast.warning(
            "Consultation saved, but lab orders failed. Error: " +
              (labError.response?.data?.error || labError.message),
            { position: toast.POSITION.TOP_CENTER }
          );
        }
      } else {
        toast.success("Successfully saved consultation!", {
          position: toast.POSITION.TOP_CENTER,
        });
      }

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (consultationError) {
      console.error("Consultation error:", consultationError);
      toast.error(
        `Error saving consultation: ${
          consultationError.response?.data?.message || consultationError.message
        }`,
        { position: toast.POSITION.TOP_CENTER }
      );
    }
  };

  const OnError = errors => {
    console.error(errors);
    toast.error("Visit Note is required", {
      position: toast.POSITION.TOP_CENTER,
    });
  };

  // Form field handlers
  const handleInputChangeBasic = e => {
    setSignature({ name: e.target.value });
  };

  const handleAddFields = () => {
    setInputFields([
      ...inputFields,
      { complaint: "", onsetDate: "", severity: 0, dateResolved: "" },
    ]);
  };

  const removeHandleAddFields = e => {
    e.preventDefault();
    if (inputFields.length > 1) {
      setInputFields(inputFields.slice(0, -1));
    }
  };

  const handleAddDiagFields = () => {
    setInputFieldsDiagnosis([
      ...inputFieldsDiagnosis,
      { certainty: "", diagnosis: "", diagnosisOrder: 0 },
    ]);
  };

  const removeHandleAddDiagFields = e => {
    e.preventDefault();
    if (inputFieldsDiagnosis.length > 1) {
      setInputFieldsDiagnosis(inputFieldsDiagnosis.slice(0, -1));
    }
  };

  const handleAddFieldsLab = () => {
    setInputFieldsLab([
      ...inputFieldsLab,
      {
        encounterDate: format(new Date(), "yyyy-MM-dd"),
        labOrder: "",
        labTest: "",
        priority: "",
        status: "",
      },
    ]);
  };

  const removeHandleAddFieldsLab = (e, labIndex) => {
    e.preventDefault();
    if (inputFieldsLab.length > 1) {
      const inputFieldsLabCopy = [...inputFieldsLab];
      inputFieldsLabCopy.splice(labIndex, 1);
      setInputFieldsLab(inputFieldsLabCopy);
    }
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
    const selectedGroup = labGroups.find(x => x.id == id);
    if (selectedGroup) {
      setLabTests(selectedGroup.labTests);
    }
  };

  const handleInputLabChange = (index, event) => {
    const values = [...inputFieldsLab];
    if (event.target.name === "labOrder") {
      const str = event.target.value;
      values[index].labOrder = str;
      labCascade(str.slice(0, 1));
    } else if (event.target.name === "labTest") {
      values[index].labTest = event.target.value;
    } else if (event.target.name === "priority") {
      values[index].priority = event.target.value;
    } else if (event.target.name === "status") {
      values[index].status = event.target.value;
    }
    setInputFieldsLab(values);
  };

  const handleAddPharmacyOrder = e => {
    e.preventDefault();
    setIsAddmedication(true);
    setPharmacyModal(!pharmacyModal);
  };

  const handleEditPharmacyOrder = pharmacy => {
    setIsAddmedication(false);
    setEditPharmacyOrderValue(pharmacy);
    setPharmacyModal(!pharmacyModal);
  };

  const handleDelete = async id => {
    try {
      await axios.delete(`${apiUrl}drug-orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Successfully deleted drug order!", {
        position: toast.POSITION.TOP_CENTER,
      });
      // Reload pharmacy orders after deletion
      loadPharmacyOrders();
    } catch (error) {
      toast.error("Error deleting drug order", {
        position: toast.POSITION.TOP_CENTER,
      });
    }
  };

  const PostPatientService = row => {
    setpatientObjs({ ...patientObj, ...row });
    setModalPost(!modalPost);
  };

  // Load data on component mount
  useEffect(() => {
    if (patientObj.id && patientObj.visitId) {
      loadPharmacyCheck();
      loadLabCheck();
      loadLabGroup();
      loadPriorities();
      loadPharmacyOrders();
    }
  }, [
    patientObj.id,
    patientObj.visitId,
    loadPharmacyCheck,
    loadLabCheck,
    loadLabGroup,
    loadPriorities,
    loadPharmacyOrders,
  ]);

  const sanitizedEditorText = useSanitizeEditorInput(body);
  useEffect(() => setBody(sanitizedEditorText), [sanitizedEditorText]);

  return (
    <Grid
      stackable
      columns="equal"
      style={{ minHeight: "100vh", paddingTop: "1em" }}
    >
      <Grid.Column width={5}>
        <VitalsCard props={props} />
      </Grid.Column>
      <Grid.Column style={{ paddingLeft: "2%" }} width={11}>
        <form onSubmit={handleSubmit(onSubmit, OnError)}>
          <Label
            as="a"
            color="black"
            style={{ width: "100%", fontSize: "1em" }}
          >
            <b>Physical Examination</b>
          </Label>

          <Segment>
            <div className="input-group input-group-sm mb-3">
              <span
                className="input-group-text"
                style={{
                  backgroundColor: "#014d88",
                  color: "#fff",
                  fontSize: ".8em",
                }}
              >
                Encounter Date
              </span>
              <MuiPickersUtilsProvider utils={DateFnsUtils}>
                <Controller
                  name="encounterDate"
                  control={control}
                  defaultValue={encounterDate}
                  rules={{ required: true }}
                  render={({ field: { ref, ...rest } }) => (
                    <KeyboardDateTimePicker
                      style={{ height: "40px", border: "1px solid #014d88" }}
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

            <div className="input-group input-group-sm">
              <Label
                as="a"
                style={{
                  backgroundColor: "#014d88",
                  color: "#fff",
                  width: "100%",
                  fontSize: "1em",
                }}
              >
                {"Patient's visit note"}
              </Label>
              {errors.body && (
                <span className={classes.error}>{errors.body}</span>
              )}
              <Editor
                textareaName="visitNote"
                initialValue=""
                init={{
                  width: "100%",
                  height: 300,
                  menubar: false,
                  plugins: [],
                  toolbar:
                    "undo redo | formatselect | " +
                    "bold italic backcolor | alignleft aligncenter " +
                    "alignright alignjustify | bullist numlist outdent indent | " +
                    "removeformat | help",
                  content_style:
                    "body { font-family:Helvetica,Arial,sans-serif; font-size: 1em }",
                }}
                onEditorChange={newText => setBody(newText)}
              />
            </div>
            <br />

            {/* Presenting Complaints Section */}
            <Label
              as="a"
              style={{
                backgroundColor: "#014d88",
                color: "#fff",
                width: "100%",
                fontSize: "1em",
              }}
            >
              Presenting Complaints
            </Label>

            <Table style={{ color: "#014d88", borderColor: "#014d88" }} celled>
              <Table.Header>
                <Table.Row>
                  <Table.Cell style={{ fontWeight: "bold" }}>
                    Complaints
                  </Table.Cell>
                  <Table.Cell style={{ fontWeight: "bold" }}>
                    Onset Date
                  </Table.Cell>
                  <Table.Cell style={{ fontWeight: "bold" }}>
                    Severity
                  </Table.Cell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {inputFields.map((inputField, index) => (
                  <Fragment key={`${inputField}~${index}`}>
                    <Table.Row>
                      <Table.Cell>
                        <Autocomplete
                          id="complaint"
                          getOptionLabel={icd10 =>
                            `${icd10.code} ${icd10.desc}`
                          }
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
                          renderInput={params => (
                            <TextField {...params} label="Select complaints" />
                          )}
                          value={inputFields.complaint}
                          onChange={(event, newValue) =>
                            handleInputChange(
                              index,
                              `${newValue.code} ${newValue.desc}`
                            )
                          }
                        />
                        {errors.complaint && (
                          <span className={classes.error}>
                            {errors.complaint}
                          </span>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <Input
                          className={classes.input}
                          id="onsetDate"
                          name="onsetDate"
                          type="date"
                          max={moment(encounterDate).format("YYYY-MM-DD")}
                          min={moment(patientObj.dateOfBirth).format(
                            "YYYY-MM-DD"
                          )}
                          fluid
                          placeholder="Onset Date"
                          value={inputField.onsetDate}
                          onChange={event => handleInputChange(index, event)}
                        />
                        {errors.onsetDate && (
                          <span className={classes.error}>
                            {errors.onsetDate}
                          </span>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <select
                          style={{
                            borderRadius: 0,
                            fontSize: ".8em",
                            color: "#000",
                          }}
                          className="ui fluid selection dropdown"
                          value={inputField.severity}
                          onChange={event => handleInputChange(index, event)}
                          name="severity"
                          id="severity"
                        >
                          <option>Select</option>
                          {[...Array(11)].map((_, i) => (
                            <option key={i} value={i}>
                              {i}
                            </option>
                          ))}
                        </select>
                        {errors.severity && (
                          <span className={classes.error}>
                            {errors.severity}
                          </span>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  </Fragment>
                ))}
              </Table.Body>

              <Table.Footer>
                <Table.Row>
                  <Table.HeaderCell>
                    <Button
                      color="blue"
                      size="tiny"
                      type="button"
                      onClick={handleAddFields}
                    >
                      <Icon name="plus" /> Add More
                    </Button>{" "}
                    <Button
                      color="red"
                      size="tiny"
                      type="button"
                      onClick={removeHandleAddFields}
                      disabled={inputFields.length === 1}
                    >
                      <Icon name="minus" /> Remove
                    </Button>
                  </Table.HeaderCell>
                </Table.Row>
              </Table.Footer>
            </Table>
            <br />

            {/* Clinical Diagnosis Section */}
            <Label
              as="a"
              style={{
                backgroundColor: "#992E62",
                color: "#fff",
                width: "100%",
                fontSize: "1em",
              }}
            >
              Clinical Diagnosis
            </Label>

            <Table style={{ color: "#992E62", borderColor: "#992E62" }} celled>
              <Table.Header>
                <Table.Row>
                  <Table.Cell style={{ fontWeight: "bold" }}>
                    Condition
                  </Table.Cell>
                  <Table.Cell style={{ fontWeight: "bold" }}>Order</Table.Cell>
                  <Table.Cell style={{ fontWeight: "bold" }}>
                    Certainty
                  </Table.Cell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {inputFieldsDiagnosis.map((diagInputField, diagIndex) => (
                  <Fragment key={`${diagInputField}~${diagIndex}`}>
                    <Table.Row>
                      <Table.Cell>
                        <Autocomplete
                          id="diagnosis"
                          getOptionLabel={icd10 =>
                            `${icd10.code} ${icd10.desc}`
                          }
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
                          renderInput={params => (
                            <TextField {...params} label="Select conditions" />
                          )}
                          value={inputFieldsDiagnosis.diagnosis}
                          onChange={(event, newValue) =>
                            handleInputDiagChange(
                              diagIndex,
                              `${newValue.code} ${newValue.desc}`
                            )
                          }
                        />
                        {errors.diagnosis && (
                          <span className={classes.error}>
                            {errors.diagnosis}
                          </span>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <select
                          style={{
                            borderRadius: 0,
                            fontSize: ".8em",
                            color: "#000",
                          }}
                          className="ui fluid selection dropdown"
                          value={diagInputField.diagnosisOrder}
                          onChange={event =>
                            handleInputDiagChange(diagIndex, event)
                          }
                          name="diagnosisOrder"
                          id="diagnosisOrder"
                        >
                          <option>Select</option>
                          <option value="1">Primary</option>
                          <option value="2">Secondary</option>
                        </select>
                        {errors.diagnosisOrder && (
                          <span className={classes.error}>
                            {errors.diagnosisOrder}
                          </span>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <select
                          style={{
                            borderRadius: 0,
                            fontSize: ".8em",
                            color: "#000",
                          }}
                          className="ui fluid selection dropdown"
                          value={diagInputField.certainty}
                          onChange={event =>
                            handleInputDiagChange(diagIndex, event)
                          }
                          name="certainty"
                          id="certainty"
                        >
                          <option>Select</option>
                          <option value="1">Presumed</option>
                          <option value="2">Confirmed</option>
                        </select>
                        {errors.certainty && (
                          <span className={classes.error}>
                            {errors.certainty}
                          </span>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  </Fragment>
                ))}
              </Table.Body>

              <Table.Footer>
                <Table.Row>
                  <Table.HeaderCell>
                    <Button
                      style={{ backgroundColor: "#992E62", color: "#fff" }}
                      size="tiny"
                      type="button"
                      onClick={handleAddDiagFields}
                    >
                      <Icon name="plus" /> Add More
                    </Button>{" "}
                    <Button
                      color="red"
                      size="tiny"
                      type="button"
                      onClick={removeHandleAddDiagFields}
                      disabled={inputFieldsDiagnosis.length === 1}
                    >
                      <Icon name="minus" /> Remove
                    </Button>
                  </Table.HeaderCell>
                </Table.Row>
              </Table.Footer>
            </Table>
            <br />

            {/* Laboratory Test Orders Section */}
            {isLabEnabled && (
              <div>
                <Label
                  as="a"
                  color="teal"
                  style={{ width: "100%", fontSize: "1em" }}
                >
                  Laboratory Test Orders
                </Label>

                <Table color="teal" celled>
                  <Table.Header>
                    <Table.Row>
                      <Table.Cell style={{ fontWeight: "bold" }}>
                        Lab Test Group
                      </Table.Cell>
                      <Table.Cell style={{ fontWeight: "bold" }}>
                        Lab Test
                      </Table.Cell>
                      <Table.Cell style={{ fontWeight: "bold" }}>
                        Priority
                      </Table.Cell>
                    </Table.Row>
                  </Table.Header>

                  <Table.Body>
                    {inputFieldsLab.map((labInputField, labIndex) => (
                      <Fragment key={`${labInputField}~${labIndex}`}>
                        <Table.Row>
                          <Table.Cell>
                            <select
                              style={{
                                borderRadius: 0,
                                fontSize: ".8em",
                                color: "#000",
                              }}
                              className="ui fluid selection dropdown"
                              value={labInputField.labOrder}
                              onChange={e => handleInputLabChange(labIndex, e)}
                              name="labOrder"
                              id="labOrder"
                            >
                              <option>Select</option>
                              {labGroups
                                .filter(e => e.groupName !== "Others")
                                .map(d => (
                                  <option
                                    key={d.id}
                                    value={`${d.id}-${d.groupName}`}
                                  >
                                    {d.groupName}
                                  </option>
                                ))}
                            </select>
                          </Table.Cell>
                          <Table.Cell>
                            <select
                              style={{
                                borderRadius: 0,
                                fontSize: ".8em",
                                color: "#000",
                              }}
                              className="ui fluid selection dropdown"
                              value={labInputField.labTest}
                              onChange={e => handleInputLabChange(labIndex, e)}
                              name="labTest"
                              id="labTest"
                            >
                              <option>Select</option>
                              {labInputField.labTest === ""
                                ? labTests.map(d => (
                                    <option key={d.id} value={d.id}>
                                      {d.labTestName}
                                    </option>
                                  ))
                                : prevTests.map(d => (
                                    <option key={d.id} value={d.id}>
                                      {d.labTestName}
                                    </option>
                                  ))}
                            </select>
                          </Table.Cell>
                          <Table.Cell>
                            <select
                              style={{
                                borderRadius: 0,
                                fontSize: ".8em",
                                color: "#000",
                              }}
                              className="ui fluid selection dropdown"
                              value={labInputField.priority}
                              onChange={e => handleInputLabChange(labIndex, e)}
                              name="priority"
                              id="priority"
                            >
                              <option>Select</option>
                              {priorities.map(d => (
                                <option key={d.id} value={d.id}>
                                  {d.display}
                                </option>
                              ))}
                            </select>
                          </Table.Cell>
                          <Table.Cell>
                            <Button
                              color="red"
                              size="tiny"
                              type="button"
                              onClick={e =>
                                removeHandleAddFieldsLab(e, labIndex)
                              }
                              disabled={inputFieldsLab.length === 1}
                            >
                              <Icon name="minus" /> Remove
                            </Button>
                          </Table.Cell>
                        </Table.Row>
                      </Fragment>
                    ))}
                  </Table.Body>

                  <Table.Footer>
                    <Table.Row>
                      <Table.HeaderCell>
                        <Button
                          color="teal"
                          size="tiny"
                          type="button"
                          onClick={handleAddFieldsLab}
                        >
                          <Icon name="plus" /> Add Test
                        </Button>{" "}
                      </Table.HeaderCell>
                    </Table.Row>
                  </Table.Footer>
                </Table>
              </div>
            )}
            <br />

            {/* Pharmacy Order Section */}
            <Label
              as="a"
              color="purple"
              style={{ width: "100%", fontSize: "1em" }}
            >
              Pharmacy Orders
            </Label>
            <br />
            <br />

            {pharmacyOrder?.length > 0 ? (
              pharmacyOrder?.map((pharmacy, i) => (
                <DrugInfo
                  pharmacy={pharmacy}
                  handleEditPharmacyOrder={handleEditPharmacyOrder}
                  handleDelete={handleDelete}
                />
              ))
            ) : (
              <p>No pharmacy orders for this patient</p>
            )}

            <br />
            {isPharmacyEnabled && (
              <div className="mb-3">
                <Button
                  variant="contained"
                  color="purple"
                  onClick={handleAddPharmacyOrder}
                  style={{ textTransform: "capitalize" }}
                >
                  Add Medication Prescription
                </Button>
              </div>
            )}

            {/* Documentation Section */}
            <Label
              as="a"
              color="blue"
              style={{ width: "100%", fontSize: "1em" }}
            >
              Documentation
            </Label>

            <div className="form-group mb-3 col-md-4">
              <br />
              <Table.Cell style={{ fontWeight: "bold" }}>
                Doctor's signature
              </Table.Cell>
              <input
                className="form-control"
                type="text"
                name="signature"
                value={signature.name}
                id="signature"
                onChange={handleInputChangeBasic}
                style={{
                  border: "1px solid #014D88",
                  borderRadius: "0.2rem",
                }}
              />
            </div>
          </Segment>

          {!submitted && (
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submitted}
            >
              Submit Consultation
            </Button>
          )}
          {submitted && (
            <Button
              type="submit"
              variant="contained"
              color="green"
              // disabled={submitted}
            >
              Update Submission
            </Button>
          )}
        </form>
      </Grid.Column>

      {/* Modals */}
      <AddPharmacyOrder
        encounterDate={encounterDate}
        toggle={toggle}
        patientObj={patientObj}
        showModal={pharmacyModal}
        setPharmacyOrder={setPharmacyOrder}
        editPharmacyOrderValue={editPharmacyOrderValue}
        isAddmedication={isAddmedication}
        setIsAddmedication={setIsAddmedication}
      />
      {/* <EditPharmacyOrder
        toggle={toggleOrder}
        patientObj={patientObj}
        showModal={pharmacyOrderModal}
        editPharmacyOrderValue={editPharmacyOrderValue}
      /> */}
      <PostClient
        toggle={togglePost}
        showModal={modalPost}
        patientObj={patientObj}
      />
    </Grid>
  );
};

export default Widget;

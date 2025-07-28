import React, { Fragment, useState, useCallback, useEffect } from "react";
import {
  Form,
  Row,
  Card,
  CardBody,
  FormGroup,
  Label,
  Input,
  InputGroup,
  InputGroupText,
} from "reactstrap";
import MatButton from "@material-ui/core/Button";
import { makeStyles } from "@material-ui/core/styles";
import SaveIcon from "@material-ui/icons/Save";
import CancelIcon from "@material-ui/icons/Cancel";
import axios from "axios";
import { toast } from "react-toastify";
import { token, url as baseUrl, apiUrl as apiUrl } from "../../../api";
import { useHistory } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import { format } from "date-fns";

import "react-summernote/dist/react-summernote.css"; // import styles
import { Spinner } from "reactstrap";
import useMedicationValidation from "../../../hooks/useMedicationValidation";
import usePharmacyOrderStyles from "../../../hooks/usePharmacyOrderStyles";

const AddPharmacyOrder = props => {
  const patientObj = props.patientObj;
  const [saving, setSaving] = useState(false);
  const classes = usePharmacyOrderStyles();
  const [drugs, setDrugs] = useState([]);
  const [dosageUnits, setDosageUnits] = useState([]);
  const [durationUnits, setDurationUnits] = useState([]);
  const [pharmacyOrder, setPharmacyOrder] = useState({
    encounterDate: format(new Date(props.encounterDate), "yyyy-MM-dd"),
    medicationName: "",
    formulation: "",
    routeOfAdmin: "",
    timingInstructions: "",
    quantityPrescribed: "",
    strength: "",
    strengthUnit: "",
    frequency: "",
    startDate: "",
    duration: "",
    durationUnit: "",
    notes: "",
    patientId: patientObj.id,
    drugBrandName: "",
    visitId: patientObj.visitId,
  });
  const [errors, setErrors] = useState({});
  const { initializeErrors, validate } = useMedicationValidation(
    pharmacyOrder,
    errors,
    setErrors
  );

  const handleInputChangePharmacyOrderDto = e => {
    setErrors(prev => ({ ...prev, [e.target.name]: "" }));
    setPharmacyOrder({ ...pharmacyOrder, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    if (validate(pharmacyOrder)) {
      try {
        e.preventDefault();
        setSaving(true);

        pharmacyOrder.encounterDate = format(
          new Date(props.encounterDate),
          "yyyy-MM-dd'T'HH:mm:ss"
        );

        pharmacyOrder.startDate = format(
          new Date(pharmacyOrder.startDate),
          "yyyy-MM-dd'T'HH:mm:ss"
        );

        await axios
          .post(`${baseUrl}drug-orders/order`, pharmacyOrder, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then(resp => {
            console.log("drug saved");
            toast.success("Successfully Saved drug order!", {
              position: toast.POSITION.TOP_RIGHT,
            });
          });
        setSaving(false);
        props.toggle();
      } catch (e) {
        toast.error("An error occurred while saving drug prescription", {
          position: toast.POSITION.TOP_RIGHT,
        });
      }
    }
  };

  const loadDosageUnits = useCallback(async () => {
    try {
      const response = await axios.get(
        `${baseUrl}application-codesets/v2/DOSE_STRENGTH_UNIT`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDosageUnits(response.data);
    } catch (e) {
      toast.error("An error occurred while fetching DOSE STRENGTH UNIT", {
        position: toast.POSITION.TOP_RIGHT,
      });
    }
  }, []);

  const loadDurationUnits = useCallback(async () => {
    try {
      const response = await axios.get(
        `${baseUrl}application-codesets/v2/AGE_UNIT`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDurationUnits(response.data);
    } catch (e) {
      toast.error("An error occurred while fetching DOSE STRENGTH UNIT", {
        position: toast.POSITION.TOP_RIGHT,
      });
    }
  }, []);

  const loadPharmacyDrugs = useCallback(async () => {
    try {
      const response = await axios.get(`${baseUrl}drugs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data[0].id > 0) {
        setDrugs(response.data);
      }
    } catch (e) {
      toast.error("An error occurred while fetching drugs", {
        position: toast.POSITION.TOP_RIGHT,
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
    drugRows = drugs.map((drug, index) => (
      <option key={drug.name} value={drug.name}>
        {drug.name}
      </option>
    ));
  }

  if (dosageUnits && dosageUnits.length > 0) {
    dosageUnitsRows = dosageUnits.map((dosageUnit, index) => (
      <option key={dosageUnit.display} value={dosageUnit.display}>
        {dosageUnit.display}
      </option>
    ));
  }
  if (durationUnits && durationUnits.length > 0) {
    durationUnitsRows = durationUnits.map((durationUnit, index) => (
      <option key={durationUnit.display} value={durationUnit.display}>
        {durationUnit.display}
      </option>
    ));
  }
  console.log("useMedicationValidation: ", { errors, validate });

  return (
    <div>
      <Modal
        show={props.showModal}
        toggle={props.toggle}
        className="fade"
        size="lg"
      >
        <Modal.Header
          toggle={props.toggle}
          style={{ backgroundColor: "#eeeeee" }}
        >
          Medication Prescription
          <Button
            variant=""
            className="btn-close"
            onClick={props.toggle}
          ></Button>
        </Modal.Header>
        <Modal.Body>
          <Card>
            <CardBody>
              <form>
                <div className="row">
                  <div className="form-group  mb-3">
                    <FormGroup>
                      <Label className={classes.label}>Encounter Date</Label>
                      <InputGroup>
                        <Input
                          type="date"
                          name="encounterDate"
                          id="encounterDate"
                          className={classes.input}
                          onFocus={initializeErrors}
                          onChange={handleInputChangePharmacyOrderDto}
                          value={pharmacyOrder.encounterDate}
                          disabled
                        />
                      </InputGroup>
                    </FormGroup>
                    <div>
                      {errors.encounterDate !== "" ? (
                        <span className={classes.error}>
                          {errors.encounterDate}
                        </span>
                      ) : (
                        ""
                      )}
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="form-group mb-3 col-md-4">
                    <FormGroup>
                      <Label className={classes.label}>Medication Name</Label>
                      <InputGroup>
                        <Input
                          className={classes.input}
                          type="select"
                          name="medicationName"
                          id="medicationName"
                          onFocus={initializeErrors}
                          onChange={handleInputChangePharmacyOrderDto}
                          value={pharmacyOrder.medicationName}
                        >
                          <option value={""}></option>
                          {drugRows}
                        </Input>
                        <span
                          style={{
                            position: "absolute",
                            top: "1.3em",
                            right: "6%",
                            zIndex: 100,
                            transform: "scale(2)",
                          }}
                        >
                          {" "}
                          &#129171;
                        </span>
                      </InputGroup>
                    </FormGroup>
                    <div>
                      {errors.medicationName !== "" ? (
                        <span className={classes.error}>
                          {errors.medicationName}
                        </span>
                      ) : (
                        ""
                      )}
                    </div>
                  </div>
                  <div className="form-group mb-3 col-md-4">
                    <FormGroup>
                      <Label className={classes.label}>Formulation</Label>
                      <InputGroup>
                        <Input
                          className={classes.input}
                          type="text"
                          name="formulation"
                          id="formulation"
                          onFocus={initializeErrors}
                          onChange={handleInputChangePharmacyOrderDto}
                          value={pharmacyOrder.formulation}
                        />
                      </InputGroup>
                    </FormGroup>
                    <div>
                      {errors.formulation !== "" ? (
                        <span className={classes.error}>
                          {errors.formulation}
                        </span>
                      ) : (
                        ""
                      )}
                    </div>
                  </div>
                  <div className="form-group mb-3 col-md-4">
                    <FormGroup>
                      <Label className={classes.label}>Route of Admin</Label>
                      <InputGroup>
                        <Input
                          className={classes.input}
                          type="text"
                          name="routeOfAdmin"
                          id="routeOfAdmin"
                          onFocus={initializeErrors}
                          onChange={handleInputChangePharmacyOrderDto}
                          value={pharmacyOrder.routeOfAdmin}
                        />
                      </InputGroup>
                    </FormGroup>

                    <div>
                      {errors.routeOfAdmin !== "" ? (
                        <span className={classes.error}>
                          {errors.routeOfAdmin}
                        </span>
                      ) : (
                        ""
                      )}
                    </div>
                  </div>
                  <div className="form-group mb-3 col-md-4">
                    <FormGroup>
                      <Label className={classes.label}>Medication Time</Label>
                      <InputGroup>
                        <Input
                          className={classes.input}
                          type="text"
                          name="timingInstructions"
                          id="timingInstructions"
                          onFocus={initializeErrors}
                          onChange={handleInputChangePharmacyOrderDto}
                          value={pharmacyOrder.timingInstructions}
                        />
                      </InputGroup>
                    </FormGroup>

                    <div>
                      {errors.timingInstructions !== "" ? (
                        <span className={classes.error}>
                          {errors.timingInstructions}
                        </span>
                      ) : (
                        ""
                      )}
                    </div>
                  </div>
                  <div className="form-group mb-3 col-md-4">
                    <FormGroup>
                      <Label className={classes.label}>
                        Quantity Prescribed
                      </Label>
                      <InputGroup>
                        <Input
                          className={classes.input}
                          type="text"
                          name="quantityPrescribed"
                          id="quantityPrescribed"
                          onFocus={initializeErrors}
                          onChange={handleInputChangePharmacyOrderDto}
                          value={pharmacyOrder.quantityPrescribed}
                        />
                      </InputGroup>

                      <div>
                        {errors.quantityPrescribed !== "" ? (
                          <span className={classes.error}>
                            {errors.quantityPrescribed}
                          </span>
                        ) : (
                          ""
                        )}
                      </div>
                    </FormGroup>
                  </div>
                  <div className="form-group mb-3 col-md-4">
                    <FormGroup>
                      <Label className={classes.label}>Strength</Label>
                      <InputGroup>
                        <Input
                          className={classes.input}
                          type="text"
                          name="strength"
                          id="strength"
                          onFocus={initializeErrors}
                          onChange={handleInputChangePharmacyOrderDto}
                          value={pharmacyOrder.strength}
                        />
                      </InputGroup>
                    </FormGroup>

                    <div>
                      {errors.strength !== "" ? (
                        <span className={classes.error}>{errors.strength}</span>
                      ) : (
                        ""
                      )}
                    </div>
                  </div>
                  <div className="form-group mb-3 col-md-4">
                    <FormGroup>
                      <Label className={classes.label}>Dosage Amount</Label>
                      <InputGroup>
                        <Input
                          className={classes.input}
                          type="select"
                          name="strengthUnit"
                          id="strengthUnit"
                          onFocus={initializeErrors}
                          onChange={handleInputChangePharmacyOrderDto}
                          value={pharmacyOrder.strengthUnit}
                        >
                          <option value={""}></option>
                          {dosageUnitsRows}
                        </Input>
                        <span
                          style={{
                            position: "absolute",
                            top: "1.3em",
                            right: "6%",
                            zIndex: 100,
                            transform: "scale(2)",
                          }}
                        >
                          {" "}
                          &#129171;
                        </span>
                      </InputGroup>
                    </FormGroup>

                    <div>
                      {errors.strengthUnit !== "" ? (
                        <span className={classes.error}>
                          {errors.strengthUnit}
                        </span>
                      ) : (
                        ""
                      )}
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="form-group mb-3">
                    <FormGroup>
                      <Label className={classes.label}>Drug Brand Name</Label>
                      <InputGroup>
                        <Input
                          className={classes.input}
                          type="text"
                          name="drugBrandName"
                          id="drugBrandName"
                          onFocus={initializeErrors}
                          onChange={handleInputChangePharmacyOrderDto}
                          value={pharmacyOrder.drugBrandName}
                        />
                      </InputGroup>
                    </FormGroup>

                    <div>
                      {errors.drugBrandName !== "" ? (
                        <span className={classes.error}>
                          {errors.drugBrandName}
                        </span>
                      ) : (
                        ""
                      )}
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="form-group mb-3 col-md-6">
                    <FormGroup>
                      <Label className={classes.label}>Dose Frequency</Label>
                      <InputGroup>
                        <Input
                          className={classes.input}
                          type="number"
                          name="frequency"
                          id="frequency"
                          onFocus={initializeErrors}
                          onChange={handleInputChangePharmacyOrderDto}
                          value={pharmacyOrder.frequency}
                        />
                      </InputGroup>
                    </FormGroup>

                    <div>
                      {errors.frequency !== "" ? (
                        <span className={classes.error}>
                          {errors.frequency}
                        </span>
                      ) : (
                        ""
                      )}
                    </div>
                  </div>
                  <div className="form-group mb-3 col-md-6">
                    <FormGroup>
                      <Label className={classes.label}>Start Date</Label>
                      <InputGroup>
                        <Input
                          className={classes.input}
                          type="date"
                          name="startDate"
                          id="startDate"
                          onFocus={initializeErrors}
                          onChange={handleInputChangePharmacyOrderDto}
                          value={pharmacyOrder.startDate}
                        />
                      </InputGroup>
                    </FormGroup>

                    <div>
                      {errors.startDate !== "" ? (
                        <span className={classes.error}>
                          {errors.startDate}
                        </span>
                      ) : (
                        ""
                      )}
                    </div>
                  </div>
                  <div className="form-group mb-3 col-md-6">
                    <FormGroup>
                      <Label className={classes.label}>Duration</Label>
                      <InputGroup>
                        <Input
                          className={classes.input}
                          type="number"
                          name="duration"
                          id="duration"
                          onFocus={initializeErrors}
                          onChange={handleInputChangePharmacyOrderDto}
                          value={pharmacyOrder.duration}
                        />
                      </InputGroup>
                    </FormGroup>

                    <div>
                      {errors.duration !== "" ? (
                        <span className={classes.error}>{errors.duration}</span>
                      ) : (
                        ""
                      )}
                    </div>
                  </div>

                  <div className="form-group mb-3 col-md-6">
                    <FormGroup>
                      <Label className={classes.label}>Duration Unit</Label>
                      <InputGroup>
                        <Input
                          className={classes.input}
                          type="select"
                          name="durationUnit"
                          id="durationUnit"
                          onFocus={initializeErrors}
                          onChange={handleInputChangePharmacyOrderDto}
                          value={pharmacyOrder.durationUnit}
                        >
                          <option value={""}></option>
                          {durationUnitsRows}
                        </Input>
                        <span
                          style={{
                            position: "absolute",
                            top: "1.3em",
                            right: "6%",
                            zIndex: 100,
                            transform: "scale(2)",
                          }}
                        >
                          {" "}
                          &#129171;
                        </span>
                      </InputGroup>
                    </FormGroup>

                    <div>
                      {errors.durationUnit !== "" ? (
                        <span className={classes.error}>
                          {errors.durationUnit}
                        </span>
                      ) : (
                        ""
                      )}
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="form-group mb-3">
                    <FormGroup>
                      <Label className={classes.label}>Notes</Label>
                      <InputGroup>
                        <Input
                          className={classes.input}
                          type="textarea"
                          name="notes"
                          id="notes"
                          onFocus={initializeErrors}
                          onChange={handleInputChangePharmacyOrderDto}
                          value={pharmacyOrder.notes}
                          style={{
                            minHeight: 100,
                            border: "1px solid #014d88",
                            fontSize: "16px",
                          }}
                        />
                      </InputGroup>
                    </FormGroup>

                    <div>
                      {errors.notes !== "" ? (
                        <span className={classes.error}>{errors.notes}</span>
                      ) : (
                        ""
                      )}
                    </div>
                  </div>
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
                    <span style={{ textTransform: "capitalize" }}>
                      Saving...
                    </span>
                  )}
                </MatButton>

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

export default AddPharmacyOrder;

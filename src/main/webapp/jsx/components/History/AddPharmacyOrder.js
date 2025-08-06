import React, { useState, useCallback, useEffect } from "react";
import {
  Card,
  CardBody,
  FormGroup,
  Label,
  Input,
  InputGroup,
} from "reactstrap";
import MatButton from "@material-ui/core/Button";
import SaveIcon from "@material-ui/icons/Save";
import CancelIcon from "@material-ui/icons/Cancel";
import axios from "axios";
import { toast } from "react-toastify";
import { token, url as baseUrl } from "../../../api";
import { Modal, Button } from "react-bootstrap";
import { format, parseISO } from "date-fns";
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
  const [errors, setErrors] = useState({});

  // Define initial state as a function to avoid duplication
  const getInitialPharmacyOrder = () => ({
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

  const [pharmacyOrder, setPharmacyOrder] = useState(getInitialPharmacyOrder());

  const { initializeErrors, validate } = useMedicationValidation(
    pharmacyOrder,
    errors,
    setErrors
  );

  // Reset form when modal is opened in "add" mode
  useEffect(() => {
    if (props.showModal && props.isAddmedication) {
      setPharmacyOrder(getInitialPharmacyOrder());
      setErrors({});
    }
  }, [props.showModal, props.isAddmedication, props.encounterDate]);

  // Populate form when editing
  useEffect(() => {
    if (
      props.showModal &&
      !props.isAddmedication &&
      props.editPharmacyOrderValue
    ) {
      const order = props.editPharmacyOrderValue;
      const encounterDate = order?.encounterDate
        ? format(parseISO(order.encounterDate), "yyyy-MM-dd")
        : format(new Date(props.encounterDate), "yyyy-MM-dd");
      const startDate = order?.startDate
        ? format(parseISO(order.startDate), "yyyy-MM-dd")
        : "";
      setPharmacyOrder({
        ...order,
        encounterDate,
        startDate,
      });
      setErrors({});
    }
  }, [
    props.showModal,
    props.isAddmedication,
    props.editPharmacyOrderValue,
    props.encounterDate,
  ]);

  const handleInputChangePharmacyOrderDto = e => {
    setErrors(prev => ({ ...prev, [e.target.name]: "" }));
    setPharmacyOrder({ ...pharmacyOrder, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (validate(pharmacyOrder)) {
      try {
        setSaving(true);
        const cleanEncounterDate = pharmacyOrder.encounterDate.split("T")[0];
        const cleanStartDate = pharmacyOrder.startDate
          ? pharmacyOrder.startDate.split("T")[0]
          : "";

        const payload = {
          ...pharmacyOrder,
          encounterDate: `${cleanEncounterDate}T00:00:00`,
          startDate: cleanStartDate ? `${cleanStartDate}T00:00:00` : null,
        };

        if (pharmacyOrder.id) {
          await axios.put(
            `${baseUrl}drug-orders/update/${pharmacyOrder.id}`,
            payload,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          toast.success("Successfully updated drug order!", {
            position: toast.POSITION.TOP_RIGHT,
          });
        } else {
          const response = await axios.post(
            `${baseUrl}drug-orders/order`,
            payload,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          props.setPharmacyOrder(prev => [...prev, response.data]);
          toast.success("Successfully saved new drug order!", {
            position: toast.POSITION.TOP_RIGHT,
          });
        }
        setSaving(false);
        props.toggle();
      } catch (e) {
        console.error("Error saving drug order:", e);
        toast.error("An error occurred while saving drug prescription", {
          position: toast.POSITION.TOP_RIGHT,
        });
        setSaving(false);
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
      toast.error("An error occurred while fetching DURATION UNIT", {
        position: toast.POSITION.TOP_RIGHT,
      });
    }
  }, []);

  const loadPharmacyDrugs = useCallback(async () => {
    try {
      const response = await axios.get(`${baseUrl}drugs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data?.length > 0 && response.data[0].id > 0) {
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

  const drugRows =
    drugs?.length > 0
      ? drugs.map(drug => (
          <option key={drug.name} value={drug.name}>
            {drug.name}
          </option>
        ))
      : null;

  const dosageUnitsRows =
    dosageUnits?.length > 0
      ? dosageUnits.map(unit => (
          <option key={unit.display} value={unit.display}>
            {unit.display}
          </option>
        ))
      : null;

  const durationUnitsRows =
    durationUnits?.length > 0
      ? durationUnits.map(unit => (
          <option key={unit.display} value={unit.display}>
            {unit.display}
          </option>
        ))
      : null;

  return (
    <div>
      <Modal show={props.showModal} onHide={props.toggle} size="lg">
        <Modal.Header style={{ backgroundColor: "#eeeeee" }}>
          <Modal.Title>Medication Prescription</Modal.Title>
          <Button
            variant=""
            className="btn-close"
            onClick={props.toggle}
          ></Button>
        </Modal.Header>
        <Modal.Body>
          <Card>
            <CardBody>
              <form onSubmit={handleSubmit}>
                {/* Encounter Date */}
                <div className="row">
                  <div className="form-group mb-3 col-md-12">
                    <FormGroup>
                      <Label className={classes.label}>Encounter Date</Label>
                      <InputGroup>
                        <Input
                          type="date"
                          name="encounterDate"
                          id="encounterDate"
                          className={classes.input}
                          onFocus={initializeErrors}
                          value={pharmacyOrder.encounterDate}
                          disabled
                        />
                      </InputGroup>
                      {errors.encounterDate && (
                        <span className={classes.error}>
                          {errors.encounterDate}
                        </span>
                      )}
                    </FormGroup>
                  </div>
                </div>

                {/* Medication Details */}
                <div className="row">
                  <div className="form-group mb-3 col-md-4">
                    <FormGroup>
                      <Label className={classes.label}>Medication Name</Label>
                      <InputGroup>
                        <Input
                          type="select"
                          name="medicationName"
                          id="medicationName"
                          className={classes.input}
                          onFocus={initializeErrors}
                          onChange={handleInputChangePharmacyOrderDto}
                          value={pharmacyOrder.medicationName}
                        >
                          <option value=""></option>
                          {drugRows}
                        </Input>
                        <span
                          style={{
                            position: "absolute",
                            top: "1.3em",
                            right: "6%",
                            zIndex: 100,
                          }}
                        >
                          ▼
                        </span>
                      </InputGroup>
                      {errors.medicationName && (
                        <span className={classes.error}>
                          {errors.medicationName}
                        </span>
                      )}
                    </FormGroup>
                  </div>

                  <div className="form-group mb-3 col-md-4">
                    <FormGroup>
                      <Label className={classes.label}>Formulation</Label>
                      <InputGroup>
                        <Input
                          type="text"
                          name="formulation"
                          id="formulation"
                          className={classes.input}
                          onFocus={initializeErrors}
                          onChange={handleInputChangePharmacyOrderDto}
                          value={pharmacyOrder.formulation}
                        />
                      </InputGroup>
                      {errors.formulation && (
                        <span className={classes.error}>
                          {errors.formulation}
                        </span>
                      )}
                    </FormGroup>
                  </div>

                  <div className="form-group mb-3 col-md-4">
                    <FormGroup>
                      <Label className={classes.label}>Route of Admin</Label>
                      <InputGroup>
                        <Input
                          type="text"
                          name="routeOfAdmin"
                          id="routeOfAdmin"
                          className={classes.input}
                          onFocus={initializeErrors}
                          onChange={handleInputChangePharmacyOrderDto}
                          value={pharmacyOrder.routeOfAdmin}
                        />
                      </InputGroup>
                      {errors.routeOfAdmin && (
                        <span className={classes.error}>
                          {errors.routeOfAdmin}
                        </span>
                      )}
                    </FormGroup>
                  </div>

                  <div className="form-group mb-3 col-md-4">
                    <FormGroup>
                      <Label className={classes.label}>Medication Time</Label>
                      <InputGroup>
                        <Input
                          type="text"
                          name="timingInstructions"
                          id="timingInstructions"
                          className={classes.input}
                          onFocus={initializeErrors}
                          onChange={handleInputChangePharmacyOrderDto}
                          value={pharmacyOrder.timingInstructions}
                        />
                      </InputGroup>
                      {errors.timingInstructions && (
                        <span className={classes.error}>
                          {errors.timingInstructions}
                        </span>
                      )}
                    </FormGroup>
                  </div>

                  <div className="form-group mb-3 col-md-4">
                    <FormGroup>
                      <Label className={classes.label}>
                        Quantity Prescribed
                      </Label>
                      <InputGroup>
                        <Input
                          type="text"
                          name="quantityPrescribed"
                          id="quantityPrescribed"
                          className={classes.input}
                          onFocus={initializeErrors}
                          onChange={handleInputChangePharmacyOrderDto}
                          value={pharmacyOrder.quantityPrescribed}
                        />
                      </InputGroup>
                      {errors.quantityPrescribed && (
                        <span className={classes.error}>
                          {errors.quantityPrescribed}
                        </span>
                      )}
                    </FormGroup>
                  </div>

                  <div className="form-group mb-3 col-md-4">
                    <FormGroup>
                      <Label className={classes.label}>Strength</Label>
                      <InputGroup>
                        <Input
                          type="text"
                          name="strength"
                          id="strength"
                          className={classes.input}
                          onFocus={initializeErrors}
                          onChange={handleInputChangePharmacyOrderDto}
                          value={pharmacyOrder.strength}
                        />
                      </InputGroup>
                      {errors.strength && (
                        <span className={classes.error}>{errors.strength}</span>
                      )}
                    </FormGroup>
                  </div>

                  <div className="form-group mb-3 col-md-4">
                    <FormGroup>
                      <Label className={classes.label}>Dosage (Amount)</Label>
                      <InputGroup>
                        <Input
                          type="select"
                          name="strengthUnit"
                          id="strengthUnit"
                          className={classes.input}
                          onFocus={initializeErrors}
                          onChange={handleInputChangePharmacyOrderDto}
                          value={pharmacyOrder.strengthUnit}
                        >
                          <option value=""></option>
                          {dosageUnitsRows}
                        </Input>
                        <span
                          style={{
                            position: "absolute",
                            top: "0.7em",
                            right: "6%",
                            zIndex: 100,
                          }}
                        >
                          ▼
                        </span>
                      </InputGroup>
                      {errors.strengthUnit && (
                        <span className={classes.error}>
                          {errors.strengthUnit}
                        </span>
                      )}
                    </FormGroup>
                  </div>
                </div>

                {/* Brand Name */}
                <div className="row">
                  <div className="form-group mb-3 col-md-12">
                    <FormGroup>
                      <Label className={classes.label}>Brand Name</Label>
                      <InputGroup>
                        <Input
                          type="text"
                          name="drugBrandName"
                          id="drugBrandName"
                          className={classes.input}
                          onFocus={initializeErrors}
                          onChange={handleInputChangePharmacyOrderDto}
                          value={pharmacyOrder.drugBrandName}
                        />
                      </InputGroup>
                      {errors.drugBrandName && (
                        <span className={classes.error}>
                          {errors.drugBrandName}
                        </span>
                      )}
                    </FormGroup>
                  </div>
                </div>

                {/* Frequency, Start Date, Duration */}
                <div className="row">
                  <div className="form-group mb-3 col-md-6">
                    <FormGroup>
                      <Label className={classes.label}>Frequency</Label>
                      <InputGroup>
                        <Input
                          type="number"
                          name="frequency"
                          id="frequency"
                          className={classes.input}
                          onFocus={initializeErrors}
                          onChange={handleInputChangePharmacyOrderDto}
                          value={pharmacyOrder.frequency}
                        />
                      </InputGroup>
                      {errors.frequency && (
                        <span className={classes.error}>
                          {errors.frequency}
                        </span>
                      )}
                    </FormGroup>
                  </div>

                  <div className="form-group mb-3 col-md-6">
                    <FormGroup>
                      <Label className={classes.label}>Start Date</Label>
                      <InputGroup>
                        <Input
                          type="date"
                          name="startDate"
                          id="startDate"
                          className={classes.input}
                          min={format(
                            new Date(props.encounterDate),
                            "yyyy-MM-dd"
                          )}
                          max={format(new Date(), "yyyy-MM-dd")}
                          onFocus={initializeErrors}
                          onChange={handleInputChangePharmacyOrderDto}
                          value={pharmacyOrder.startDate}
                        />
                      </InputGroup>
                      {errors.startDate && (
                        <span className={classes.error}>
                          {errors.startDate}
                        </span>
                      )}
                    </FormGroup>
                  </div>

                  <div className="form-group mb-3 col-md-6">
                    <FormGroup>
                      <Label className={classes.label}>Duration</Label>
                      <InputGroup>
                        <Input
                          type="number"
                          name="duration"
                          id="duration"
                          className={classes.input}
                          onFocus={initializeErrors}
                          onChange={handleInputChangePharmacyOrderDto}
                          value={pharmacyOrder.duration}
                        />
                      </InputGroup>
                      {errors.duration && (
                        <span className={classes.error}>{errors.duration}</span>
                      )}
                    </FormGroup>
                  </div>

                  <div className="form-group mb-3 col-md-6">
                    <FormGroup>
                      <Label className={classes.label}>Duration Unit</Label>
                      <InputGroup>
                        <Input
                          type="select"
                          name="durationUnit"
                          id="durationUnit"
                          className={classes.input}
                          onFocus={initializeErrors}
                          onChange={handleInputChangePharmacyOrderDto}
                          value={pharmacyOrder.durationUnit}
                        >
                          <option value=""></option>
                          {durationUnitsRows}
                        </Input>
                        <span
                          style={{
                            position: "absolute",
                            top: "0.7em",
                            right: "6%",
                            zIndex: 100,
                          }}
                        >
                          ▼
                        </span>
                      </InputGroup>
                      {errors.durationUnit && (
                        <span className={classes.error}>
                          {errors.durationUnit}
                        </span>
                      )}
                    </FormGroup>
                  </div>
                </div>

                {/* Notes */}
                <div className="row">
                  <div className="form-group mb-3 col-md-12">
                    <FormGroup>
                      <Label className={classes.label}>Notes</Label>
                      <InputGroup>
                        <Input
                          type="textarea"
                          name="notes"
                          id="notes"
                          className={classes.input}
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
                      {errors.notes && (
                        <span className={classes.error}>{errors.notes}</span>
                      )}
                    </FormGroup>
                  </div>
                </div>

                {saving && <Spinner />}

                <br />
                <MatButton
                  type="submit"
                  variant="contained"
                  color="primary"
                  className={classes.button}
                  startIcon={<SaveIcon />}
                  disabled={saving}
                >
                  {!saving ? "Save" : "Saving..."}
                </MatButton>
                <MatButton
                  variant="contained"
                  className={classes.button}
                  startIcon={<CancelIcon />}
                  onClick={props.toggle}
                  disabled={saving}
                >
                  Cancel
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

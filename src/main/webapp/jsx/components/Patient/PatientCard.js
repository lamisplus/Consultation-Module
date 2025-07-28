import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpansionPanelActions from "@material-ui/core/ExpansionPanelActions";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Divider from "@material-ui/core/Divider";
import "semantic-ui-css/semantic.min.css";
import { Col, Row } from "reactstrap";
import { Modal } from "react-bootstrap";
import { Spinner } from "reactstrap";
import axios from "axios";
import { toast } from "react-toastify";
import { token, url as baseUrl } from "../../../api";
import { useHistory } from "react-router-dom";
import PostClient from "./PostClient";
import MatButton from "@material-ui/core/Button";
import { TiArrowBack } from "react-icons/ti";
import usePatientCardStyles from "../../../hooks/usePatientCardStyles";
import SaveIcon from "@material-ui/icons/Save";
import ExitToAppIcon from "@material-ui/icons/ExitToApp";
let styles;
function PatientCard(props) {
  const { classes } = props;
  const patientObjs = props.patientObj ? props.patientObj : {};
  const [patientObj, setpatientObj] = useState(patientObjs);
  const [modal, setModal] = useState(false);
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [hasConsultationHistory, setHasConsultationHistory] = useState(false);
  const history = useHistory();
  const toggle = () => setModal(!modal);
  const toggleCheckout = () => setCheckoutModal(!checkoutModal);
  styles = usePatientCardStyles();
  const checkConsultationHistory = useCallback(async () => {
    try {
      const response = await axios.get(
        `${baseUrl}consultations/consultations-by-patient-id/${patientObj.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHasConsultationHistory(response.data.length > 0);
    } catch (e) {
      console.error("Error checking consultation history:", e);
      setHasConsultationHistory(false);
    }
  }, [patientObj.id]);

  useEffect(() => {
    if (patientObj.id) {
      checkConsultationHistory();
    }
  }, [patientObj.id, checkConsultationHistory]);

  const calculate_age = dobInput => {
    const dob = new Date(dobInput);
    const today = new Date();

    let years = today.getFullYear() - dob.getFullYear();
    let months = today.getMonth() - dob.getMonth();
    const days = today.getDate() - dob.getDate();

    if (days < 0) {
      months--;
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    if (years < 1) {
      return `${months} month${months !== 1 ? "s" : ""}`;
    } else {
      return `${years} year${years !== 1 ? "s" : ""}`;
    }
  };

  const getHospitalNumber = patientObj => {
    return patientObj.hospitalNumber || "";
  };

  const getPhoneNumber = patientObj => {
    return patientObj.phoneNumber || "";
  };

  const getAddress = patientObj => {
    return patientObj.address || "";
  };

  const PostPatientService = row => {
    setpatientObj({ ...patientObj, ...row });
    setModal(!modal);
  };

  const handleCheckoutPatient = async () => {
    setCheckingOut(true);

    try {
      await axios.put(
        `${baseUrl}patient/visit/checkout/${patientObj.visitId}`,
        patientObj.visitId,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setCheckingOut(false);
      setCheckoutModal(false);

      setpatientObj({ ...patientObj, checkedOut: true });

      toast.success("Patient checked out successfully.", {
        position: toast.POSITION.TOP_RIGHT,
      });
      history.push("/");
    } catch (error) {
      setCheckingOut(false);
      console.error("Checkout error:", error);
      toast.error("Something went wrong during checkout. Please try again.", {
        position: toast.POSITION.TOP_CENTER,
      });
    }
  };

  return (
    <div className={classes.root}>
      <ExpansionPanel defaultExpanded>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
          <Row>
            <Col md={11}>
              <Row className={"mt-1"}>
                <Col md={12} className={classes.root2}>
                  <b style={{ fontSize: "25px", color: "rgb(153, 46, 98)" }}>
                    {patientObj.surname +
                      ", " +
                      patientObj.firstName +
                      " " +
                      patientObj.otherName}
                  </b>
                </Col>
                <Col
                  md={4}
                  className={classes.root2}
                  style={{ marginTop: "10px" }}
                >
                  <span>
                    {" "}
                    Hospital Number :{" "}
                    <b style={{ color: "#0B72AA" }}>
                      {getHospitalNumber(patientObj)}
                    </b>
                  </span>
                </Col>

                <Col
                  md={4}
                  className={classes.root2}
                  style={{ marginTop: "10px" }}
                >
                  <span>
                    Date Of Birth :{" "}
                    <b style={{ color: "#0B72AA" }}>
                      {patientObj.dateOfBirth || patientObj.dateofbirth}{" "}
                    </b>
                  </span>
                </Col>
                <Col
                  md={4}
                  className={classes.root2}
                  style={{ marginTop: "10px" }}
                >
                  <span>
                    {" "}
                    Age :{" "}
                    <b style={{ color: "#0B72AA" }}>
                      {calculate_age(
                        patientObj.dateOfBirth || patientObj.dateofbirth
                      )}
                    </b>
                  </span>
                </Col>
                <Col md={4} style={{ marginTop: "10px" }}>
                  <span>
                    {" "}
                    Sex : <b style={{ color: "#0B72AA" }}>{patientObj.sex}</b>
                  </span>
                </Col>
                <Col
                  md={4}
                  className={classes.root2}
                  style={{ marginTop: "10px" }}
                >
                  <span>
                    {" "}
                    Phone Number :{" "}
                    <b style={{ color: "#0B72AA" }}>
                      {getPhoneNumber(patientObj)}
                    </b>
                  </span>
                </Col>
                <Col
                  md={4}
                  className={classes.root2}
                  style={{ marginTop: "10px" }}
                >
                  <span>
                    {" "}
                    Address :{" "}
                    <b style={{ color: "#0B72AA" }}>{getAddress(patientObj)}</b>
                  </span>
                </Col>
              </Row>
            </Col>
          </Row>
        </ExpansionPanelSummary>
        <Divider />
        <ExpansionPanelActions expandIcon={<ExpandMoreIcon />}>
          <div className="d-flex align-items-center">
            {" "}
            <div className="m-1">
              <MatButton
                startIcon={<ExitToAppIcon />}
                style={{
                  backgroundColor: "#208001",
                  color: "#fff",
                  whiteSpace: "nowrap",
                }}
                onClick={toggleCheckout}
              >
                {" "}
                Checkout Patient
              </MatButton>
            </div>
            <div className="m-1">
              {hasConsultationHistory && (
                <MatButton
                  startIcon={<SaveIcon />}
                  style={{
                    backgroundColor: "#014d88",

                    color: "#fff",
                    whiteSpace: "nowrap",
                  }}
                  onClick={() => PostPatientService(patientObj)}
                >
                  {" "}
                  Post Patient to Services
                </MatButton>
              )}
            </div>
            <div className="m-1">
              <MatButton
                startIcon={<TiArrowBack />}
                onClick={() => history.goBack()}
                style={{
                  backgroundColor: "rgb(153, 46, 98)",
                  color: "#fff",
                }}
              >
                Back
              </MatButton>
            </div>
          </div>
        </ExpansionPanelActions>
      </ExpansionPanel>
      <PostClient toggle={toggle} showModal={modal} patientObj={patientObj} />
      <Modal
        show={checkoutModal}
        onHide={toggleCheckout}
        className="fade"
        size="md"
      >
        <Modal.Header style={{ backgroundColor: "#fff" }}>
          <Modal.Title style={{ color: "#992E62", fontWeight: "bold" }}>
            Confirm Patient Checkout
          </Modal.Title>
          <button
            type="button"
            className="btn-close"
            onClick={toggleCheckout}
            aria-label="Close"
          ></button>
        </Modal.Header>
        <Modal.Body>
          <div style={{ textAlign: "center", padding: "20px" }}>
            <p style={{ fontSize: "16px", marginBottom: "20px" }}>
              Are you sure you want to checkout{" "}
              <strong style={{ color: "#0B72AA" }}>
                {patientObj.surname}, {patientObj.firstName}
              </strong>{" "}
              (Hospital No: <strong>{getHospitalNumber(patientObj)}</strong>)?
            </p>
            <p style={{ fontSize: "14px", color: "#666" }}>
              This action will end the current visit for this patient.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer style={{ justifyContent: "center" }}>
          <MatButton
            variant="outlined"
            onClick={toggleCheckout}
            style={{
              marginRight: "10px",
              borderColor: "#6c757d",
              color: "#6c757d",
            }}
          >
            Cancel
          </MatButton>
          <MatButton
            variant="contained"
            onClick={handleCheckoutPatient}
            disabled={checkingOut}
            style={{
              backgroundColor: "#208001",
              color: "#fff",
            }}
          >
            {checkingOut ? (
              <>
                <Spinner size="sm" style={{ marginRight: "8px" }} />
                Checking Out...
              </>
            ) : (
              "Confirm Checkout"
            )}
          </MatButton>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

PatientCard.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(PatientCard);

import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import classNames from "classnames";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpansionPanelActions from "@material-ui/core/ExpansionPanelActions";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Divider from "@material-ui/core/Divider";
import { Button } from "semantic-ui-react";
import { Label } from "semantic-ui-react";
import "semantic-ui-css/semantic.min.css";
import { Col, Row } from "reactstrap";
import { Modal } from "react-bootstrap";
import { Spinner } from "reactstrap";
import axios from "axios";
import { toast } from "react-toastify";
import { token, url as baseUrl } from "../../../api";
import { useHistory } from "react-router-dom";

import moment from 'moment';
import PostPatient from './PostPatient';
import PostClient from './PostClient';
import { Link } from 'react-router-dom';
import MatButton from '@material-ui/core/Button';
import { TiArrowBack } from 'react-icons/ti';

const styles = theme => ({
  root: {
    width: '100%',
    marginBottom: '1em',
  },
  heading: {
    fontSize: theme.typography.pxToRem(15),
  },
  secondaryHeading: {
    fontSize: theme.typography.pxToRem(15),
    color: theme.palette.text.secondary,
  },
  icon: {
    verticalAlign: 'bottom',
    height: 20,
    width: 20,
  },
  details: {
    alignItems: 'center',
  },
  column: {
    flexBasis: '20.33%',
  },
  helper: {
    borderLeft: `2px solid ${theme.palette.divider}`,
    padding: `${theme.spacing.unit}px ${theme.spacing.unit * 2}px`,
  },
  link: {
    color: theme.palette.primary.main,
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
});

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

  // Check if patient has consultation history for validation
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

  const calculate_age = (dobInput) => {
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
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else {
      return `${years} year${years !== 1 ? 's' : ''}`;
    }
  };

  const getHospitalNumber = patientObj => {
    return patientObj.hospitalNumber || '';
  };

  const getPhoneNumber = patientObj => {
    return patientObj.phoneNumber || '';
  };

  const getAddress = patientObj => {
    return patientObj.address || '';
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
    <div
      className={classes.root}
      // style={{ position: "sticky", top: "10px", zIndex: 1000 }}
    >
      <ExpansionPanel defaultExpanded>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
          <Row>
            <Col md={11}>
              <Row className={'mt-1'}>
                <Col md={12} className={classes.root2}>
                  <b style={{ fontSize: '25px', color: 'rgb(153, 46, 98)' }}>
                    {patientObj.surname +
                      ', ' +
                      patientObj.firstName +
                      ' ' +
                      patientObj.otherName}
                  </b>
                </Col>
                <Col
                  md={4}
                  className={classes.root2}
                  style={{ marginTop: '10px' }}
                >
                  <span>
                    {' '}
                    Hospital Number :{' '}
                    <b style={{ color: '#0B72AA' }}>
                      {getHospitalNumber(patientObj)}
                    </b>
                  </span>
                </Col>

                <Col
                  md={4}
                  className={classes.root2}
                  style={{ marginTop: '10px' }}
                >
                  <span>
                    Date Of Birth :{' '}
                    <b style={{ color: '#0B72AA' }}>
                      {patientObj.dateOfBirth || patientObj.dateofbirth}{' '}
                    </b>
                  </span>
                </Col>
                <Col
                  md={4}
                  className={classes.root2}
                  style={{ marginTop: '10px' }}
                >
                  <span>
                    {' '}
                    Age :{' '}
                    <b style={{ color: '#0B72AA' }}>
                      {calculate_age(
                        patientObj.dateOfBirth || patientObj.dateofbirth
                      )}
                    </b>
                  </span>
                </Col>
                <Col md={4} style={{ marginTop: '10px' }}>
                  <span>
                    {' '}
                    Sex : <b style={{ color: '#0B72AA' }}>{patientObj.sex}</b>
                  </span>
                </Col>
                <Col
                  md={4}
                  className={classes.root2}
                  style={{ marginTop: '10px' }}
                >
                  <span>
                    {' '}
                    Phone Number :{' '}
                    <b style={{ color: '#0B72AA' }}>
                      {getPhoneNumber(patientObj)}
                    </b>
                  </span>
                </Col>
                <Col
                  md={4}
                  className={classes.root2}
                  style={{ marginTop: '10px' }}
                >
                  <span>
                    {' '}
                    Address :{' '}
                    <b style={{ color: '#0B72AA' }}>{getAddress(patientObj)}</b>
                  </span>
                </Col>
              </Row>
            </Col>
          </Row>
        </ExpansionPanelSummary>
        <Divider />
        <ExpansionPanelActions expandIcon={<ExpandMoreIcon />}>
          <div className="float-end" style={{ floated: "right" }}>
            {" "}
            <Button floated="right" style={{ padding: "0px" }}>
              <MatButton
                variant="contained"
                floated="right"
                startIcon={<TiArrowBack />}
                onClick={() => history.goBack()}
                style={{
                  backgroundColor: "rgb(153, 46, 98)",
                  color: "#fff",
                  height: "35px",
                }}
              >
                <span style={{ textTransform: "capitalize" }}>Back</span>
              </MatButton>
            </Button>{" "}
            {/* Post Patient Button - Only shows if patient has consultation history */}
            {hasConsultationHistory && (
              <Button
                floated="right"
                style={{
                  backgroundColor: "#014d88",
                  color: "#fff",
                  height: "35px",
                  marginLeft: "10px",
                }}
                onClick={() => PostPatientService(patientObj)}
              >
                Post Patient to Services
              </Button>
            )}
            {/* Checkout Button - Always available (no validation) */}
            <Button
              floated="right"
              style={{
                backgroundColor: "#208001",
                color: "#fff",
                height: "35px",
                marginLeft: "10px",
              }}
              onClick={toggleCheckout}
            >
              Checkout Patient
            </Button>
          </div>
        </ExpansionPanelActions>
      </ExpansionPanel>

      {/* Post Patient Modal */}
      <PostClient toggle={toggle} showModal={modal} patientObj={patientObj} />

      {/* Checkout Confirmation Modal */}
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

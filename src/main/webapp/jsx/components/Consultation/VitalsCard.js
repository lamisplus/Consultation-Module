import React, { Fragment, useState, useCallback, useEffect } from "react";
import {
  Grid,
  Segment,
  Label,
  List,
  Card,
  Button,
  Icon,
  Feed,
} from "semantic-ui-react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  AccordionActions,
} from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import moment from "moment";
import { makeStyles } from "@material-ui/core/styles";
import axios from "axios";
import { token, url as baseUrl } from "../../../api";
import _ from "lodash";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { CardFooter, Spinner } from "reactstrap";

const useStyles = makeStyles(theme => ({
  root: {
    width: "100%",
  },
  heading: {
    fontSize: theme.typography.pxToRem(15),
    fontWeight: "bolder",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    flexDirection: "column",
  },
  loadingText: {
    marginTop: "10px",
    fontSize: "14px",
    color: "#666",
  },
}));

function VitalsCard({ props }) {
  const classes = useStyles();
  const patientObj = props.patientObj ? props.patientObj : {};
  const [otherVisitsVitals, setOtherVisitVitals] = useState([]);
  const [latestVitals, setVitalSignDto] = useState({});
  const [previousConsultation, setPreviousConsultation] = useState([]);

  // Loading states
  const [loadingVitals, setLoadingVitals] = useState(true);
  const [loadingOtherVitals, setLoadingOtherVitals] = useState(true);
  const [loadingConsultations, setLoadingConsultations] = useState(true);
  const [visibleClinicalNotesCount, setVisibleClinicalNotesCount] = useState(6);
  // Get latest vitals for current visit
  const getLatestVitals = useCallback(async () => {
    setLoadingVitals(true);
    try {
      const response = await axios.get(
        `${baseUrl}patient/vital-sign/visit/${patientObj.visitId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVitalSignDto(response.data);
    } catch (error) {
      toast.error("Error fetching current vitals", {
        position: toast.POSITION.TOP_CENTER,
      });
    } finally {
      setLoadingVitals(false);
    }
  }, [patientObj.visitId]);

  // Get vitals from other visits
  const loadOtherVisitsVitals = useCallback(async () => {
    setLoadingOtherVitals(true);
    try {
      const response = await axios.get(
        `${baseUrl}patient/vital-sign/person/${patientObj.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.length > 0) {
        // Remove current visit vitals from the list
        const otherVisits = response.data.filter(
          vital => vital.visitId !== patientObj.visitId
        );
        setOtherVisitVitals(otherVisits);
      }
    } catch (error) {
      toast.error("Error fetching vital signs history", {
        position: toast.POSITION.TOP_CENTER,
      });
    } finally {
      setLoadingOtherVitals(false);
    }
  }, [patientObj.id, patientObj.visitId]);

  // Get previous consultations
  const loadPreviousConsultation = useCallback(async () => {
    setLoadingConsultations(true);
    try {
      const response = await axios.get(
        `${baseUrl}consultations/consultations-by-patient-id/${patientObj.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPreviousConsultation(response.data);
    } catch (error) {
      toast.error("Error fetching consultation history", {
        position: toast.POSITION.TOP_CENTER,
      });
    } finally {
      setLoadingConsultations(false);
    }
  }, [patientObj.id]);

  useEffect(() => {
    if (patientObj.id && patientObj.visitId) {
      getLatestVitals();
      loadOtherVisitsVitals();
      loadPreviousConsultation();
    }
  }, [
    patientObj.id,
    patientObj.visitId,
    getLatestVitals,
    loadOtherVisitsVitals,
    loadPreviousConsultation,
  ]);

  // Loading component
  const LoadingSpinner = ({ text }) => (
    <div className={classes.loadingContainer}>
      <Spinner size="sm" color="primary" />
      <div className={classes.loadingText}>{text}</div>
    </div>
  );

  // Check if any data is still loading
  const isAnyLoading =
    loadingVitals || loadingOtherVitals || loadingConsultations;

  return (
    <Grid.Column>
      <Segment>
        {/* Current Vitals Section */}
        <div className={classes.root}>
          {loadingVitals ? (
            <LoadingSpinner text="Loading current vitals..." />
          ) : Object.keys(latestVitals).length > 0 ? (
            <Accordion
              style={{ minHeight: "45px", padding: "0px 0px 0px 0px" }}
              defaultExpanded={true}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1a-content"
                id="panel1a-header"
                style={{
                  padding: "0px 0px 0px 2px",
                  borderBottom: "2px solid #eee",
                }}
              >
                <Label as="a" color="blue" style={{ width: "100%" }}>
                  <Typography className={classes.heading}>
                    Current Vitals -{" "}
                    {moment(latestVitals.captureDate).format(
                      "DD/MM/YYYY hh:mm A"
                    )}
                  </Typography>
                </Label>
              </AccordionSummary>
              <AccordionDetails style={{ padding: "8px" }}>
                <List celled style={{ width: "100%" }}>
                  <List.Item
                    style={{
                      paddingBottom: "10px",
                      paddingTop: "10px",
                      borderTop: "1px solid #fff",
                      marginTop: "-5px",
                    }}
                  >
                    Pulse{" "}
                    <span
                      style={{ color: "rgb(153, 46, 98)" }}
                      className="float-end"
                    >
                      <b>{latestVitals.pulse} bpm</b>
                    </span>
                  </List.Item>
                  <List.Item
                    style={{ paddingBottom: "10px", paddingTop: "10px" }}
                  >
                    Respiratory Rate{" "}
                    <span className="float-end">
                      <b style={{ color: "rgb(153, 46, 98)" }}>
                        {latestVitals.respiratoryRate} bpm
                      </b>
                    </span>
                  </List.Item>
                  <List.Item
                    style={{ paddingBottom: "10px", paddingTop: "10px" }}
                  >
                    Temperature{" "}
                    <span className="float-end">
                      <b style={{ color: "rgb(153, 46, 98)" }}>
                        {latestVitals.temperature} °C
                      </b>
                    </span>
                  </List.Item>
                  <List.Item
                    style={{ paddingBottom: "10px", paddingTop: "10px" }}
                  >
                    Blood Pressure{" "}
                    <span className="float-end">
                      <b style={{ color: "rgb(153, 46, 98)" }}>
                        {latestVitals.systolic}/{latestVitals.diastolic}
                      </b>
                    </span>
                  </List.Item>
                  <List.Item
                    style={{ paddingBottom: "10px", paddingTop: "10px" }}
                  >
                    Height{" "}
                    <span className="float-end">
                      <b style={{ color: "rgb(153, 46, 98)" }}>
                        {latestVitals.height} cm
                      </b>
                    </span>
                  </List.Item>
                  <List.Item
                    style={{ paddingBottom: "10px", paddingTop: "10px" }}
                  >
                    Weight{" "}
                    <span className="float-end">
                      <b style={{ color: "rgb(153, 46, 98)" }}>
                        {latestVitals.bodyWeight} kg
                      </b>
                    </span>
                  </List.Item>
                  <List.Item
                    style={{ paddingBottom: "10px", paddingTop: "10px" }}
                  >
                    BMI{" "}
                    <span className="float-end">
                      <b style={{ color: "rgb(153, 46, 98)" }}>
                        {(
                          latestVitals.bodyWeight /
                          Math.pow(latestVitals.height / 100, 2)
                        ).toFixed(1)}
                      </b>
                    </span>
                  </List.Item>
                </List>
              </AccordionDetails>
            </Accordion>
          ) : (
            <div
              style={{ padding: "20px", textAlign: "center", color: "#666" }}
            >
              No current vitals recorded for this visit
            </div>
          )}

          {/* Previous Vitals Section */}
          {loadingOtherVitals ? (
            <LoadingSpinner text="Loading vital signs history..." />
          ) : (
            otherVisitsVitals &&
            otherVisitsVitals.length > 0 &&
            otherVisitsVitals.map((vital, index) => (
              <Accordion key={index}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls={`panel${index}a-content`}
                  id={`panel${index}a-header`}
                  style={{ padding: "0px 0px 0px 10px" }}
                >
                  <Typography
                    className={classes.heading}
                    style={{ color: "#014d88" }}
                  >
                    Previous Vitals -{" "}
                    {moment(vital.captureDate).format("DD/MM/YYYY hh:mm A")}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails style={{ padding: "8px" }}>
                  <List celled style={{ width: "100%" }}>
                    <List.Item
                      style={{
                        paddingBottom: "10px",
                        paddingTop: "10px",
                        borderTop: "1px solid #fff",
                        marginTop: "-5px",
                      }}
                    >
                      Pulse{" "}
                      <span style={{ color: "#014d88" }} className="float-end">
                        <b>{vital.pulse} bpm</b>
                      </span>
                    </List.Item>
                    <List.Item
                      style={{ paddingBottom: "10px", paddingTop: "10px" }}
                    >
                      Respiratory Rate{" "}
                      <span className="float-end" style={{ color: "#014d88" }}>
                        <b>{vital.respiratoryRate} bpm</b>
                      </span>
                    </List.Item>
                    <List.Item
                      style={{ paddingBottom: "10px", paddingTop: "10px" }}
                    >
                      Temperature{" "}
                      <span className="float-end" style={{ color: "#014d88" }}>
                        <b>{vital.temperature} °C</b>
                      </span>
                    </List.Item>
                    <List.Item
                      style={{ paddingBottom: "10px", paddingTop: "10px" }}
                    >
                      Blood Pressure{" "}
                      <span className="float-end" style={{ color: "#014d88" }}>
                        <b>
                          {vital.systolic}/{vital.diastolic}
                        </b>
                      </span>
                    </List.Item>
                    <List.Item
                      style={{ paddingBottom: "10px", paddingTop: "10px" }}
                    >
                      Height{" "}
                      <span className="float-end" style={{ color: "#014d88" }}>
                        <b>{vital.height} cm</b>
                      </span>
                    </List.Item>
                    <List.Item
                      style={{ paddingBottom: "10px", paddingTop: "10px" }}
                    >
                      Weight{" "}
                      <span className="float-end" style={{ color: "#014d88" }}>
                        <b>{vital.bodyWeight} kg</b>
                      </span>
                    </List.Item>
                    <List.Item
                      style={{ paddingBottom: "10px", paddingTop: "10px" }}
                    >
                      BMI{" "}
                      <span className="float-end" style={{ color: "#014d88" }}>
                        <b>
                          {(
                            vital.bodyWeight / Math.pow(vital.height / 100, 2)
                          ).toFixed(1)}
                        </b>
                      </span>
                    </List.Item>
                  </List>
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </div>

        <hr />

        {/* Consultation History Button */}
        <div>
          <List>
            <List.Item>
              <Link
                to={{
                  pathname: "/patient-consultations-history",
                  state: { patientObj: patientObj },
                }}
              >
                <Button
                  icon
                  labelPosition="right"
                  style={{
                    width: "100%",
                    backgroundColor: "#992E62",
                    color: "#fff",
                    padding: "15px",
                  }}
                  fluid
                  disabled={isAnyLoading}
                >
                  <Icon name="eye" />
                  View Recent Consultation History
                </Button>
              </Link>
            </List.Item>
          </List>

          {/* Previous Clinical Notes */}
          {loadingConsultations ? (
            <LoadingSpinner text="Loading consultation history..." />
          ) : (
            previousConsultation &&
            previousConsultation.length > 0 && (
              <Card style={{ width: "100%" }}>
                <Card.Content style={{ padding: "5px" }}>
                  <Feed>
                    {[...previousConsultation]
                      .splice(0, visibleClinicalNotesCount)
                      .map((consultation, index) => (
                        <Accordion key={index}>
                          <AccordionSummary
                            expandIcon={
                              <ExpandMoreIcon style={{ color: "#fff" }} />
                            }
                            aria-controls={`consultation${index}a-content`}
                            id={`consultation${index}a-header`}
                            style={{
                              padding: "0px 0px 0px 10px",
                              backgroundColor: "#1678c2",
                              border: "2px solid #ddd",
                              color: "#fff",
                            }}
                          >
                            <Typography className={classes.heading}>
                              Clinical Notes - {consultation.encounterDate}
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails
                            style={{
                              padding: "10px 5px",
                              minHeight: 100,
                              border: "2px solid #ddd",
                              marginTop: "-10px",
                              fontFamily: "Trebuchet",
                            }}
                          >
                            <div
                              dangerouslySetInnerHTML={{
                                __html: consultation.visitNotes,
                              }}
                            />
                          </AccordionDetails>
                        </Accordion>
                      ))}
                  </Feed>
                </Card.Content>
                <CardFooter>
                  <Button
                    onClick={() => setVisibleClinicalNotesCount(prev => ++prev)}
                    color="link"
                  >
                    View more
                  </Button>{" "}
                </CardFooter>
              </Card>
            )
          )}
        </div>
      </Segment>
    </Grid.Column>
  );
}

export default VitalsCard;

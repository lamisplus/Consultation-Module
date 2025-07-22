import React, { Fragment, useState, useEffect } from "react";
import { Dropdown } from "react-bootstrap";
import PerfectScrollbar from "react-perfect-scrollbar";
import axios from "axios";
import { url as baseUrl, token } from "../../../api";
import { Alert } from "react-bootstrap";
import { Card, Accordion } from "react-bootstrap";
import { useHistory } from "react-router-dom";
import "react-widgets/dist/css/react-widgets.css";
import { Modal } from "react-bootstrap";
import { Button, Grid } from "semantic-ui-react";
import { useConsultationsByPatientId } from "../../../hooks/useConsultationsByPatientId";
import { useSortedVisitsByDate } from "../../../hooks/useSortedVisitsByDate";
import PatientCardDetail from "./PatientCard";
import VisitDetailsTimeline from "./VisitDetailsTimeline";

function PreviousConsultation(props) {
  let history = useHistory();
  const patientObj =
    history.location && history.location.state
      ? history.location.state.patientObj
      : {};
  console.log(patientObj);

  const [refillList, setRefillList] = useState([]);
  const [clinicVisitList, setClinicVisitList] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [loadingLab, setLoadingLab] = useState(true);
  const [loadingPharmacy, setLoadingPharmacy] = useState(true);
  const [notToBeUpdated, setNotToBeUpdated] = useState([
    "eac",
    "eac-session",
    "client-tracker",
  ]);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [record, setRecord] = useState(null);
  const toggle = () => setOpen(!open);
  const [activeAccordionHeaderShadow, setActiveAccordionHeaderShadow] =
    useState(0);

  useEffect(() => {
    if (props.patientObj && props.patientObj !== null) {
      LaboratoryHistory();
      PharmacyList();
      ClinicVisitList();
      RecentActivities();
    }
  }, [props.patientObj]);

  const RecentActivities = () => {
    axios
      .get(
        `${baseUrl}hiv/patients/${patientObj.patientId}/activities?full=false`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((response) => {
        setLoadingRecent(false);
        setRecentActivities(response.data);
      })
      .catch((error) => {
        setLoadingRecent(false);
      });
  };

  const {
    consultations,
    loading: loadingConsultations,
    error,
  } = useConsultationsByPatientId(patientObj.patientId);
  const sortedEncountersByDate = useSortedVisitsByDate(consultations);

  //Get list of LaboratoryHistory
  const LaboratoryHistory = () => {
    axios
      .get(
        `${baseUrl}laboratory/rde-all-orders/patients/${props.patientObj.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((response) => {
        setLoadingLab(false);

        //setViralLoad(response.data);
      })
      .catch((error) => {
        setLoadingLab(false);
      });
  };
  //GET LIST Drug Refill
  const PharmacyList = () => {
    setLoading(true);
    axios
      .get(
        `${baseUrl}hiv/art/pharmacy/patient?pageNo=0&pageSize=10&personId=${patientObj.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((response) => {
        setLoading(false);
        setLoadingPharmacy(false);
        setRefillList(response.data);
      })
      .catch((error) => {
        setLoading(false);
      });
  };
  //GET LIST Drug Refill
  const ClinicVisitList = () => {
    setLoading(true);
    axios
      .get(
        `${baseUrl}hiv/art/clinic-visit/person?pageNo=0&pageSize=10&personId=${patientObj.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((response) => {
        setLoading(false);
        setClinicVisitList(response.data);
      })
      .catch((error) => {
        setLoading(false);
      });
  };

  const activityName = (name) => {
    const activityMapping = {
      consultation: "Consultation",
    };
    return activityMapping[name];
  };

  const LoadViewPage = (row, action) => {};
  // ViewChronicCare
  const LoadDeletePage = (row) => {};

  const LoadModal = (row) => {
    toggle();
    setRecord(row);
  };

  const [selectedEncounter, setSelectedEncounter] = useState(null);

  const onSelectEncounter = (encounter) => {
    setSelectedEncounter(encounter);
  };

  useEffect(
    () => setSelectedEncounter(sortedEncountersByDate?.[0]),
    [sortedEncountersByDate]
  );

  return (
    <Fragment>
      <PatientCardDetail patientObj={patientObj} />
      <div className="row">
        <div className="col-xl-4 col-xxl-4 col-lg-4">
          <div className="card">
            <div className="card-header  border-0 pb-0">
              <h4 className="card-title">
                <b>Consultations</b>{" "}
              </h4>
            </div>
            <div className="card-body">
              {loadingRecent !== false ? (
                <>
                  <PerfectScrollbar
                    style={{ height: "370px" }}
                    id="DZ_W_Todo1"
                    className="widget-media dz-scroll ps ps--active-y"
                  >
                    <Accordion
                      className="accordion accordion-header-bg accordion-header-shadow accordion-rounded "
                      defaultActiveKey="0"
                    >
                      <>
                        {sortedEncountersByDate.map((encounter, i) => (
                          <div className="accordion-item" key={encounter?.date}>
                            <Accordion.Toggle
                              as={Card.Text}
                              eventKey={`${i}`}
                              className={`accordion-header ${
                                activeAccordionHeaderShadow === i
                                  ? ""
                                  : "collapsed"
                              } accordion-header-info`}
                              onClick={() =>
                                setActiveAccordionHeaderShadow(
                                  activeAccordionHeaderShadow === i ? -1 : i
                                )
                              }
                            >
                              <span className="accordion-header-icon"></span>
                              <span className="accordion-header-text">
                                Visit Date :{" "}
                                <span className="">{encounter.date}</span>{" "}
                              </span>
                              <span className="accordion-header-indicator"></span>
                            </Accordion.Toggle>
                            <Accordion.Collapse
                              eventKey={`${i}`}
                              className="accordion__body"
                            >
                              <div className="accordion-body-text">
                                <ul className="timeline py-0">
                                  {encounter?.visits &&
                                    encounter?.visits.map((activity, id) => (
                                      <li
                                        onClick={() =>
                                          onSelectEncounter(encounter)
                                        }
                                        key={id}
                                      >
                                        <div className="timeline-panel">
                                          <div
                                            className={
                                              id % 2 == 0
                                                ? "media me-2 media-info"
                                                : "media me-2 media-success"
                                            }
                                          >
                                            OPD
                                          </div>
                                          <div className="media-body">
                                            <h5 className="mb-1">
                                              {activityName("consultation")}{" "}
                                            </h5>
                                            <small className="d-block">
                                              {activity.date}
                                            </small>
                                          </div>
                                          {!notToBeUpdated.includes(
                                            activity.path
                                          ) ? (
                                            <Dropdown className="dropdown">
                                              <Dropdown.Toggle
                                                variant=" light"
                                                className="i-false p-0 btn-info sharp"
                                              >
                                                <svg
                                                  width="18px"
                                                  height="18px"
                                                  viewBox="0 0 24 24"
                                                  version="1.1"
                                                >
                                                  <g
                                                    stroke="none"
                                                    strokeWidth="1"
                                                    fill="none"
                                                    fillRule="evenodd"
                                                  >
                                                    <rect
                                                      x="0"
                                                      y="0"
                                                      width="24"
                                                      height="24"
                                                    />
                                                    <circle
                                                      fill="#000000"
                                                      cx="5"
                                                      cy="12"
                                                      r="2"
                                                    />
                                                    <circle
                                                      fill="#000000"
                                                      cx="12"
                                                      cy="12"
                                                      r="2"
                                                    />
                                                    <circle
                                                      fill="#000000"
                                                      cx="19"
                                                      cy="12"
                                                      r="2"
                                                    />
                                                  </g>
                                                </svg>
                                              </Dropdown.Toggle>
                                              <Dropdown.Menu className="dropdown-menu">
                                                {activity.viewable && (
                                                  <Dropdown.Item
                                                    className="dropdown-item"
                                                    onClick={() =>
                                                      LoadViewPage(
                                                        activity,
                                                        "view"
                                                      )
                                                    }
                                                  >
                                                    View
                                                  </Dropdown.Item>
                                                )}
                                                {activity.viewable && (
                                                  <Dropdown.Item
                                                    className="dropdown-item"
                                                    onClick={() =>
                                                      LoadViewPage(
                                                        activity,
                                                        "update"
                                                      )
                                                    }
                                                  >
                                                    Update
                                                  </Dropdown.Item>
                                                )}
                                                {activity.deletable && (
                                                  <Dropdown.Item
                                                    className="dropdown-item"
                                                    to="/widget-basic"
                                                    onClick={() =>
                                                      LoadModal(
                                                        activity,
                                                        "delete"
                                                      )
                                                    }
                                                  >
                                                    Delete
                                                  </Dropdown.Item>
                                                )}
                                              </Dropdown.Menu>
                                            </Dropdown>
                                          ) : (
                                            ""
                                          )}
                                        </div>
                                      </li>
                                    ))}
                                </ul>
                              </div>
                            </Accordion.Collapse>
                          </div>
                        ))}
                      </>
                    </Accordion>
                  </PerfectScrollbar>
                </>
              ) : (
                <>
                  <p>Loading please wait...</p>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header border-0 pb-0">
              <h4 className="card-title">
                <b>Consultation Summary</b>
              </h4>
            </div>
            <Grid columns="equal" stackable>
              <Grid.Column>
                <div className="card-body p-2">
                  {loadingLab !== false ? (
                    <>
                      <PerfectScrollbar
                        style={{ height: "370px" }}
                        id="DZ_W_TimeLine"
                        className="widget-timeline dz-scroll height370 ps ps--active-y"
                      >
                        <VisitDetailsTimeline visit={selectedEncounter} />
                      </PerfectScrollbar>
                    </>
                  ) : (
                    <>
                      <p>Loading please wait...</p>
                    </>
                  )}
                </div>
              </Grid.Column>
            </Grid>
          </div>
        </div>
      </div>
      <Modal
        show={open}
        toggle={toggle}
        className="fade"
        size="md"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        backdrop="static"
      >
        <Modal.Header>
          <Modal.Title id="contained-modal-title-vcenter">
            Notification!
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h4>
            Are you Sure you want to delete{" "}
            <b>
              {record && record.name === "Chronic Care"
                ? "Care and Support"
                : record && record.name}
            </b>
          </h4>
        </Modal.Body>
        <Modal.Footer>
          <Button
            onClick={() => LoadDeletePage(record)}
            style={{ backgroundColor: "red", color: "#fff" }}
            disabled={saving}
          >
            {saving === false ? "Yes" : "Deleting..."}
          </Button>
          <Button
            onClick={toggle}
            style={{ backgroundColor: "#014d88", color: "#fff" }}
            disabled={saving}
          >
            No
          </Button>
        </Modal.Footer>
      </Modal>
    </Fragment>
  );
}

export default PreviousConsultation;

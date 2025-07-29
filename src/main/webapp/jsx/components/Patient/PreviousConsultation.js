import React, { Fragment, useState, useEffect } from "react";
import PerfectScrollbar from "react-perfect-scrollbar";
import { Card, Accordion } from "react-bootstrap";
import { useHistory } from "react-router-dom";
import "react-widgets/dist/css/react-widgets.css";
import { Grid } from "semantic-ui-react";
import { useConsultationsByPatientId } from "../../../hooks/useConsultationsByPatientId";
import { useSortedVisitsByDate } from "../../../hooks/useSortedVisitsByDate";
import PatientCardDetail from "./PatientCard";
import VisitDetailsTimeline from "./VisitDetailsTimeline";
import { useAddConsultationDrugOrders } from "../../../hooks/useAddConsultationDrugOrders";
import { useDrugOrdersByPatientId } from "../../../hooks/useDrugOrdersByPatientId";
import { useLabOrdersByPatientId } from "../../../hooks/useLabOrdersByPatientId";
import { useAddConsultationLabOrders } from "../../../hooks/useAddConsultationLabOrders";

function PreviousConsultation(props) {
  let history = useHistory();
  const patientObj =
    history.location && history.location.state
      ? history.location.state.patientObj
      : {};

  const [loadingRecent, setLoadingRecent] = useState(true);
  const [loadingLab, setLoadingLab] = useState(true);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [record, setRecord] = useState(null);
  const toggle = () => setOpen(!open);
  const [activeAccordionHeaderShadow, setActiveAccordionHeaderShadow] =
    useState(0);

  const {
    consultations,
    loading: loadingConsultations,
    error: consultationError,
  } = useConsultationsByPatientId(patientObj?.patientId);
  const {
    drugOrders,
    loading: loadingDrugOrders,
    error: drugOrderErrors,
  } = useDrugOrdersByPatientId(patientObj?.patientId);
  const {
    labOrders,
    loading: loadingLabOrders,
    error: labOrderErrors,
  } = useLabOrdersByPatientId(patientObj?.patientId);

  const consulationsWithDrugOrders = useAddConsultationDrugOrders(
    consultations,
    drugOrders
  );
  const consulationsWithDrugAndLabOrders = useAddConsultationLabOrders(
    consulationsWithDrugOrders,
    labOrders
  );
  const sortedEncountersByDate = useSortedVisitsByDate(
    consulationsWithDrugAndLabOrders
  );

  const activityName = name => {
    const activityMapping = {
      consultation: "Consultation",
    };
    return activityMapping[name];
  };

  const [selectedEncounter, setSelectedEncounter] = useState(null);

  const onSelectEncounter = encounter => {
    setSelectedEncounter(encounter);
  };

  useEffect(
    () => setSelectedEncounter(sortedEncountersByDate?.[0]?.visits?.[0]),
    [sortedEncountersByDate]
  );

  return (
    <Fragment>
      <PatientCardDetail patientObj={patientObj} />
      <div className="row">
        <div className="col-xl-4 col-xxl-4 col-lg-4">
          <div className="card rounded-0">
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
                        {sortedEncountersByDate.map((encounter, i) => {
                          return (
                            <div
                              className="accordion-item"
                              key={encounter?.date}
                            >
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
                                      encounter?.visits.map((visit, id) => (
                                        <li
                                          // className="btn btn-primary d-block"
                                          onClick={() =>
                                            onSelectEncounter(visit)
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
                                                {encounter.date}
                                              </small>
                                            </div>
                                          </div>
                                        </li>
                                      ))}
                                  </ul>
                                </div>
                              </Accordion.Collapse>
                            </div>
                          );
                        })}
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
          <div className="card rounded-0">
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
    </Fragment>
  );
}

export default PreviousConsultation;

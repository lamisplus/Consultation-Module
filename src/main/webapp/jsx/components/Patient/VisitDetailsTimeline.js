import React from "react";
import "../../../css/timeline.css";
import { Typewriter } from "react-simple-typewriter";
import useSanitizeEditorInput from "../../../hooks/useSanitizeEditorInput";

const getStatus = visit => {
  return "Completed";
};

const VisitDetailsTimeline = ({ visit }) => {
  const visitIdKey = visit?.id || "unknown-visit";

  const renderTypewriter = (text, key, speed = 5) => (
    <Typewriter
      words={[text || "None"]}
      typeSpeed={speed}
      deleteSpeed={0}
      delaySpeed={1000}
      loop={1}
      cursor={false}
      key={key}
    />
  );

  const sanitizedVisitNote = useSanitizeEditorInput(visit?.visitNotes || "");
  const noteText = sanitizedVisitNote || "None";

  return (
    <ul className="timeline">
      <li>
        <div className="timeline-marker card-bg-muted-orange"></div>
        <span className="timeline-panel text-muted card-bg-five">
          <h6 className="mb-0">
            Visit Notes <br />
            <strong className="text-primary">
              {renderTypewriter(noteText, `${visitIdKey}-note`)}
            </strong>
          </h6>
        </span>
      </li>

      <li>
        <div className="timeline-marker bg-warning"></div>
        <span className="timeline-panel text-muted card-bg-five">
          <h6 className="mb-0">
            Presenting Complaints <br />
            {visit?.presentingComplaints?.length ? (
              visit.presentingComplaints?.map(complaint => (
                <div key={complaint?.id}>
                  <strong className="text-primary">
                    {renderTypewriter(
                      complaint.complaint || "Unknown complaint",
                      `${visitIdKey}-complaint-${complaint?.id}`
                    )}
                  </strong>
                  <div>
                    <strong>Onset:</strong> {complaint.onsetDate} |{" "}
                    <strong>Severity:</strong> {complaint.severity}
                  </div>
                  {complaint.dateResolved && (
                    <div>
                      <strong>Date Resolved:</strong> {complaint.dateResolved}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <strong className="text-primary">None</strong>
            )}
          </h6>
        </span>
      </li>

      <li>
        <div className="timeline-marker card-bg-muted-yellow"></div>
        <span className="timeline-panel text-muted card-bg-five">
          <h6 className="mb-0">
            Diagnosis List <br />
            {visit?.diagnosisList?.length ? (
              visit.diagnosisList?.map(diag => (
                <div key={diag.id}>
                  <strong className="text-primary">
                    {renderTypewriter(
                      diag.diagnosis || "Unknown diagnosis",
                      `${visitIdKey}-diagnosis-${diag?.id}`
                    )}
                  </strong>
                  <div>
                    <strong>Order:</strong> {diag.diagnosisOrder} |{" "}
                    <strong>Certainty:</strong> {diag.certainty}
                  </div>
                </div>
              ))
            ) : (
              <strong className="text-primary">None</strong>
            )}
          </h6>
        </span>
      </li>
      {/* 
      <li>
        <div className="timeline-marker card-bg-muted-pink"></div>
        <span className="timeline-panel text-muted card-bg-five">
          <h6 className="mb-0">
            Status <br />
            <strong className="text-primary">
              {renderTypewriter(getStatus(visit), `${visitIdKey}-status`)}
            </strong>
          </h6>
        </span>
      </li> */}

      <li>
        <div className="timeline-marker card-bg-muted-purple"></div>
        <span className="timeline-panel text-muted card-bg-five">
          <h6 className="mb-0">
            Drug Orders <br />
            {visit?.drugOrders?.length ? (
              visit.drugOrders?.map(order => (
                <div key={order?.id} className="mb-2">
                  <strong className="text-primary">
                    {renderTypewriter(
                      order.medicationName || "Unnamed Medication",
                      `${visitIdKey}-drug-${order?.id}`
                    )}
                  </strong>
                  <div>
                    <strong>Strength:</strong> {order.strength} |{" "}
                    <strong>Quantity:</strong> {order.quantityPrescribed}
                  </div>
                  <div>
                    <strong>Frequency:</strong> {order.frequency} |{" "}
                    <strong>Time:</strong> {order.timingInstructions}
                  </div>
                  {order.duration && (
                    <div>
                      <strong>Duration:</strong> {order.duration}{" "}
                      {order.durationUnit || ""}
                    </div>
                  )}
                  {order.notes && (
                    <div>
                      <strong>Notes:</strong> {order.notes}
                    </div>
                  )}
                  <hr />
                </div>
              ))
            ) : (
              <strong className="text-primary">None</strong>
            )}
          </h6>
        </span>
      </li>

      <li>
        <div className="timeline-marker card-bg-muted-green"></div>
        <span className="timeline-panel text-muted card-bg-five">
          <h6 className="mb-0">
            Lab Orders <br />
            {visit?.labOrders?.length ? (
              visit.labOrders?.map((entry, index) => (
                <div key={index} className="mb-3">
                  {entry.labOrder?.tests?.length ? (
                    <div className="mt-2">
                      {entry.labOrder.tests?.map(test => (
                        <div key={test.id} className="ml-2">
                          <div>
                            <strong className="text-primary">
                              {test.labTestName}
                            </strong>
                          </div>
                          {entry.labOrder?.orderDate && (
                            <div>
                              <strong>Order Date:</strong>{" "}
                              {entry.labOrder.orderDate}
                            </div>
                          )}
                          <div>
                            <strong>Group:</strong> {test.labTestGroupName}
                          </div>
                          <div>
                            <strong>Measurement:</strong> {test.unitMeasurement}
                          </div>
                          <div>
                            <strong>Status:</strong>{" "}
                            {test.labTestOrderStatusName}
                          </div>
                          <hr />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <strong className="text-primary">None</strong>
            )}
          </h6>
        </span>
      </li>
    </ul>
  );
};

export default VisitDetailsTimeline;

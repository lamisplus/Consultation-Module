import React from 'react';
import './timeline.css'; // Adjust path as needed
// Helper function for status (customize as needed)
const getStatus = visit => {
  // Placeholder logic, update as needed
  return 'Completed';
};

const VisitDetailsTimeline = ({ visit }) => {
  return (
    <ul className="timeline">
      {/* 2. Visit Notes */}
      <li>
        <div className="timeline-marker card-bg-muted-orange"></div>
        <span className="timeline-panel text-muted card-bg-one">
          <h6 className="mb-0">
            Visit Notes <br />
            <strong className="text-primary">
              <span>{visit?.visits[0]?.visitNotes}</span>
            </strong>
          </h6>
        </span>
      </li>

      {/* 3. Presenting Complaints */}
      <li>
        <div className="timeline-marker bg-warning"></div>
        <span className="timeline-panel text-muted card-bg-two">
          <h6 className="mb-0">
            Presenting Complaints <br />
            {visit?.visits[0]?.presentingComplaints &&
            visit?.visits[0]?.presentingComplaints.length > 0 ? (
              visit?.visits[0]?.presentingComplaints.map(complaint => (
                <div key={complaint.id}>
                  <strong className="text-primary">
                    {complaint.complaint}
                  </strong>
                  <div>
                    Onset: {complaint.onsetDate} | Severity:{' '}
                    {complaint.severity}
                  </div>
                  {complaint.dateResolved && (
                    <div>Date Resolved: {complaint.dateResolved}</div>
                  )}
                </div>
              ))
            ) : (
              <strong className="text-primary">None</strong>
            )}
          </h6>
        </span>
      </li>

      {/* 4. Diagnosis List */}
      <li>
        <div className="timeline-marker card-bg-muted-yellow"></div>
        <span className="timeline-panel text-muted card-bg-three">
          <h6 className="mb-0">
            Diagnosis List <br />
            {visit?.visits[0]?.diagnosisList &&
            visit?.visits[0]?.diagnosisList.length > 0 ? (
              visit?.visits[0]?.diagnosisList.map(diag => (
                <div key={diag.id}>
                  <strong className="text-primary">{diag.diagnosis}</strong>
                  <div>
                    Order: {diag.diagnosisOrder} | Certainty: {diag.certainty}
                  </div>
                </div>
              ))
            ) : (
              <strong className="text-primary">None</strong>
            )}
          </h6>
        </span>
      </li>

      {/* 5. Status */}
      <li>
        <div className="timeline-marker card-bg-muted-pink"></div>
        <span className="timeline-panel text-muted card-bg-four">
          <h6 className="mb-0">
            Status <br />
            <strong className="text-primary">{getStatus(visit)}</strong>
          </h6>
        </span>
      </li>
    </ul>
  );
};

export default VisitDetailsTimeline;

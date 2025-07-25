import React, { useState, useEffect } from "react";
import axios from "axios";
import { url as baseUrl, token } from "../api";

export function useConsultationsByPatientId(patientId) {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!patientId) return;

    setLoading(true);
    setError(null);

    axios
      .get(`${baseUrl}consultations/consultations-by-patient-id/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        console.log("consulations: ", response.data);
        setConsultations(response.data);
      })
      .catch((err) => {
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [patientId]);

  return { consultations, loading, error };
}

// Example usage in a component
export default function ConsultationsList({ patientId }) {
  const { consultations, loading, error } =
    useConsultationsByPatientId(patientId);

  if (!patientId) return <div>Please select a patient.</div>;
  if (loading) return <div>Loading consultations...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h3>Consultations for Patient {patientId}</h3>
      <ul>
        {consultations.map((consultation) => (
          <li key={consultation.id}>{JSON.stringify(consultation)}</li>
        ))}
      </ul>
    </div>
  );
}

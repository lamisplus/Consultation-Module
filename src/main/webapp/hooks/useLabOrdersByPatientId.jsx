import React, { useState, useEffect } from "react";
import axios from "axios";
import { url as baseUrl, token } from "../api";

export const useLabOrdersByPatientId = patientId => {
  const [labOrders, setLabOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    setError(null);

    axios
      .get(`${baseUrl}laboratory/orders/patients/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(response => {
        setLabOrders(response.data);
      })
      .catch(err => {
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [patientId]);

  return { labOrders, loading, error };
};

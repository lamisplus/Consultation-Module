import React, { useState, useEffect } from "react";
import axios from "axios";
import { url as baseUrl, token } from "../api";

export const useDrugOrdersByPatientId = patientId => {
  const [drugOrders, setDrugOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!patientId) return;

    setLoading(true);
    setError(null);

    axios
      .get(`${baseUrl}drug-orders/get-patient-drugOrder/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(response => {
        console.log("drugOrders: ", response.data);
        setDrugOrders(response.data);
      })
      .catch(err => {
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [patientId]);

  return { drugOrders, loading, error };
};

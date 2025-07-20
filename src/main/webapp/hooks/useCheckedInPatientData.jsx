import { useCallback } from 'react';
import axios from 'axios';

export const useCheckedInPatientData = (
  baseUrl,
  token,
  searchValue = '*',
  pageNo = 0,
  pageSize = 20
) => {
  const fetchPatients = useCallback(
    async query => {
      try {
        const response = await axios.get(`${baseUrl}opd-setting`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const { data } = response;
        const prepCode = data?.find(
          item => item.moduleServiceName.toUpperCase() === 'PREP'
        )?.moduleServiceCode;

        if (prepCode) {
          const patientResponse = await axios.get(
            `${baseUrl}patient/checked-in-by-service/${prepCode}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          return patientResponse?.data;
        }
      } catch (error) {
        console.error('Failed to fetch patients:', error);
        return [];
      }
    },
    [baseUrl, token]
  );

  return { fetchPatients };
};

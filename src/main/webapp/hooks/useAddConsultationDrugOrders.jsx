import { useMemo } from "react";

export const useAddConsultationDrugOrders = (consultations, medications) => {
  return useMemo(() => {
    return consultations.map(consult => {
      const drugOrders = medications.filter(
        med => med.visitId === consult.visitId
      );
      return { ...consult, drugOrders };
    });
  }, [consultations, medications]);
};

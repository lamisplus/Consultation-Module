import { useMemo } from "react";

export const useAddConsultationLabOrders = (consultations, tests) => {
  return useMemo(() => {
    return consultations?.map(consult => {
      const labOrders = tests?.filter(
        labOrder => labOrder?.labOrder?.visitId === consult.visitId
      );
      return { ...consult, labOrders };
    });
  }, [consultations, tests]);
};

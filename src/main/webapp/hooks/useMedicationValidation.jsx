import { validate } from "@material-ui/pickers";
import { useEffect, useState } from "react";

const useMedicationValidation = (objValues, errors, setErrors) => {
  let temp = {};
  const initializeErrors = () => {
    temp.encounterDate = objValues.encounterDate
      ? ""
      : "⚠ This field is required.";
    temp.medicationName = objValues.medicationName
      ? ""
      : "⚠ This field is required.";
    temp.formulation = objValues.formulation ? "" : "⚠ This field is required.";
    temp.routeOfAdmin = objValues.routeOfAdmin
      ? ""
      : "⚠ This field is required.";
    temp.timingInstructions = objValues.timingInstructions
      ? ""
      : "⚠ This field is required.";
    temp.quantityPrescribed = objValues.quantityPrescribed
      ? ""
      : "⚠ This field is required.";
    temp.strength = objValues.strength ? "" : "⚠ This field is required.";
    temp.strengthUnit = objValues.strengthUnit
      ? ""
      : "⚠ This field is required.";
    temp.frequency = objValues.frequency ? "" : "⚠ This field is required.";
    temp.startDate = objValues.startDate ? "" : "⚠ This field is required.";
    temp.duration = objValues.duration ? "" : "⚠ This field is required.";
    temp.durationUnit = objValues.durationUnit
      ? ""
      : "⚠ This field is required.";
    setErrors(temp);
  };

  const validate = () => Object.values(temp).every(x => x === "");
  return {
    initializeErrors,
    validate,
  };
};

export default useMedicationValidation;

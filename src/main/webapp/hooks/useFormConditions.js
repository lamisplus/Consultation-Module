export const useAlphabetOnly = value => {
  return value.replace(/[^a-z]/gi, '');
};
//hooks will be added or modified when extra conditions are required for access

export const useRegistrationConditions = () => {
  let isAccessible = true;
  return isAccessible;
};
export const useEligibilityConditions = () => {
  let isAccessible = true;
  return isAccessible;
};

export const useEnrollmentConditions = () => {
  let isAccessible = true;
  return isAccessible;
};

export const useCommencementConditions = () => {
  let isAccessible = true;
  return isAccessible;
};

export const useVisitConditions = () => {
  let isAccessible = true;
  return isAccessible;
};

export const useDiscontinuationConditions = () => {
  let isAccessible = true;
  return isAccessible;
};

export const usePatientVisitsConditions = () => {
  let isAccessible = true;
  return isAccessible;
};

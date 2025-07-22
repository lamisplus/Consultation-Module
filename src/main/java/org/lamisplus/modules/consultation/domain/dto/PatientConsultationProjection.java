package org.lamisplus.modules.consultation.domain.dto;

public interface PatientConsultationProjection {
    String getFirstName();
    String getSurname();
    String getOtherName();
    String getHospitalNumber();
    String getSex();
    Long getPatientId();
    java.time.LocalDate getEncounterDate();
    Long getVisitId();
}

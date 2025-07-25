package org.lamisplus.modules.consultation.domain.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import org.lamisplus.modules.consultation.domain.entity.Diagnosis;
import org.lamisplus.modules.consultation.domain.entity.PresentingComplaint;

import javax.persistence.Column;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.PastOrPresent;
import javax.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ConsultationDTO {
    private int id;
    @NotNull(message = "Visit ID is required")
    private int visitId;
    @NotNull( message = "Patient ID is required")
    private int patientId;
    @NotNull(message = "Encounter date is required")
    @PastOrPresent(message = "Encounter date cannot be in the future")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate encounterDate;
    @NotNull( message = "Visit notes are required")
    private String visitNotes;
    @NotNull(message = "Presenting complaints list cannot be null")
    @Size(min = 1, message = "At least one presenting complaint is required")
    private List<PresentingComplaintDTO> presentingComplaints;
    @NotNull(message = "Consultant name is required")
    private String signature;
    @NotNull(message = "Diagnosis list cannot be null")
    @Size(min = 1, message = "At least one diagnosis is required")
    private List<DiagnosisDTO> diagnosisList;


}

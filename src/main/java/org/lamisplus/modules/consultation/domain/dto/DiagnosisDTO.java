package org.lamisplus.modules.consultation.domain.dto;

import lombok.Data;

@Data
public class DiagnosisDTO {
    private int id;
    private String diagnosis;
    private int diagnosisOrder;
    private int certainty;
}

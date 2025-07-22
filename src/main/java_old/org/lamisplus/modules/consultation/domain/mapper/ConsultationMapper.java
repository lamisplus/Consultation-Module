package org.lamisplus.modules.consultation.domain.mapper;

import org.lamisplus.modules.consultation.domain.dto.ConsultationDTO;
import org.lamisplus.modules.consultation.domain.dto.DiagnosisDTO;
import org.lamisplus.modules.consultation.domain.dto.PresentingComplaintDTO;
import org.lamisplus.modules.consultation.domain.entity.Consultation;
import org.lamisplus.modules.consultation.domain.entity.Diagnosis;
import org.lamisplus.modules.consultation.domain.entity.PresentingComplaint;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ConsultationMapper {
    Consultation toConsultation(ConsultationDTO consultationDTO);
    Diagnosis toDiagnosis(DiagnosisDTO diagnosisDTO);
    PresentingComplaint toPresentingComplaint(PresentingComplaintDTO presentingComplaintDTO);

    ConsultationDTO toConsultationDto(Consultation consultation);
    DiagnosisDTO toDiagnosisDto(Diagnosis diagnosis);
    PresentingComplaintDTO toPresentingComplaintDto(PresentingComplaint presentingComplaint);

    List<ConsultationDTO> toConsultationDtoList(List<Consultation> consultationList);
    List<DiagnosisDTO> toDiagnosisDtoList(List<Diagnosis> diagnosisList);
    List<PresentingComplaintDTO> toPresentingComplaintDtoList(List<PresentingComplaint> presentingComplaintList);
}

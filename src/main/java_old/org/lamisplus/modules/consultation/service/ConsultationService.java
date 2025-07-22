package org.lamisplus.modules.consultation.service;

import lombok.RequiredArgsConstructor;
import org.lamisplus.modules.consultation.domain.dto.ConsultationDTO;
import org.lamisplus.modules.consultation.domain.entity.Consultation;
import org.lamisplus.modules.consultation.domain.mapper.ConsultationMapper;
import org.lamisplus.modules.consultation.repository.ConsultationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ConsultationService {
    @Autowired
    private ConsultationRepository repository;
    private final ConsultationMapper mapper;

    public ConsultationDTO Save(ConsultationDTO consultationDTO){

        Consultation consultation = mapper.toConsultation(consultationDTO);
        consultation.setUuid(UUID.randomUUID().toString());
        return mapper.toConsultationDto(repository.save(consultation));
    }

    public ConsultationDTO Update(int id, ConsultationDTO consultationDTO){
        Consultation consultation = mapper.toConsultation(consultationDTO);
        return mapper.toConsultationDto(repository.save(consultation));
    }

    public ConsultationDTO findById(int id) {
        return mapper.toConsultationDto(repository.findById(id).orElse(null));
    }

    public List<ConsultationDTO> GetAllEncountersByPatientId(int patientId) {
        return mapper.toConsultationDtoList(repository.findAllByPatientId(patientId));
    }

    public List<ConsultationDTO> GetAllEncountersByVisitId(int patientId) {
        return mapper.toConsultationDtoList(repository.findAllByVisitId(patientId));
    }

    public String Delete(int id) {
        Consultation consultation = repository.findById(id).orElse(null);
        repository.delete(consultation);
        return id + " deleted successfully";
    }
}

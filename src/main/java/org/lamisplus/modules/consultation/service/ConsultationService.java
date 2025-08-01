package org.lamisplus.modules.consultation.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lamisplus.modules.consultation.domain.dto.ConsultationDTO;
import org.lamisplus.modules.consultation.domain.dto.PatientConsultationProjection;
import org.lamisplus.modules.consultation.domain.entity.Consultation;
import org.lamisplus.modules.consultation.domain.entity.Diagnosis;
import org.lamisplus.modules.consultation.domain.entity.PresentingComplaint;
import org.lamisplus.modules.consultation.domain.mapper.ConsultationMapper;
import org.lamisplus.modules.consultation.exceptions.EntityNotFoundException;
import org.lamisplus.modules.consultation.repository.ConsultationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import liquibase.pro.packaged.c;
import liquibase.pro.packaged.cO;

import javax.transaction.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class ConsultationService {
    @Autowired
    private ConsultationRepository repository;
    private final ConsultationMapper mapper;

    @Transactional
    public ConsultationDTO save(ConsultationDTO consultationDTO) {
        Consultation consultation = mapper.toConsultation(consultationDTO);

        validateOnsetDate(consultation);

        if (consultation.getPresentingComplaints() != null) {
            consultation.getPresentingComplaints()
                    .forEach(pc -> pc.setConsultation(consultation));
        }

        if (consultation.getDiagnosisList() != null) {
            consultation.getDiagnosisList()
                    .forEach(d -> d.setConsultation(consultation));
        }

        if (consultation.getUuid() == null) {
            consultation.setUuid(UUID.randomUUID().toString());
        }

        return mapper.toConsultationDto(repository.save(consultation));
    }

    public ConsultationDTO findById(int id) {
        try {
            Consultation consultation = repository.findById(id).orElse(null);
            return consultation != null ? mapper.toConsultationDto(consultation) : null;
        } catch (Exception e) {
            log.error("Error finding consultation with ID: {}", id, e);
            return null;
        }
    }

    public List<ConsultationDTO> getAllEncountersByPatientId(int patientId) {
        List<Consultation> consultations = repository.findByPatientIdWithDetails(patientId);
        return mapper.toConsultationDtoList(consultations);
    }

    // public Page<ConsultationDTO> getAllConsultations(int page, int size, String
    // sortBy, String sortDir) {
    // Sort sort = sortDir.equalsIgnoreCase("asc")
    // ? Sort.by(sortBy).ascending()
    // : Sort.by(sortBy).descending();
    //
    // Pageable pageable = PageRequest.of(page, size, sort);
    // Page<Consultation> consultationPage = repository.findAll(pageable);
    //
    // return consultationPage.map(mapper::toConsultationDto);
    // }

    public Page<PatientConsultationProjection> searchPatientWithConsultation(String keyword, Pageable pageable) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return Page.empty(pageable);
        }
        return repository.findByPatientIdWithConsultation(keyword.trim(), pageable);
    }

    public List<ConsultationDTO> getAllConsultationsByVisitId(int visitId) {
        List<Consultation> consultations = repository.findAllByVisitIdWithDetails(visitId);
        return mapper.toConsultationDtoList(consultations);
    }

    public String delete(int id) {
        try {
            Consultation consultation = repository.findById(id).orElse(null);
            if (consultation != null) {
                repository.delete(consultation);
                return id + " deleted successfully";
            }
            return "No consultation found with ID: " + id;
        } catch (Exception e) {
            log.error("Error deleting consultation with ID: {}", id, e);
            return "Error deleting consultation with ID: " + id;
        }
    }

    @Transactional
    public ConsultationDTO update(int id, ConsultationDTO consultationDTO) {

        Consultation existingConsultation = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Consultation not found with id: " + id));

        Consultation updatedConsultation = mapper.toConsultation(consultationDTO);

        validateOnsetDate(updatedConsultation);

        updatedConsultation.setId(id);
        updatedConsultation.setUuid(existingConsultation.getUuid());

        updateChildEntities(existingConsultation, updatedConsultation);

        Consultation savedConsultation = repository.save(updatedConsultation);

        return mapper.toConsultationDto(savedConsultation);
    }

    private void updateChildEntities(Consultation existing, Consultation updated) {

        if (updated.getPresentingComplaints() != null) {

            existing.getPresentingComplaints().clear();

            // Add all updated complaints and set the consultation reference
            for (PresentingComplaint complaint : updated.getPresentingComplaints()) {
                complaint.setConsultation(existing);
                existing.getPresentingComplaints().add(complaint);
            }
        }

        if (updated.getDiagnosisList() != null) {

            existing.getDiagnosisList().clear();
            // Add all updated diagnoses and set the consultation reference
            for (Diagnosis diagnosis : updated.getDiagnosisList()) {
                diagnosis.setConsultation(existing);
                existing.getDiagnosisList().add(diagnosis);
            }
        }
    }

    private void validateOnsetDate(Consultation consultation) {
        LocalDate dateOfBirth = repository.findPatientDateOfBirthByPatientId(consultation.getPatientId());

        if (consultation.getPresentingComplaints() != null) {
            for (PresentingComplaint complaint : consultation.getPresentingComplaints()) {
                if (complaint.getComplaint() != null && complaint.getOnsetDate().isBefore(dateOfBirth)) {
                    throw new IllegalArgumentException(
                            "Diagnosis onset date cannot be before patient's date of birth.");
                }
                complaint.setConsultation(consultation);
            }
        }
    }

}

package org.lamisplus.modules.consultation.repository;

import lombok.RequiredArgsConstructor;
import org.lamisplus.modules.consultation.domain.dto.ConsultationDTO;
import org.lamisplus.modules.consultation.domain.dto.PatientConsultationProjection;
import org.lamisplus.modules.consultation.domain.entity.Diagnosis;
import org.lamisplus.modules.consultation.domain.entity.Consultation;
import org.lamisplus.modules.consultation.domain.entity.PresentingComplaint;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import javax.persistence.Cacheable;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.PastOrPresent;
import java.time.LocalDate;
import java.util.*;

@Repository
public interface ConsultationRepository extends JpaRepository<Consultation, Integer> {
    List<Consultation> findAllByPatientId(int PatientId);
    List<Consultation> findAllByVisitId(int PatientId);

    @Query(value =
            "SELECT c.* FROM consultation c " +
                    "LEFT JOIN consultation_complaint pc ON c.id = pc.consultation_id " +
                    "LEFT JOIN consultation_diagnosis d ON c.id = d.consultation_id " +
                    "WHERE c.patient_id = :patientId",
            nativeQuery = true)
    List<Consultation> findByPatientIdWithDetails(@Param("patientId") int patientId);


    @Query(value =
            "SELECT c.* FROM consultation c " +
                    "LEFT JOIN consultation_complaint pc ON c.id = pc.consultation_id " +
                    "LEFT JOIN consultation_diagnosis d ON c.id = d.consultation_id " +
                    "WHERE c.visit_id = :visitId",
            nativeQuery = true)
    List<Consultation> findAllByVisitIdWithDetails(@Param("visitId") int visitId);

    boolean existsByVisitIdAndEncounterDateAndPatientId(int visitId, LocalDate encounterDate, int patientId);

    Optional<Consultation> findByPatientIdAndVisitId(int patientId, int visitId);

    @Query(value =
            "SELECT \n" +
                    "    p.first_name AS firstName, \n" +
                    "    p.surname AS surname, \n" +
                    "    p.other_name AS otherName, \n" +
                    "    p.hospital_number AS hospitalNumber, \n" +
                    "    p.sex AS sex, \n" +
                    "    c.patient_id AS patientId, \n" +
                    "    c.encounter_date AS encounterDate, \n" +
                    "    c.visit_id AS visitId\n" +
                    "FROM \n" +
                    "    patient_person p\n" +
                    "JOIN \n" +
                    "    consultation c ON c.patient_id = p.id\n" +
                    "WHERE \n" +
                    "    LOWER(p.first_name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR\n" +
                    "    LOWER(p.surname) LIKE LOWER(CONCAT('%', :keyword, '%')) OR\n" +
                    "    LOWER(p.other_name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR\n" +
                    "    LOWER(p.hospital_number) LIKE LOWER(CONCAT('%', :keyword, '%'))\n",
            nativeQuery = true)
    Page<PatientConsultationProjection> findByPatientIdWithConsultation(@Param("keyword") String keyword, Pageable pageable);
}

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
                    "\t\tp.first_name AS firstName, \n" +
                    "\t\tp.surname AS surname, \n" +
                    "\t\tp.other_name AS otherName, \n" +
                    "\t\tp.hospital_number AS hospitalNumber, \n" +
                    "\t\tp.sex AS sex, \n" +
                    "\t\tc.patient_id AS patientId, \n" +
                    "\t\tc.encounter_date AS encounterDate, \n" +
                    "\t\tc.visit_id AS visitId,\n" +
                    "\t\tp.date_of_birth As dateofbirth,\n" +
                    "\t\tCOALESCE(\n" +
                    "                 (p.contact -> 'contact' -> 0 -> 'contactPoint' ->> 'value'),\n" +
                    "                 (p.contact_point -> 'contactPoint' -> 0 ->> 'value'),\n" +
                    "                 (p.contact_point -> 'contactPoint' -> 1 ->> 'value')\n" +
                    "             ) AS phoneNumber,\n" +
                    "\t\tCOALESCE(\n" +
                    "                 CASE \n" +
                    "                     WHEN p.contact -> 'contact' -> 0 -> 'address' IS NOT NULL \n" +
                    "                     THEN TRIM(CONCAT_WS(' ',\n" +
                    "                        \n" +
                    "                         CASE \n" +
                    "                             WHEN p.contact -> 'contact' -> 0 -> 'address' -> 'line' IS NOT NULL \n" +
                    "                             THEN array_to_string(\n" +
                    "                                 ARRAY(\n" +
                    "                                     SELECT value\n" +
                    "                                     FROM jsonb_array_elements_text(p.contact -> 'contact' -> 0 -> 'address' -> 'line') AS value\n" +
                    "                                     WHERE value IS NOT NULL AND value != ''\n" +
                    "                                 ), \n" +
                    "                                 ' '\n" +
                    "                             )\n" +
                    "                             ELSE NULL\n" +
                    "                         END,\n" +
                    "                       \n" +
                    "                         NULLIF(p.contact -> 'contact' -> 0 -> 'address' ->> 'city', '')\n" +
                    "                     ))\n" +
                    "                     ELSE NULL\n" +
                    "                 END,\n" +
                    "                 \n" +
                    "                 CASE \n" +
                    "                     WHEN p.address -> 'address' -> 0 IS NOT NULL \n" +
                    "                     THEN TRIM(CONCAT_WS(' ',\n" +
                    "                         \n" +
                    "                         CASE \n" +
                    "                             WHEN p.address -> 'address' -> 0 -> 'line' IS NOT NULL \n" +
                    "                             THEN array_to_string(\n" +
                    "                                 ARRAY(\n" +
                    "                                     SELECT value\n" +
                    "                                     FROM jsonb_array_elements_text(p.address -> 'address' -> 0 -> 'line') AS value\n" +
                    "                                     WHERE value IS NOT NULL AND value != ''\n" +
                    "                                 ), \n" +
                    "                                 ' '\n" +
                    "                             )\n" +
                    "                             ELSE NULL\n" +
                    "                         END,\n" +
                    "                         NULLIF(p.address -> 'address' -> 0 ->> 'city', '')\n" +
                    "                     ))\n" +
                    "                     ELSE NULL\n" +
                    "                 END\n" +
                    "             ) AS address\n" +
                    "\tFROM \n" +
                    "\tpatient_person p\n" +
                    "\tJOIN \n" +
                    "\tconsultation c ON c.patient_id = p.id\n" +
                    "\tWHERE \n" +
                    "\tLOWER(p.first_name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR\n" +
                    "\tLOWER(p.surname) LIKE LOWER(CONCAT('%', :keyword, '%')) OR\n" +
                    "\tLOWER(p.other_name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR\n" +
                    "\tLOWER(p.hospital_number) LIKE LOWER(CONCAT('%', :keyword, '%'))",
            nativeQuery = true)
    Page<PatientConsultationProjection> findByPatientIdWithConsultation(@Param("keyword") String keyword, Pageable pageable);
}

package org.lamisplus.modules.consultation.repository;

import org.lamisplus.modules.consultation.domain.entity.Diagnosis;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DiagnosisRepository extends JpaRepository<Diagnosis, Integer> {

}

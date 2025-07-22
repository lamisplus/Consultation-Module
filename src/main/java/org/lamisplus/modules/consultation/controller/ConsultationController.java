package org.lamisplus.modules.consultation.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lamisplus.modules.consultation.domain.dto.ConsultationDTO;
import org.lamisplus.modules.consultation.domain.entity.Consultation;
import org.lamisplus.modules.consultation.service.ConsultationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("api/v1/consultations")
public class ConsultationController {
    private final ConsultationService service;

    @PostMapping("")
    public ConsultationDTO Save(@RequestBody ConsultationDTO consultationDTO){
        return service.Save(consultationDTO);
    }

    @PutMapping("/{id}")
    public ConsultationDTO Update(@PathVariable int id, @RequestBody ConsultationDTO consultationDTO){
        return service.Update(id, consultationDTO);
    }

    @GetMapping("/{id}")
    public ConsultationDTO Load(@PathVariable int id){
        return service.findById(id);
    }

    @GetMapping("/consultations-by-patient-id/{patient_id}")
    public List<ConsultationDTO> GetConsultationsByPatientId(@PathVariable int patient_id){
        return service.GetAllEncountersByPatientId(patient_id);
    }

    @GetMapping("/consultations-by-visit-id/{visit_id}")
    public List<ConsultationDTO> GetConsultationsByVisitId(@PathVariable int visit_id){
        return service.GetAllEncountersByVisitId(visit_id);
    }

    @DeleteMapping("/{id}")
    public String Delete(@PathVariable Integer id){
        return service.Delete(id);
    }
}

package org.lamisplus.modules.consultation.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lamisplus.modules.consultation.domain.dto.ApiResponse;
import org.lamisplus.modules.consultation.domain.dto.ConsultationDTO;
import org.lamisplus.modules.consultation.service.ConsultationService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import javax.validation.Valid;
import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("api/v1/consultations")
public class ConsultationController {
    private final ConsultationService service;

    @PostMapping("")
    public ResponseEntity<ConsultationDTO> saveConsultation(@Valid @RequestBody ConsultationDTO dto) {
        ConsultationDTO saved = service.save(dto);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ConsultationDTO> update(@Valid @PathVariable int id, @RequestBody ConsultationDTO consultationDTO){
        ConsultationDTO update = service.update(id, consultationDTO);
        return ResponseEntity.ok(update);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConsultationDTO> load(@PathVariable int id) {
        ConsultationDTO dto = service.findById(id);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/consultations-by-patient-id/{patient_id}")
    public ResponseEntity<List<ConsultationDTO>> getConsultationsByPatientId(@PathVariable int patient_id){
        List<ConsultationDTO> consultationDTOS = service.getAllEncountersByPatientId(patient_id);
        return ResponseEntity.ok(consultationDTOS);

    }

    @GetMapping("/consultations-by-visit-id/{visit_id}")
    public ResponseEntity<List<ConsultationDTO>>getConsultationsByVisitId(@PathVariable int visit_id){
        List<ConsultationDTO> allConsultationsByVisitId = service.getAllConsultationsByVisitId(visit_id);
        return ResponseEntity.ok(allConsultationsByVisitId);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Integer id){
        return service.delete(id);
    }



    @GetMapping("")
    public ResponseEntity<Page<ConsultationDTO>> getAllConsultations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "encounterDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        return ResponseEntity.ok(
                service.getAllConsultations(page, size, sortBy, sortDir)
        );
    }
}

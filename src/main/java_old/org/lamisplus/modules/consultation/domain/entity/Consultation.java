package org.lamisplus.modules.consultation.domain.entity;

import lombok.*;

import javax.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Data
@Table(name = "consultation")
public class Consultation extends Audit<String> {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private int id;
    @Column(name = "uuid")
    private String uuid;
    @Column(name = "visit_id")
    private int visitId;
    @Column(name = "encounter_id")
    private int encounterId;
    @Column(name = "patient_id")
    private int patientId;
    @Column(name = "encounter_date")
    private LocalDate encounterDate;
    @Column(name = "visit_notes")
    private String visitNotes;

    @JoinColumn(name = "ConsultationId")
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PresentingComplaint> presentingComplaints;

    @JoinColumn(name = "ConsultationId")
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Diagnosis> diagnosisList;
}

package org.lamisplus.modules.consultation.domain.entity;

import lombok.*;

import javax.persistence.*;
import java.time.LocalDate;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Data
@Table(name = "consultation_complaint")
public class PresentingComplaint extends Audit<String> {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private int id;
    @Column(name = "complaint")
    private String complaint;
    @Column(name = "onset_date")
    private LocalDate onsetDate;
    @Column(name = "severity")
    private int severity;
    @Column(name = "date_resolved")
    private LocalDate dateResolved;
}

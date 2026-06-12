package tn.momsoft.back.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "settings")
public class ParametreCalendrier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer workingDaysPerWeek;
    private Double hoursPerDay;
    private Integer lunchBreakMinutes;
    private Integer yearlyWorkingDays;
    private LocalTime startTime;
    private LocalTime endTime;

    private Boolean monday;
    private Boolean tuesday;
    private Boolean wednesday;
    private Boolean thursday;
    private Boolean friday;
    private Boolean saturday;
    private Boolean sunday;
}
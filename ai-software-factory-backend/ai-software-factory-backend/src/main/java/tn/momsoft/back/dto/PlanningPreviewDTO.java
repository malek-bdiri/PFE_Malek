package tn.momsoft.back.dto;
import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDate;

@Data
@AllArgsConstructor
public class PlanningPreviewDTO {
    private double chargeTotale;
    private double durationDays;
    private double durationWeeks;
    private LocalDate endDate;
}
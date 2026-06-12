package tn.momsoft.back.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.momsoft.back.entity.JourFerie;
import tn.momsoft.back.entity.ParametreCalendrier;
import tn.momsoft.back.repository.JourFerieRepository;
import tn.momsoft.back.repository.ParametreCalendrierRepository;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CalendrierService {

    private final ParametreCalendrierRepository calendrierRepository;
    private final JourFerieRepository jourFerieRepository;

    // ================================
    // GET CALENDRIER UNIQUE
    // ================================
    public ParametreCalendrier getCalendrier() {
        return calendrierRepository.findById(1L)
                .orElseThrow(() -> new RuntimeException("Calendrier non configuré"));
    }

    // ================================
    // UPDATE CALENDRIER UNIQUE
    // ================================
    public ParametreCalendrier updateCalendrier(ParametreCalendrier param) {
        ParametreCalendrier existing = getCalendrier();
        existing.setStartTime(param.getStartTime());
        existing.setEndTime(param.getEndTime());
        existing.setLunchBreakMinutes(param.getLunchBreakMinutes());
        existing.setMonday(param.getMonday());
        existing.setTuesday(param.getTuesday());
        existing.setWednesday(param.getWednesday());
        existing.setThursday(param.getThursday());
        existing.setFriday(param.getFriday());
        existing.setSaturday(param.getSaturday());
        existing.setSunday(param.getSunday());
        existing.setWorkingDaysPerWeek(param.getWorkingDaysPerWeek());
        existing.setHoursPerDay(param.getHoursPerDay());
        return calendrierRepository.save(existing);
    }

    // ================================
    // HEURES PAR JOUR
    // ================================
    public double getHoursPerDay() {
        ParametreCalendrier cal = getCalendrier();
        long minutes = Duration
                .between(cal.getStartTime(), cal.getEndTime())
                .toMinutes();
        minutes -= cal.getLunchBreakMinutes();
        return Math.max(minutes / 60.0, 1);
    }

    // ================================
    // JOURS TRAVAILLES PAR SEMAINE
    // ================================
    public int getWorkingDaysPerWeek() {
        ParametreCalendrier cal = getCalendrier();
        int count = 0;
        if (Boolean.TRUE.equals(cal.getMonday()))    count++;
        if (Boolean.TRUE.equals(cal.getTuesday()))   count++;
        if (Boolean.TRUE.equals(cal.getWednesday())) count++;
        if (Boolean.TRUE.equals(cal.getThursday()))  count++;
        if (Boolean.TRUE.equals(cal.getFriday()))    count++;
        if (Boolean.TRUE.equals(cal.getSaturday()))  count++;
        if (Boolean.TRUE.equals(cal.getSunday()))    count++;
        return count;
    }

    // ================================
    // EST UN JOUR TRAVAILLE ?
    // ================================
    public boolean isWorkingDay(LocalDate date) {
        ParametreCalendrier cal = getCalendrier();
        List<JourFerie> holidays = jourFerieRepository.findAll();
        return isConfiguredWorkingDay(date, cal) && !isHoliday(date, holidays);
    }

    // ================================
    // EST UN JOUR CONFIGURE TRAVAILLE ?
    // ================================
    private boolean isConfiguredWorkingDay(LocalDate date, ParametreCalendrier cal) {
        DayOfWeek day = date.getDayOfWeek();
        return switch (day) {
            case MONDAY    -> Boolean.TRUE.equals(cal.getMonday());
            case TUESDAY   -> Boolean.TRUE.equals(cal.getTuesday());
            case WEDNESDAY -> Boolean.TRUE.equals(cal.getWednesday());
            case THURSDAY  -> Boolean.TRUE.equals(cal.getThursday());
            case FRIDAY    -> Boolean.TRUE.equals(cal.getFriday());
            case SATURDAY  -> Boolean.TRUE.equals(cal.getSaturday());
            case SUNDAY    -> Boolean.TRUE.equals(cal.getSunday());
        };
    }

    // ================================
    // EST UN JOUR FERIE ?
    // ================================
    public boolean isHoliday(LocalDate date) {
        List<JourFerie> holidays = jourFerieRepository.findAll();
        return isHoliday(date, holidays);
    }

    private boolean isHoliday(LocalDate date, List<JourFerie> holidays) {
        System.out.println(">>> Checking holiday for: " + date);
        System.out.println(">>> Holidays count: " + holidays.size());

        return holidays.stream().anyMatch(h -> {
            System.out.println(">>> Comparing with: " + h.getDate() + " recurrent=" + h.isRecurrentAnnuel());
            if (h.isRecurrentAnnuel()) {
                boolean match = h.getDate().getDayOfMonth() == date.getDayOfMonth()
                        && h.getDate().getMonth() == date.getMonth();
                System.out.println(">>> Match recurrent: " + match);
                return match;
            }
            boolean match = h.getDate().equals(date);
            System.out.println(">>> Match exact: " + match);
            return match;
        });
    }

    // ================================
    // CALCULER DATE FIN
    // ================================
    public LocalDate calculateEndDate(LocalDate startDate, double totalHours, double dailyCapacity) {
        LocalDate current = startDate;
        double remainingHours = totalHours;

        while (remainingHours > 0) {
            if (isWorkingDay(current)) {
                remainingHours -= dailyCapacity;
            }
            current = current.plusDays(1);
        }
        return current.minusDays(1);
    }
}
package tn.momsoft.back.service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.momsoft.back.entity.Afd;
import tn.momsoft.back.entity.FunctionalAnalysis;

import java.io.ByteArrayOutputStream;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PdfService {

    // ================================
    // PDF SINGLE AFD
    // ================================
    public byte[] generateAfdPdf(Afd afd) throws Exception {
        Document document = new Document(PageSize.A4, 50, 50, 50, 50);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, out);
        document.open();

        Font titleFont    = new Font(Font.FontFamily.HELVETICA, 20, Font.BOLD,   new BaseColor(37, 99, 235));
        Font subtitleFont = new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD,   new BaseColor(100, 116, 139));
        Font labelFont    = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD,   new BaseColor(55, 65, 81));
        Font valueFont    = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL, new BaseColor(31, 41, 55));

        Paragraph header = new Paragraph(afd.getCode(), titleFont);
        header.setAlignment(Element.ALIGN_LEFT);
        document.add(header);

        Paragraph intitule = new Paragraph(afd.getIntitule(), subtitleFont);
        intitule.setSpacingBefore(5);
        document.add(intitule);

        document.add(new Paragraph(" "));
        addSeparator(document);
        document.add(new Paragraph(" "));

        PdfPTable metaTable = new PdfPTable(4);
        metaTable.setWidthPercentage(100);
        metaTable.setWidths(new float[]{1, 2, 1, 2});
        addMetaCell(metaTable, "Statut",       afd.getStatut() != null ? afd.getStatut() : "-", labelFont, valueFont);
        addMetaCell(metaTable, "Validateur",   afd.getValidateur() != null && !afd.getValidateur().isEmpty() ? afd.getValidateur() : "-", labelFont, valueFont);
        addMetaCell(metaTable, "Dernière MAJ", afd.getDerniereMaj() != null ? afd.getDerniereMaj().toString() : "-", labelFont, valueFont);
        addMetaCell(metaTable, "Bloc",         afd.getBlock() != null ? afd.getBlock().getNom() : "-", labelFont, valueFont);
        document.add(metaTable);
        document.add(new Paragraph(" "));

        addSection(document, "Objectif",                  afd.getObjectif(),           labelFont, valueFont);
        addSection(document, "Description",               afd.getDescription(),         labelFont, valueFont);
        addSection(document, "Règles de gestion",         afd.getReglesGestion(),       labelFont, valueFont);
        addSection(document, "Flux nominal",              afd.getFluxNominal(),         labelFont, valueFont);
        addSection(document, "Cas alternatifs / erreurs", afd.getCasAlternatifs(),      labelFont, valueFont);
        addSection(document, "Données manipulées",        afd.getDonneesManipulees(),   labelFont, valueFont);
        addSection(document, "Critères d'acceptation",    afd.getCriteresAcceptation(), labelFont, valueFont);

        document.add(new Paragraph(" "));
        Paragraph footer = new Paragraph("Généré par MomSoft AI Driven Software Factory",
                new Font(Font.FontFamily.HELVETICA, 8, Font.ITALIC, new BaseColor(156, 163, 175)));
        footer.setAlignment(Element.ALIGN_CENTER);
        document.add(footer);

        document.close();
        return out.toByteArray();
    }

    // ================================
    // PDF CAHIER DES AFDs
    // ================================
    public byte[] generateCahierAfdsPdf(FunctionalAnalysis analysis, List<Afd> afds) throws Exception {
        Document document = new Document(PageSize.A4, 50, 50, 50, 50);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, out);
        document.open();

        Font titleFont    = new Font(Font.FontFamily.HELVETICA, 24, Font.BOLD,   new BaseColor(37, 99, 235));
        Font subtitleFont = new Font(Font.FontFamily.HELVETICA, 12, Font.NORMAL, new BaseColor(100, 116, 139));
        Font h1Font       = new Font(Font.FontFamily.HELVETICA, 16, Font.BOLD,   new BaseColor(37, 99, 235));
        Font h2Font       = new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD,   new BaseColor(55, 65, 81));
        Font labelFont    = new Font(Font.FontFamily.HELVETICA, 9,  Font.BOLD,   new BaseColor(107, 114, 128));
        Font valueFont    = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL, new BaseColor(31, 41, 55));
        Font footerFont   = new Font(Font.FontFamily.HELVETICA, 8,  Font.ITALIC, new BaseColor(156, 163, 175));

        // Page de couverture
        document.add(new Paragraph(" "));
        document.add(new Paragraph(" "));
        document.add(new Paragraph(" "));

        Paragraph title = new Paragraph("Cahier des AFDs", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);

        document.add(new Paragraph(" "));

        Paragraph analysisCode = new Paragraph(analysis.getCode(),
                new Font(Font.FontFamily.HELVETICA, 18, Font.BOLD, new BaseColor(55, 65, 81)));
        analysisCode.setAlignment(Element.ALIGN_CENTER);
        document.add(analysisCode);

        document.add(new Paragraph(" "));

        if (analysis.getProjet() != null) {
            Paragraph projetInfo = new Paragraph("Projet : " + analysis.getProjet().getNom(), subtitleFont);
            projetInfo.setAlignment(Element.ALIGN_CENTER);
            document.add(projetInfo);

            Paragraph clientInfo = new Paragraph("Client : " +
                    (analysis.getProjet().getClient() != null ? analysis.getProjet().getClient() : "-"), subtitleFont);
            clientInfo.setAlignment(Element.ALIGN_CENTER);
            document.add(clientInfo);
        }

        document.add(new Paragraph(" "));
        Paragraph dateInfo = new Paragraph("Date : " + java.time.LocalDate.now().toString(), subtitleFont);
        dateInfo.setAlignment(Element.ALIGN_CENTER);
        document.add(dateInfo);

        Paragraph nbAfds = new Paragraph(afds.size() + " AFD(s) générée(s)", subtitleFont);
        nbAfds.setAlignment(Element.ALIGN_CENTER);
        document.add(nbAfds);

        document.add(new Paragraph(" "));
        addSeparator(document);

        // Sommaire
        document.add(new Paragraph(" "));
        Paragraph sommaire = new Paragraph("Sommaire", h1Font);
        document.add(sommaire);
        document.add(new Paragraph(" "));

        for (int i = 0; i < afds.size(); i++) {
            Afd afd = afds.get(i);
            Paragraph item = new Paragraph((i + 1) + ".  " + afd.getCode() + " — " + afd.getIntitule(), valueFont);
            item.setIndentationLeft(10);
            document.add(item);
        }

        // AFDs
        for (Afd afd : afds) {
            document.newPage();

            Paragraph afdTitle = new Paragraph(afd.getCode(), h1Font);
            document.add(afdTitle);

            Paragraph afdIntitule = new Paragraph(afd.getIntitule(),
                    new Font(Font.FontFamily.HELVETICA, 13, Font.BOLD, new BaseColor(55, 65, 81)));
            afdIntitule.setSpacingBefore(5);
            document.add(afdIntitule);

            document.add(new Paragraph(" "));
            addSeparator(document);
            document.add(new Paragraph(" "));

            PdfPTable metaTable = new PdfPTable(4);
            metaTable.setWidthPercentage(100);
            metaTable.setWidths(new float[]{1, 2, 1, 2});
            addMetaCell(metaTable, "Statut",       afd.getStatut() != null ? afd.getStatut() : "-", labelFont, valueFont);
            addMetaCell(metaTable, "Validateur",   afd.getValidateur() != null && !afd.getValidateur().isEmpty() ? afd.getValidateur() : "-", labelFont, valueFont);
            addMetaCell(metaTable, "Bloc",         afd.getBlock() != null ? afd.getBlock().getNom() : "-", labelFont, valueFont);
            addMetaCell(metaTable, "Dernière MAJ", afd.getDerniereMaj() != null ? afd.getDerniereMaj().toString() : "-", labelFont, valueFont);
            document.add(metaTable);
            document.add(new Paragraph(" "));

            addSection(document, "Objectif",                  afd.getObjectif(),           h2Font, valueFont);
            addSection(document, "Description",               afd.getDescription(),         h2Font, valueFont);
            addSection(document, "Règles de gestion",         afd.getReglesGestion(),       h2Font, valueFont);
            addSection(document, "Flux nominal",              afd.getFluxNominal(),         h2Font, valueFont);
            addSection(document, "Cas alternatifs / erreurs", afd.getCasAlternatifs(),      h2Font, valueFont);
            addSection(document, "Données manipulées",        afd.getDonneesManipulees(),   h2Font, valueFont);
            addSection(document, "Critères d'acceptation",    afd.getCriteresAcceptation(), h2Font, valueFont);

            document.add(new Paragraph(" "));
            Paragraph footer = new Paragraph("MomSoft AI Driven Software Factory — " + analysis.getCode(), footerFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);
        }

        document.close();
        return out.toByteArray();
    }

    // ================================
    // MÉTHODES COMMUNES
    // ================================
    private void addSeparator(Document doc) throws DocumentException {
        PdfPTable separator = new PdfPTable(1);
        separator.setWidthPercentage(100);
        PdfPCell sepCell = new PdfPCell();
        sepCell.setBackgroundColor(new BaseColor(226, 232, 240));
        sepCell.setFixedHeight(1);
        sepCell.setBorder(Rectangle.NO_BORDER);
        separator.addCell(sepCell);
        doc.add(separator);
    }

    private void addSection(Document doc, String title, String content,
                            Font titleFont, Font valueFont) throws DocumentException {
        if (content == null || content.trim().isEmpty()) return;
        Paragraph titlePara = new Paragraph(title, titleFont);
        titlePara.setSpacingBefore(10);
        doc.add(titlePara);
        Paragraph contentPara = new Paragraph(content, valueFont);
        contentPara.setIndentationLeft(10);
        contentPara.setSpacingBefore(3);
        doc.add(contentPara);
    }

    private void addMetaCell(PdfPTable table, String label, String value,
                             Font labelFont, Font valueFont) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, labelFont));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setPadding(5);
        table.addCell(labelCell);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, valueFont));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setPadding(5);
        table.addCell(valueCell);
    }
}
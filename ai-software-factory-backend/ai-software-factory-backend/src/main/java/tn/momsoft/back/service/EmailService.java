package tn.momsoft.back.service;
// EmailService.java

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async // ← non bloquant
    public void sendWelcomeEmail(String toEmail, String firstName,
                                 String lastName, String password,
                                 String role) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message, true, "UTF-8"
            );

            helper.setFrom(fromEmail, "MOMsoft IA Software Factory");
            helper.setTo(toEmail);
            helper.setSubject("Bienvenue sur MOMsoft — Vos identifiants");
            helper.setText(buildEmailHtml(
                    firstName, lastName, toEmail, password, role
            ), true); // true = HTML

            mailSender.send(message);
            log.info("✅ Email envoyé à {}", toEmail);

        } catch (Exception e) {
            log.error("❌ Erreur envoi email à {}: {}", toEmail, e.getMessage());
        }
    }

    private String buildEmailHtml(String firstName, String lastName,
                                  String email, String password,
                                  String role) {
        return """
            <div style="font-family:Arial,sans-serif;max-width:600px;
                        margin:0 auto;padding:20px">

              <div style="text-align:center;margin-bottom:24px">
                <h1 style="color:#1e3a5f;font-size:22px;margin:0">MOMsoft</h1>
                <p style="color:#6b7280;font-size:13px">IA Software Factory</p>
              </div>

              <h2 style="color:#1e293b;font-size:18px">
                Bienvenue, %s %s 👋
              </h2>

              <p style="color:#374151;font-size:14px">
                Votre compte a été créé. Voici vos identifiants :
              </p>

              <div style="background:#f8fafc;border:1px solid #e2e8f0;
                          border-radius:8px;padding:20px;margin:20px 0">
                <table style="width:100%%;font-size:14px">
                  <tr>
                    <td style="color:#6b7280;padding:8px 0;width:160px">
                      Email
                    </td>
                    <td style="font-weight:600;color:#1e293b">%s</td>
                  </tr>
                  <tr>
                    <td style="color:#6b7280;padding:8px 0">
                      Mot de passe temporaire
                    </td>
                    <td>
                      <code style="background:#e2e8f0;padding:4px 12px;
                                   border-radius:4px;font-size:16px;
                                   font-weight:bold;color:#1e293b;
                                   letter-spacing:2px">
                        %s
                      </code>
                    </td>
                  </tr>
                  <tr>
                    <td style="color:#6b7280;padding:8px 0">Rôle</td>
                    <td style="font-weight:600;color:#2563eb">%s</td>
                  </tr>
                </table>
              </div>

              <div style="background:#fef3c7;border:1px solid #f59e0b;
                          border-radius:6px;padding:14px;margin-bottom:24px">
                <p style="margin:0;font-size:13px;color:#92400e">
                  ⚠️ <strong>Ce mot de passe est temporaire.</strong>
                  Vous serez invité à le changer lors de votre
                  première connexion.
                </p>
              </div>

              <div style="text-align:center;margin:24px 0">
                <a href="http://localhost:4200/login"
                   style="background:#2563eb;color:white;
                          padding:12px 32px;border-radius:6px;
                          text-decoration:none;font-size:14px;
                          font-weight:600;display:inline-block">
                  Accéder à l'application →
                </a>
              </div>

              <p style="color:#9ca3af;font-size:12px;
                        text-align:center;margin-top:32px">
                Si vous n'attendiez pas cet email, ignorez-le.
              </p>
            </div>
            """.formatted(firstName, lastName, email, password, role);
    }
}
package com.barber.resevation.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
public class WhatsAppNotificationService {

    @Value("${twilio.account.sid}")
    private String accountSid;

    @Value("${twilio.auth.token}")
    private String authToken;

    @Value("${twilio.whatsapp.from}")
    private String fromNumber;

    @Value("${twilio.content.sid}")
    private String contentSid;

    public void sendAppointmentConfirmation(String toPhoneNumber) {
        String url = "https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json";
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.setBasicAuth(accountSid, authToken);

        // --- TELEFON NUMARASI FORMATLAMA ---
        String formattedNumber = toPhoneNumber.trim();
        // Eğer numara 0 ile başlıyorsa (Örn: 0538...), 0'ı at ve +90 ekle
        if (formattedNumber.startsWith("0")) {
            formattedNumber = "+90" + formattedNumber.substring(1);
        }
        // Eğer başında + yoksa (Örn: 90538... veya 538...), + ekle
        else if (!formattedNumber.startsWith("+")) {
            // Eğer 90 ile başlamıyorsa 90 ekleyelim, başlıyorsa sadece + koyalım
            if (!formattedNumber.startsWith("90")) {
                formattedNumber = "+90" + formattedNumber;
            } else {
                formattedNumber = "+" + formattedNumber;
            }
        }

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("From", fromNumber);
        // Artık temizlenmiş ve formatlanmış numarayı yolluyoruz
        body.add("To", "whatsapp:" + formattedNumber);
        body.add("ContentSid", contentSid);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        try {
            String response = restTemplate.postForObject(url, request, String.class);
            log.info("WhatsApp mesajı başarıyla gönderildi: {}", response);
        } catch (Exception e) {
            log.error("WhatsApp mesajı gönderilirken hata oluştu: {}", e.getMessage());
        }
    }

    public void sendAppointmentCancellation(String toPhoneNumber) {
        String url = "https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json";
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.setBasicAuth(accountSid, authToken);

        // --- TELEFON NUMARASI FORMATLAMA ---
        String formattedNumber = toPhoneNumber.trim();
        if (formattedNumber.startsWith("0")) {
            formattedNumber = "+90" + formattedNumber.substring(1);
        } else if (!formattedNumber.startsWith("+")) {
            if (!formattedNumber.startsWith("90")) {
                formattedNumber = "+90" + formattedNumber;
            } else {
                formattedNumber = "+" + formattedNumber;
            }
        }

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("From", fromNumber);
        body.add("To", "whatsapp:" + formattedNumber);
        body.add("ContentSid", contentSid);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        try {
            String response = restTemplate.postForObject(url, request, String.class);
            log.info("İptal WhatsApp mesajı başarıyla gönderildi: {}", response);
        } catch (Exception e) {
            log.error("İptal WhatsApp mesajı gönderilirken bilinmeyen hata: {}", e.getMessage());
        }
    }
}
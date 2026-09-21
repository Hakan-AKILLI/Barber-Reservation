package com.barber.resevation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BarberResevationApplication {

    public static void main(String[] args) {
        SpringApplication.run(BarberResevationApplication.class, args);
    }

}

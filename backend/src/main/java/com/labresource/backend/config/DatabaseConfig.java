package com.labresource.backend.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.net.URI;
import java.net.URISyntaxException;

/**
 * Converts Render's postgres:// DATABASE_URL into spring.datasource.* system properties
 * before Spring's DataSource auto-configuration runs.
 *
 * Render injects DATABASE_URL in the format:
 *   postgres://user:password@host:port/database
 *
 * Spring Boot's DataSource auto-configuration expects:
 *   spring.datasource.url=jdbc:postgresql://host:port/database
 *   spring.datasource.username=user
 *   spring.datasource.password=password
 */
@Slf4j
@Configuration
public class DatabaseConfig {

    static {
        convertRenderDatabaseUrl();
    }

    @PostConstruct
    public void init() {
        // Ensures the static block is triggered if beans are already processed
    }

    /**
     * If DATABASE_URL or DB_URL environment variable is set in raw postgres:// or postgresql:// format,
     * parse and convert to standard spring.datasource.* JDBC properties.
     */
    public static void convertRenderDatabaseUrl() {
        String databaseUrl = System.getenv("DATABASE_URL");
        if (databaseUrl == null || databaseUrl.isBlank()) {
            databaseUrl = System.getenv("DB_URL");
        }
        if (databaseUrl == null || databaseUrl.isBlank()) {
            return; // Use application.properties defaults
        }

        databaseUrl = databaseUrl.trim();

        try {
            if (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://")) {
                String normalized = databaseUrl.startsWith("postgres://")
                        ? databaseUrl.replaceFirst("postgres://", "postgresql://")
                        : databaseUrl;
                URI dbUri = new URI(normalized);

                String userInfo = dbUri.getUserInfo();
                String username = "";
                String password = "";
                if (userInfo != null && userInfo.contains(":")) {
                    String[] parts = userInfo.split(":", 2);
                    username = parts[0];
                    password = parts[1];
                } else if (userInfo != null) {
                    username = userInfo;
                }

                // If DB_USERNAME / DB_PASSWORD env vars are set, prefer them if userInfo was empty
                if (username.isEmpty() && System.getenv("DB_USERNAME") != null) {
                    username = System.getenv("DB_USERNAME");
                }
                if (password.isEmpty() && System.getenv("DB_PASSWORD") != null) {
                    password = System.getenv("DB_PASSWORD");
                }

                int port = dbUri.getPort() != -1 ? dbUri.getPort() : 5432;
                String path = dbUri.getPath();
                String dbName = (path != null && path.startsWith("/")) ? path.substring(1) : (path != null ? path : "");
                String jdbcUrl = String.format("jdbc:postgresql://%s:%d/%s?sslmode=require", dbUri.getHost(), port, dbName);

                System.setProperty("spring.datasource.url", jdbcUrl);
                if (!username.isEmpty()) {
                    System.setProperty("spring.datasource.username", username);
                }
                if (!password.isEmpty()) {
                    System.setProperty("spring.datasource.password", password);
                }
                System.setProperty("spring.datasource.driver-class-name", "org.postgresql.Driver");
                System.setProperty("spring.jpa.properties.hibernate.dialect", "org.hibernate.dialect.PostgreSQLDialect");

                log.info("DatabaseConfig: Successfully converted postgres URI to JDBC (host={}, db={})", dbUri.getHost(), dbName);
            } else if (databaseUrl.startsWith("jdbc:")) {
                System.setProperty("spring.datasource.url", databaseUrl);
                log.info("DatabaseConfig: Using JDBC URL from environment variable");
            }
        } catch (URISyntaxException e) {
            log.error("DatabaseConfig: Failed to parse database URL '{}': {}", databaseUrl, e.getMessage());
        }
    }
}

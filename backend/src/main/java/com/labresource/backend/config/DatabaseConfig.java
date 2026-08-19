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
     * If the DATABASE_URL environment variable (Render's format) is set,
     * parse it and set system properties so Spring Boot auto-configuration picks them up.
     */
    public static void convertRenderDatabaseUrl() {
        String databaseUrl = System.getenv("DATABASE_URL");
        if (databaseUrl == null || databaseUrl.isBlank()) {
            return; // No Render DATABASE_URL — use application.properties defaults
        }

        try {
            URI dbUri;
            if (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://")) {
                String normalized = databaseUrl.replace("postgres://", "postgresql://");
                dbUri = new URI(normalized);
            } else if (databaseUrl.startsWith("jdbc:")) {
                // Already a JDBC URL — just set it directly
                System.setProperty("spring.datasource.url", databaseUrl);
                log.info("DatabaseConfig: Using JDBC URL from DATABASE_URL env var");
                return;
            } else {
                log.warn("DatabaseConfig: Unrecognised DATABASE_URL format, skipping conversion");
                return;
            }

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

            int port = dbUri.getPort() != -1 ? dbUri.getPort() : 5432;
            String path = dbUri.getPath();
            String dbName = (path != null && path.startsWith("/")) ? path.substring(1) : path;
            String jdbcUrl = String.format("jdbc:postgresql://%s:%d/%s?sslmode=require", dbUri.getHost(), port, dbName);

            System.setProperty("spring.datasource.url", jdbcUrl);
            System.setProperty("spring.datasource.username", username);
            System.setProperty("spring.datasource.password", password);
            System.setProperty("spring.datasource.driver-class-name", "org.postgresql.Driver");
            System.setProperty("spring.jpa.properties.hibernate.dialect", "org.hibernate.dialect.PostgreSQLDialect");

            log.info("DatabaseConfig: Configured PostgreSQL from DATABASE_URL (host={}, db={})", dbUri.getHost(), dbName);
        } catch (URISyntaxException e) {
            log.error("DatabaseConfig: Failed to parse DATABASE_URL '{}': {}", databaseUrl, e.getMessage());
        }
    }
}

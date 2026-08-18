package com.labresource.backend.storage;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryUploadResult uploadFile(MultipartFile file, String folder) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String contentType = file.getContentType();
        long size = file.getSize();

        log.info("Uploading file to Cloudinary. Name: {}, Content-Type: {}, Size: {}", originalFilename, contentType, size);

        // Fallback check if Cloudinary is not fully configured
        if (cloudinary.config.cloudName == null || cloudinary.config.cloudName.isBlank()) {
            log.warn("Cloudinary cloud name is not configured. Simulating successful upload.");
            String dummyId = "dummy_folder/" + UUID.randomUUID().toString();
            return CloudinaryUploadResult.builder()
                    .publicId(dummyId)
                    .secureUrl("https://res.cloudinary.com/demo/image/upload/" + dummyId)
                    .fileName(originalFilename)
                    .contentType(contentType)
                    .fileSize(size)
                    .build();
        }

        try {
            Map<?, ?> options = ObjectUtils.asMap(
                    "folder", folder,
                    "resource_type", "auto"
            );
            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), options);

            String publicId = (String) uploadResult.get("public_id");
            String secureUrl = (String) uploadResult.get("secure_url");

            return CloudinaryUploadResult.builder()
                    .publicId(publicId)
                    .secureUrl(secureUrl)
                    .fileName(originalFilename)
                    .contentType(contentType)
                    .fileSize(size)
                    .build();
        } catch (Exception e) {
            log.error("Cloudinary upload failed: {}", e.getMessage(), e);
            throw new IOException("Failed to upload file to Cloudinary: " + e.getMessage(), e);
        }
    }

    public void deleteFile(String publicId) throws IOException {
        if (publicId == null || publicId.isBlank() || publicId.startsWith("dummy")) {
            return;
        }
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (Exception e) {
            log.error("Cloudinary deletion failed: {}", e.getMessage(), e);
            throw new IOException("Failed to delete file from Cloudinary: " + e.getMessage(), e);
        }
    }
}

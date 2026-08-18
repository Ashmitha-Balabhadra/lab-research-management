package com.labresource.backend.storage;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@RequiredArgsConstructor
public class StorageService {

    private final CloudinaryService cloudinaryService;

    public CloudinaryUploadResult upload(MultipartFile file, String folder) throws IOException {
        return cloudinaryService.uploadFile(file, folder);
    }

    public void delete(String publicId) throws IOException {
        cloudinaryService.deleteFile(publicId);
    }
}

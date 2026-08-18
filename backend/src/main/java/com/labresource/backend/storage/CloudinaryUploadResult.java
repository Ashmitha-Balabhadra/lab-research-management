package com.labresource.backend.storage;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CloudinaryUploadResult {
    private String publicId;
    private String secureUrl;
    private String fileName;
    private String contentType;
    private Long fileSize;
}

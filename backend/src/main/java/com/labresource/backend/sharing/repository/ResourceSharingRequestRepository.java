package com.labresource.backend.sharing.repository;

import com.labresource.backend.sharing.entity.ResourceSharingRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResourceSharingRequestRepository extends JpaRepository<ResourceSharingRequest, Long> {
    List<ResourceSharingRequest> findByOwningInstitutionIdOrderByCreatedAtDesc(Long owningInstitutionId);
    List<ResourceSharingRequest> findByRequestingInstitutionIdOrderByCreatedAtDesc(Long requestingInstitutionId);
}

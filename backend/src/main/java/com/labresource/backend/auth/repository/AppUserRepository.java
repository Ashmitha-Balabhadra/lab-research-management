package com.labresource.backend.auth.repository;

import com.labresource.backend.auth.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByEmail(String email);
    boolean existsByEmail(String email);

    @Query("SELECT u FROM AppUser u JOIN u.roles r WHERE r.roleName = :roleName AND u.departmentId = :departmentId")
    List<AppUser> findByRoleNameAndDepartmentId(@Param("roleName") String roleName, @Param("departmentId") Long departmentId);

    @Query("SELECT u FROM AppUser u JOIN u.roles r WHERE r.roleName = :roleName")
    List<AppUser> findByRoleName(@Param("roleName") String roleName);

    @Query("SELECT u FROM AppUser u JOIN u.roles r WHERE r.roleName = :roleName AND u.institutionId = :institutionId")
    List<AppUser> findByRoleNameAndInstitutionId(@Param("roleName") String roleName, @Param("institutionId") Long institutionId);
}

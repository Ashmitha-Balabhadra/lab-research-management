package com.labresource.backend.security;

import com.labresource.backend.auth.entity.AppUser;
import com.labresource.backend.permission.entity.Permission;
import com.labresource.backend.role.entity.Role;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Wraps AppUser for Spring Security. Authorities = the union of all
 * permission_name values reachable through AppUser -> Role -> Permission,
 * so that @PreAuthorize("hasAuthority('BOOK_EQUIPMENT')") works directly
 * against the RBAC tables (Role / Permission / RolePermission / UserRole).
 */
public class UserPrincipal implements UserDetails {

    private final Long userId;
    private final String email;
    private final String passwordHash;
    private final Long institutionId;
    private final Long departmentId;
    private final boolean active;
    private final List<String> roleNames;
    private final List<GrantedAuthority> authorities;

    public UserPrincipal(AppUser user) {
        this.userId = user.getUserId();
        this.email = user.getEmail();
        this.passwordHash = user.getPasswordHash();
        this.institutionId = user.getInstitutionId();
        this.departmentId = user.getDepartmentId();
        this.active = Boolean.TRUE.equals(user.getIsActive());
        this.roleNames = user.getRoles().stream().map(Role::getRoleName).collect(Collectors.toList());
        
        List<GrantedAuthority> authList = new java.util.ArrayList<>();
        for (Role r : user.getRoles()) {
            authList.add(new SimpleGrantedAuthority(r.getRoleName()));
            authList.add(new SimpleGrantedAuthority("ROLE_" + r.getRoleName()));
            for (Permission p : r.getPermissions()) {
                authList.add(new SimpleGrantedAuthority(p.getPermissionName()));
            }
        }
        this.authorities = authList.stream().distinct().collect(Collectors.toList());
    }

    public Long getUserId() { return userId; }
    public Long getInstitutionId() { return institutionId; }
    public Long getDepartmentId() { return departmentId; }
    public List<String> getRoleNames() { return roleNames; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }

    @Override
    public String getPassword() { return passwordHash; }

    @Override
    public String getUsername() { return email; }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return active; }
}

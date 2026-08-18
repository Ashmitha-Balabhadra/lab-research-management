package com.labresource.backend.role.entity;

import com.labresource.backend.permission.entity.Permission;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "Role")
@Getter
@Setter
@NoArgsConstructor
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "role_id")
    private Long roleId;

    @Column(name = "role_name", nullable = false, unique = true, length = 50)
    private String roleName;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "RolePermission",
            joinColumns = @JoinColumn(name = "role_id"),
            inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    private Set<Permission> permissions = new HashSet<>();

    public static final String RESEARCHER = "RESEARCHER";
    public static final String LAB_TECHNICIAN = "LAB_TECHNICIAN";
    public static final String LAB_MANAGER = "LAB_MANAGER";
    public static final String DEPARTMENT_HEAD = "DEPARTMENT_HEAD";
    public static final String INSTITUTION_ADMIN = "INSTITUTION_ADMIN";
    public static final String SYSTEM_ADMIN = "SYSTEM_ADMIN";
}

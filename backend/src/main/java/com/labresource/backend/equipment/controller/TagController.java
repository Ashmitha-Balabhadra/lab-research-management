package com.labresource.backend.equipment.controller;

import com.labresource.backend.equipment.entity.Tag;
import com.labresource.backend.equipment.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagRepository tagRepository;

    @GetMapping
    @PreAuthorize("hasAuthority('VIEW_EQUIPMENT')")
    public List<Tag> getAll() {
        return tagRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('MANAGE_EQUIPMENT')")
    public Tag create(@RequestBody Tag tag) {
        return tagRepository.save(tag);
    }
}

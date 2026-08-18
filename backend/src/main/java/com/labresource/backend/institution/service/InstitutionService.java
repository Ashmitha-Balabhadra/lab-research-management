package com.labresource.backend.institution.service;

import com.labresource.backend.common.exception.ApiException;
import com.labresource.backend.institution.dto.InstitutionDto;
import com.labresource.backend.institution.entity.Institution;
import com.labresource.backend.institution.repository.InstitutionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InstitutionService {

    private final InstitutionRepository institutionRepository;

    public List<InstitutionDto> getAll() {
        return institutionRepository.findAll().stream()
                .map(InstitutionDto::fromEntity)
                .toList();
    }

    public InstitutionDto getById(Long id) {
        Institution inst = institutionRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Institution not found."));
        return InstitutionDto.fromEntity(inst);
    }

    public Institution getEntity(Long id) {
        return institutionRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Institution not found."));
    }

    @Transactional
    public InstitutionDto create(InstitutionDto dto) {
        Institution inst = new Institution();
        inst.setName(dto.getName());
        inst.setAddress(dto.getAddress());
        inst.setCity(dto.getCity());
        inst.setState(dto.getState());
        inst.setCountry(dto.getCountry());
        inst.setContactPhone(dto.getContactPhone());
        inst.setContactEmail(dto.getContactEmail());
        inst.setIsActive(true);
        return InstitutionDto.fromEntity(institutionRepository.save(inst));
    }

    @Transactional
    public InstitutionDto update(Long id, InstitutionDto dto) {
        Institution inst = getEntity(id);
        inst.setName(dto.getName());
        inst.setAddress(dto.getAddress());
        inst.setCity(dto.getCity());
        inst.setState(dto.getState());
        inst.setCountry(dto.getCountry());
        inst.setContactPhone(dto.getContactPhone());
        inst.setContactEmail(dto.getContactEmail());
        return InstitutionDto.fromEntity(institutionRepository.save(inst));
    }

    @Transactional
    public void delete(Long id) {
        Institution inst = getEntity(id);
        inst.setIsActive(false);
        institutionRepository.save(inst);
    }
}

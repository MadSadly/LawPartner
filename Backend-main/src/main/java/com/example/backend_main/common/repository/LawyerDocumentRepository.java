package com.example.backend_main.common.repository;

import com.example.backend_main.common.entity.LawyerDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LawyerDocumentRepository extends JpaRepository<LawyerDocument, Long> {

    List<LawyerDocument> findByUser_UserNo(Long userNo);

}

package com.example.backend_main.common.repository;

import com.example.backend_main.common.entity.BannedWord;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BannedWordRepository extends JpaRepository<BannedWord, Long> {
    boolean existsByWord(String word);
}
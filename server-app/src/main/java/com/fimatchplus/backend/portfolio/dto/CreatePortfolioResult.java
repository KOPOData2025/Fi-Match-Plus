package com.fimatchplus.backend.portfolio.dto;

public record CreatePortfolioResult (
        Long portfolioId,
        String name,
        String description,
        String ruleId,
        Double totalValue,
        Integer holdingCount,
        String status
) {}
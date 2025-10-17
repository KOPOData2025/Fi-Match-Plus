package com.fimatchplus.backend.product.service;

import com.fimatchplus.backend.common.exception.ResourceNotFoundException;
import com.fimatchplus.backend.product.domain.Product;
import com.fimatchplus.backend.product.dto.ProductDetailResponse;
import com.fimatchplus.backend.product.dto.ProductListResponse;
import com.fimatchplus.backend.product.dto.ProductSummary;
import com.fimatchplus.backend.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;

    public ProductListResponse getAllProducts() {
        List<ProductSummary> products = productRepository.findAll()
                .stream()
                .map(ProductSummary::from)
                .toList();

        log.info("Retrieved {} products", products.size());
        return ProductListResponse.of(products);
    }

    public ProductDetailResponse getProductById(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        log.info("Retrieved product detail for id: {}", productId);
        return ProductDetailResponse.from(product);
    }
}


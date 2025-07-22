package org.lamisplus.modules.consultation.domain.dto;


import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ApiResponse {
    private int statusCode;
    private String message;
    private Object data;
}


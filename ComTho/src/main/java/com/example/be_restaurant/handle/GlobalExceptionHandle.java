package com.example.be_restaurant.handle;

import com.example.be_restaurant.bean.response.ErrorResponse;
import com.example.be_restaurant.exception.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandle {
    @ExceptionHandler(NotFoundException.class)
    public void handleNotFound(NotFoundException e, HttpServletResponse response) throws IOException {
        log.warn("GlobalExceptionHandle.handleNotFound key={} message={}", e.getKey(), e.getMessage());
        ErrorResponse error = new ErrorResponse(HttpStatus.NOT_FOUND, e.getKey(), e.getMessage());
        response.setStatus(HttpStatus.NOT_FOUND.value());
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        new ObjectMapper().writeValue(response.getWriter(), error);
    }

    @ExceptionHandler(IncorrectEmailOrPassword.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleIncorrectEmailOrPassword(IncorrectEmailOrPassword e) {
        return new ErrorResponse(HttpStatus.BAD_REQUEST, e.getKey(), e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public List<ErrorResponse> handleMethodArgumentNotValidException(MethodArgumentNotValidException e) {
        List<ErrorResponse> errors = new ArrayList<>();
        e.getBindingResult().getAllErrors().forEach((error) -> errors.add(new ErrorResponse(HttpStatus.BAD_REQUEST, ((FieldError) error).getField(), error.getDefaultMessage())));
        return errors;
    }


    @ExceptionHandler(EmptyException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handEmptyException(EmptyException e) {
        return new ErrorResponse(HttpStatus.BAD_REQUEST, e.getKey(), e.getMessage());
    }


    @ExceptionHandler(AlreadyExistException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleAlreadyExistException(AlreadyExistException e) {
        return new ErrorResponse(HttpStatus.BAD_REQUEST, e.getKey(), e.getMessage());
    }

    @ExceptionHandler(AuthenticatedException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ErrorResponse handleAuthenticationCredentialsNotFoundException(AuthenticatedException e) {
        return new ErrorResponse(HttpStatus.BAD_REQUEST, e.getKey(), e.getMessage());
    }

    @ExceptionHandler(InvalidQuantityException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleInvalidQuantityException(InvalidQuantityException e) {
        return new ErrorResponse(HttpStatus.BAD_REQUEST, e.getKey(), e.getMessage());
    }

    @ExceptionHandler(InvalidTimeException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleInvalidTimeException(InvalidTimeException e) {
        return new ErrorResponse(HttpStatus.BAD_REQUEST, e.getKey(), e.getMessage());
    }
}
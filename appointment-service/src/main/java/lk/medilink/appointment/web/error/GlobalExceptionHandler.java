package lk.medilink.appointment.web.error;

import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {
	@ExceptionHandler(MethodArgumentNotValidException.class)
	@ResponseStatus(HttpStatus.BAD_REQUEST)
	public ApiError handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
		List<ApiError.Violation> violations = ex.getBindingResult()
				.getFieldErrors()
				.stream()
				.map(err -> new ApiError.Violation(err.getField(), err.getDefaultMessage()))
				.toList();
		return new ApiError("Validation failed", violations);
	}

	@ExceptionHandler(ConstraintViolationException.class)
	@ResponseStatus(HttpStatus.BAD_REQUEST)
	public ApiError handleConstraintViolation(ConstraintViolationException ex) {
		List<ApiError.Violation> violations = ex.getConstraintViolations()
				.stream()
				.map(v -> new ApiError.Violation(v.getPropertyPath().toString(), v.getMessage()))
				.toList();
		return new ApiError("Validation failed", violations);
	}

	@ExceptionHandler(MissingRequestHeaderException.class)
	@ResponseStatus(HttpStatus.BAD_REQUEST)
	public ApiError handleMissingHeader(MissingRequestHeaderException ex) {
		return new ApiError(ex.getMessage(), List.of());
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	@ResponseStatus(HttpStatus.BAD_REQUEST)
	public ApiError handleNotReadable(HttpMessageNotReadableException ex) {
		return new ApiError("Request body is missing or invalid JSON", List.of());
	}
}

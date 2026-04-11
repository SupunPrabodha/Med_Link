package lk.medilink.patient.web.error;

import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {
	@ExceptionHandler(MethodArgumentNotValidException.class)
	@ResponseStatus(HttpStatus.BAD_REQUEST)
	public ApiError onInvalid(MethodArgumentNotValidException ex) {
		var violations = ex.getBindingResult().getFieldErrors().stream()
				.map(fe -> new ApiError.Violation(fe.getField(), fe.getDefaultMessage()))
				.toList();
		return new ApiError("Validation failed", violations);
	}

	@ExceptionHandler(ConstraintViolationException.class)
	@ResponseStatus(HttpStatus.BAD_REQUEST)
	public ApiError onConstraint(ConstraintViolationException ex) {
		List<ApiError.Violation> v = ex.getConstraintViolations().stream()
				.map(cv -> new ApiError.Violation(cv.getPropertyPath().toString(), cv.getMessage()))
				.toList();
		return new ApiError("Validation failed", v);
	}

	@ExceptionHandler(MissingRequestHeaderException.class)
	@ResponseStatus(HttpStatus.BAD_REQUEST)
	public ApiError onMissingHeader(MissingRequestHeaderException ex) {
		return new ApiError(ex.getMessage(), List.of());
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	@ResponseStatus(HttpStatus.BAD_REQUEST)
	public ApiError onBadJson() {
		return new ApiError("Request body is missing or invalid JSON", List.of());
	}

	@ExceptionHandler(MaxUploadSizeExceededException.class)
	@ResponseStatus(HttpStatus.BAD_REQUEST)
	public ApiError onTooLarge() {
		return new ApiError("Uploaded file is too large", List.of());
	}
}

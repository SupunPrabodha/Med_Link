# syntax=docker/dockerfile:1.7

# Build a single service module from the Maven multi-module repo.
# Usage (via docker compose build arg):
#   docker build --build-arg MODULE=auth-service -t medilink/auth-service:0.1.0 .

FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /workspace

ARG MODULE

# Copy POMs first to maximize build cache for dependency resolution
COPY pom.xml ./
COPY api-gateway/pom.xml api-gateway/pom.xml
COPY auth-service/pom.xml auth-service/pom.xml
COPY appointment-service/pom.xml appointment-service/pom.xml
COPY doctor-service/pom.xml doctor-service/pom.xml
COPY notification-service/pom.xml notification-service/pom.xml
COPY patient-service/pom.xml patient-service/pom.xml
COPY payment-service/pom.xml payment-service/pom.xml
COPY telemedicine-service/pom.xml telemedicine-service/pom.xml
COPY prescription-service/pom.xml prescription-service/pom.xml
COPY service-discovery/pom.xml service-discovery/pom.xml
COPY common/pom.xml common/pom.xml

# Pre-fetch dependencies for the selected module (and its dependencies)
# Best-effort only: this step is an optimization for Docker layer caching.
RUN --mount=type=cache,target=/root/.m2,sharing=locked \
  test -n "$MODULE" \
  && i=1 \
  && while [ $i -le 3 ]; do \
    mvn -q -DskipTests -pl "$MODULE" -am -Dstyle.color=never --no-transfer-progress dependency:go-offline \
      && exit 0; \
    echo "Maven dependency:go-offline failed (attempt $i/3). Retrying..." >&2; \
    find /root/.m2 -type f \( -name "*.part" -o -name "*.tmp" \) -delete 2>/dev/null || true; \
    sleep $((i * 3)); \
    i=$((i + 1)); \
  done \
  && echo "Maven dependency:go-offline failed after retries; continuing with package step." >&2 \
  && exit 0

# Copy the rest of the source
COPY . .

# Build the selected module and its dependencies
RUN --mount=type=cache,target=/root/.m2,sharing=locked \
  test -n "$MODULE" \
  && i=1 \
  && while [ $i -le 5 ]; do \
    mvn -q -DskipTests -pl "$MODULE" -am -Dstyle.color=never --no-transfer-progress package \
      && break; \
    echo "Maven package failed (attempt $i/5). Retrying..." >&2; \
    find /root/.m2 -type f \( -name "*.part" -o -name "*.tmp" \) -delete 2>/dev/null || true; \
    sleep $((i * 3)); \
    i=$((i + 1)); \
  done \
  && [ $i -le 5 ]

# Extract the runnable Spring Boot jar.
# Some builds may produce multiple jars (e.g., plain, sources, javadoc). Prefer the fat jar containing BOOT-INF/.
RUN test -n "$MODULE" \
  && CANDIDATES=$(ls -1 "$MODULE"/target/*.jar 2>/dev/null | grep -Ev '(sources|javadoc|tests)\\.jar$' || true) \
  && test -n "$CANDIDATES" \
  && for j in $CANDIDATES; do \
    if jar tf "$j" | grep -q '^BOOT-INF/'; then \
      cp "$j" /workspace/app.jar; \
      exit 0; \
    fi; \
  done \
  && echo "No BOOT-INF/ jar found; falling back to first jar in target." >&2 \
  && JAR_PATH=$(echo "$CANDIDATES" | head -n 1) \
  && cp "$JAR_PATH" /workspace/app.jar

FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=build /workspace/app.jar /app/app.jar

# Expose is optional; compose maps ports explicitly.
EXPOSE 8080

ENTRYPOINT ["java","-jar","/app/app.jar"]

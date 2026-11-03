FROM docker.io/library/maven:4.0.0-rc-7-eclipse-temurin-27 AS build
WORKDIR /workspace
COPY pom.xml .
COPY src ./src
RUN mvn -B -DskipTests package

FROM docker.io/library/eclipse-temurin:27-jre
WORKDIR /app
COPY --from=build /workspace/target/backend-*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

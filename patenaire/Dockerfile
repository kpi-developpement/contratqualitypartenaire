# Étape 1 : Build avec Maven (Java 21)
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /app
COPY pom.xml .
# Télécharger les dépendances hors ligne bach n-zrbou l'build jdid
RUN mvn dependency:go-offline
COPY src ./src
# Build bla ma n-lancer les tests
RUN mvn clean package -DskipTests

# Étape 2 : Run (Java 21)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 6355
ENTRYPOINT ["java", "-jar", "app.jar"]
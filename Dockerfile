FROM gradle:5.6.4-jdk11 as cache
RUN mkdir -p /home/gradle/cache_home
ENV GRADLE_USER_HOME /home/gradle/cache_home
COPY build.gradle /home/gradle/java-code/
WORKDIR /home/gradle/java-code
RUN gradle clean build -i --stacktrace

FROM gradle:5.6.4-jdk11
COPY --from=cache /home/gradle/cache_home /home/gradle/.gradle
COPY . /usr/src/java-code/
WORKDIR /usr/src/java-code
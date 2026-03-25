@echo off
chcp 65001
echo [AI-Law] 통합 환경 구축을 시작합니다...

echo.
echo 0. [공통] Java 17 / Maven 자동 설치 확인
where java >nul 2>&1
if errorlevel 1 (
  echo - Java 미설치: Temurin 17 설치를 진행합니다...
  winget install --id EclipseAdoptium.Temurin.17.JDK --source winget -e --accept-package-agreements --accept-source-agreements
  for /d %%D in ("C:\Program Files\Eclipse Adoptium\jdk-17*") do (
    if exist "%%~fD\bin\java.exe" set "JAVA_HOME=%%~fD"
  )
  if defined JAVA_HOME set "PATH=%JAVA_HOME%\bin;%PATH%"
)
where mvn >nul 2>&1
if errorlevel 1 (
  if exist C:\Maven\bin\mvn.cmd (
    set "MAVEN_HOME=C:\Maven"
    set "PATH=%MAVEN_HOME%\bin;%PATH%"
  )
)
where mvn >nul 2>&1
if errorlevel 1 (
  echo - Maven 미설치: 프로젝트 로컬 Maven(3.9.9) 설치를 진행합니다...
  if not exist tools mkdir tools
  if not exist tools\apache-maven-3.9.9\bin\mvn.cmd (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $zip='tools\apache-maven-3.9.9-bin.zip'; $url='https://archive.apache.org/dist/maven/maven-3/3.9.9/binaries/apache-maven-3.9.9-bin.zip'; Invoke-WebRequest -Uri $url -OutFile $zip; Expand-Archive -Path $zip -DestinationPath 'tools' -Force"
  )
  set "MAVEN_HOME=%CD%\tools\apache-maven-3.9.9"
  set "PATH=%MAVEN_HOME%\bin;%PATH%"
)

echo.
echo 1. [Backend] 스프링 부트 라이브러리 설치 (Maven)... 포트 번호 : 8080
cd Backend-main
call mvn clean install -DskipTests
cd ..

echo.
echo 2. [AI Server] 파이썬 가상환경 및 라이브러리 설치... 포트 번호 : 8000
cd backend-ai
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
cd ..

echo.
echo 3. [Frontend] 리액트 라이브러리 설치 (NPM)... 포트 번호 :3000
cd frontend
call npm install
cd ..

echo.
echo [완료] 모든 라이브러리 설치가 끝났습니다!
pause
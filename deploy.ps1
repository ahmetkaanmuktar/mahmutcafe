# Mahmud Cafe - Google Cloud Run Deploy Script
# Kullanım: .\deploy.ps1 -ProjectId SENIN-PROJE-ID

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectId,

    [string]$Region = "europe-west1",
    [string]$ServiceName = "mahmud-cafe",
    [string]$BucketName = "mahmud-cafe-data"
)

$ErrorActionPreference = "Stop"

Write-Host "Proje: $ProjectId" -ForegroundColor Cyan
Write-Host "Bolge: $Region" -ForegroundColor Cyan

# GCP projesini ayarla
gcloud config set project $ProjectId

# Gerekli API'leri ac
Write-Host "API'ler aciliyor..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com storage.googleapis.com

# Artifact Registry reposu olustur
$repoExists = gcloud artifacts repositories describe mahmud-cafe --location=$Region 2>$null
if (-not $repoExists) {
    Write-Host "Artifact Registry olusturuluyor..." -ForegroundColor Yellow
    gcloud artifacts repositories create mahmud-cafe `
        --repository-format=docker `
        --location=$Region `
        --description="Mahmud Cafe Docker images"
}

# GCS bucket olustur (veri kaliciligi icin)
$bucketExists = gsutil ls -b "gs://$BucketName" 2>$null
if (-not $bucketExists) {
    Write-Host "Storage bucket olusturuluyor: $BucketName" -ForegroundColor Yellow
    gsutil mb -l $Region "gs://$BucketName"
}

# JWT secret olustur
$jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
Write-Host "JWT secret olusturuldu." -ForegroundColor Green

# Docker image build & push
$imageTag = "$Region-docker.pkg.dev/$ProjectId/mahmud-cafe/app:latest"
Write-Host "Docker image build ediliyor..." -ForegroundColor Yellow
gcloud auth configure-docker "$Region-docker.pkg.dev" --quiet

docker build -t $imageTag .
docker push $imageTag

# Cloud Run'a deploy
Write-Host "Cloud Run'a deploy ediliyor..." -ForegroundColor Yellow
gcloud run deploy $ServiceName `
    --image $imageTag `
    --region $Region `
    --platform managed `
    --allow-unauthenticated `
    --set-env-vars "GCS_BUCKET=$BucketName,JWT_SECRET=$jwtSecret" `
    --memory 512Mi `
    --cpu 1 `
    --min-instances 0 `
    --max-instances 3

# Cloud Run servis hesabina bucket erisimi ver
$projectNumber = gcloud projects describe $ProjectId --format="value(projectNumber)"
$serviceAccount = "$projectNumber-compute@developer.gserviceaccount.com"

gsutil iam ch "serviceAccount:${serviceAccount}:objectAdmin" "gs://$BucketName"

# URL'i goster
$url = gcloud run services describe $ServiceName --region=$Region --format="value(status.url)"
Write-Host ""
Write-Host "Deploy tamamlandi!" -ForegroundColor Green
Write-Host "Site URL: $url" -ForegroundColor Cyan
Write-Host ""
Write-Host "Arkadaslarin bu adresi kullanabilir." -ForegroundColor White

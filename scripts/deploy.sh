#!/bin/bash

# Build the development Docker image
docker build -t geeko-frontend:latest .

# For local development with docker-compose
if [ "$1" = "local" ]; then
    docker-compose --profile local up -d
    exit 0
fi

# For local development without local Ollama
if [ "$1" = "remote" ]; then
    docker-compose up -d
    exit 0
fi

# For Kubernetes deployment
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/ollama-pvc.yaml
kubectl apply -f k8s/ollama-deployment.yaml
kubectl apply -f k8s/ollama-service.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
kubectl apply -f k8s/ingress.yaml 
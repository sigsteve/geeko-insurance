# Variables
DOCKER_REPO=docker.io/sbecht/geeko-insurance
TAG=latest

# Default target
.PHONY: all
all: build push

# Build the Docker image
.PHONY: build
build:
	docker build -t $(DOCKER_REPO):$(TAG) .

# Push the image to Docker Hub
.PHONY: push
push:
	docker push $(DOCKER_REPO):$(TAG)

# Build and push with a specific tag
.PHONY: release
release:
	@if [ "$(version)" = "" ]; then \
		echo "Please specify a version: make release version=1.0.0"; \
		exit 1; \
	fi
	docker build -t $(DOCKER_REPO):$(version) .
	docker push $(DOCKER_REPO):$(version)

# Clean up local Docker images
.PHONY: clean
clean:
	docker rmi $(DOCKER_REPO):$(TAG) || true 
# Welcome to Geeko Insurance -- Work in Progress

* WARNING: THIS MIGHT NOT RUN OUT OF THE BOX YET *

# Right now there's a couple ways to run:

git clone https://github.com/sigsteve/geeko-insurance
cd geeko-insurance

# on host outside container
$ npm install
$ npx next dev

# this depends on Ollama setup somewhere
# you'll need a .env.local with an OLLAMA_API_URL set to be your Ollama host
cp .env.local.example .env.local
# edit .env.local and update accordingly

# connect browser to localhost:3000 (or whatever port it says at startup)

# on a local system w/docker
$ docker compose up
# connect browser to localhost:3000

# in k8s - pay attention to Ingress/Service/etc
$ kubectl apply -f k8s/...

# Login with user suse and password heygeeko

# We depend on Ollama having llava:34b and llama3.1:8b models
# Use ollama pull to download them - if you have a GPU with < 15GB VRAM
# then you can pull llava:7b and update the code to use that - slowers
# and less accurate, but responsive ...
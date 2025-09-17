SHELL := /bin/bash
COMPOSE ?= docker compose

.PHONY: build up down logs ps restart backend-shell frontend-shell db-shell

build:
	$(COMPOSE) build

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f backend frontend

ps:
	$(COMPOSE) ps

restart:
	$(COMPOSE) restart backend frontend

backend-shell:
	$(COMPOSE) exec backend sh

frontend-shell:
	$(COMPOSE) exec frontend sh

db-shell:
	$(COMPOSE) exec db psql -U postgres -d tuestecafe

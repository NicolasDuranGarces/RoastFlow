SHELL := /bin/bash
COMPOSE ?= docker compose

.PHONY: build up down logs ps restart backend-shell frontend-shell db-shell migrate-kg-sql migrate-sale-payments migrate-price-reference

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

migrate-kg-sql:
	cat backend/sql/convert_kg_to_g.sql | $(COMPOSE) exec -T db psql -U postgres -d tuestecafe

migrate-sale-payments:
	cat backend/sql/add_sale_payment_fields.sql | $(COMPOSE) exec -T db psql -U postgres -d tuestecafe

migrate-price-reference:
	cat backend/sql/create_price_reference.sql | $(COMPOSE) exec -T db psql -U postgres -d tuestecafe

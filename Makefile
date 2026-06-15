.PHONY: dev test lint typecheck install backend-test frontend-test

dev:
	docker compose up --build

install:
	pip install -e backend[dev]
	cd frontend && npm install

test: backend-test frontend-test

backend-test:
	cd backend && pytest

frontend-test:
	cd frontend && npm test

lint:
	cd backend && ruff check . && black --check .
	cd frontend && npm run lint

typecheck:
	cd backend && mypy app
	cd frontend && npm run typecheck

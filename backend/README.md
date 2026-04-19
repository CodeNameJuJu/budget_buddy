# Budget Buddy Backend

A simple and efficient budget tracking application backend built with Go.

## Features

- **Transaction Management**: Create, read, update, and delete transactions
- **Category Management**: Organize transactions by categories
- **Budget Tracking**: Set and track budget limits
- **Savings Goals**: Manage savings pots and goals
- **Analytics**: Financial insights and reporting
- **Alerts**: Budget alerts and notifications
- **Dashboard**: Customizable dashboard widgets

## Tech Stack

- **Go 1.23** - Backend language
- **Chi** - HTTP router
- **Bun ORM** - Database ORM with PostgreSQL
- **PostgreSQL** - Database
- **Docker** - Containerization

## Quick Start

### Local Development

1. **Set up database**:
   ```bash
   # Create local PostgreSQL database
   createdb budget_buddy
   ```

2. **Configure environment**:
   ```bash
   cp .env.local .env
   # Update .env with your database credentials
   ```

3. **Run migrations**:
   ```bash
   go run tests/run_migrations.go
   ```

4. **Start the server**:
   ```bash
   go run .
   # or build and run
   go build -o budget-buddy .
   ./budget-buddy
   ```

### Railway Deployment

1. **Commit and push to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for Railway deployment"
   git push origin main
   ```

2. **Deploy to Railway**:
   - Go to https://railway.app
   - Click "New Project" > "Deploy from GitHub repo"
   - Select your repository
   - Add PostgreSQL service
   - Configure environment variables

3. **Environment Variables**:
   ```
   DATABASE_URL=postgresql://user:pass@host:port/db
   PORT=8080
   DB_SSLMODE=disable
   ```

## API Endpoints

### Health
- `GET /api/health` - Health check

### Accounts
- `GET /api/accounts` - Get accounts
- `POST /api/accounts` - Create account
- `PATCH /api/accounts/{id}` - Update account

### Categories
- `GET /api/categories` - Get categories
- `POST /api/categories` - Create category
- `PATCH /api/categories/{id}` - Update category
- `DELETE /api/categories/{id}` - Delete category

### Transactions
- `GET /api/transactions` - Get transactions
- `POST /api/transactions` - Create transaction
- `PATCH /api/transactions/{id}` - Update transaction
- `DELETE /api/transactions/{id}` - Delete transaction

### Budgets
- `GET /api/budgets` - Get budgets
- `POST /api/budgets` - Create budget
- `PATCH /api/budgets/{id}` - Update budget
- `DELETE /api/budgets/{id}` - Delete budget

### Savings
- `GET /api/savings/pots` - Get savings pots
- `POST /api/savings/pots` - Create savings pot
- `PATCH /api/savings/pots/{id}` - Update savings pot
- `DELETE /api/savings/pots/{id}` - Delete savings pot

### Goals
- `GET /api/goals` - Get goals
- `POST /api/goals` - Create goal
- `PATCH /api/goals/{id}` - Update goal
- `DELETE /api/goals/{id}` - Delete goal

### Analytics
- `GET /api/analytics/trends` - Get spending trends
- `GET /api/analytics/category-breakdown` - Get category breakdown
- `GET /api/analytics/financial-health` - Get financial health

### Dashboard
- `GET /api/dashboard/summary` - Get dashboard summary
- `GET /api/dashboard/layout` - Get dashboard layout
- `POST /api/dashboard/layout` - Save dashboard layout

## Database Schema

The application uses PostgreSQL with the following main tables:

- `accounts` - User accounts
- `categories` - Transaction categories
- `transactions` - Financial transactions
- `budgets` - Budget limits
- `savings_pots` - Savings containers
- `goals` - Financial goals
- `alerts` - Budget alerts
- `dashboard_layouts` - Custom dashboards

## Development

### Project Structure
```
backend/
|-- core/
|   |-- api_endpoints.go      # API routes
|   |-- context/              # Database connection
|   |-- db/                   # Database operations
|   |-- functions/            # Business logic
|   |-- helpers/              # Utility functions
|-- utils/
|   |-- types/                # Type definitions
|-- tests/                    # Test utilities
|-- migrations/               # Database migrations
|-- Dockerfile
|-- railway.toml              # Railway configuration
|-- nixpacks.toml             # Build configuration
```

### Adding New Features

1. **Create type definitions** in `utils/types/`
2. **Implement database operations** in `core/db/`
3. **Add business logic** in `core/functions/`
4. **Register API endpoints** in `core/api_endpoints.go`

### Testing

Run test utilities:
```bash
go run tests/check_local_db.go
```

## Deployment

### Railway (Recommended)
- Built-in PostgreSQL database
- Automatic SSL certificates
- GitHub integration
- Free tier available

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 8080)
- `DB_SSLMODE` - SSL mode for database
- `DB_DEBUG` - Enable database query logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

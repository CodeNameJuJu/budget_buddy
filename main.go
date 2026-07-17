package main

import (
	"log"
	"net/http"
	"os"

	"github.com/CodeNameJuJu/budget_buddy/backend/migrations"
	"github.com/CodeNameJuJu/budget_buddy/core"
	"github.com/CodeNameJuJu/budget_buddy/core/db"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: Could not load .env file")
	}

	// Initialize database
	db.ConnectToDatabase()

	// Check if we should run migrations on startup
	if os.Getenv("MIGRATE_ON_STARTUP") == "true" {
		log.Println("Running database migrations on startup...")
		if err := migrations.RunMigrations(); err != nil {
			log.Fatalf("Failed to run migrations: %s", err)
		}
		log.Println("Migrations completed successfully!")
	}

	// Create router
	r := chi.NewRouter()

	// Resolve the real client IP from proxy headers (Railway sits in front of
	// the app), so rate limiting keys on the actual client rather than the proxy
	r.Use(middleware.RealIP)

	// Configure CORS
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	// Register all API routes
	core.RegisterRoutes(r)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Bêre Bietjie server starting on port %s with full API", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}

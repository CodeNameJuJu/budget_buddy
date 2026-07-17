package main

import (
	"log"
	"net/http"
	"os"
	"strings"

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

	// Configure CORS. Set ALLOWED_ORIGINS to a comma-separated list of
	// frontend origins in production; it falls back to allowing all origins
	// so local development keeps working without configuration.
	allowedOrigins := []string{"*"}
	if origins := os.Getenv("ALLOWED_ORIGINS"); origins != "" {
		allowedOrigins = strings.Split(origins, ",")
		for i := range allowedOrigins {
			allowedOrigins[i] = strings.TrimSpace(allowedOrigins[i])
		}
	}

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   allowedOrigins,
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

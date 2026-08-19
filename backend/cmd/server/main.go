package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	customMiddleware "golgeden-yapiya/backend/internal/middleware"
	"golgeden-yapiya/backend/internal/handlers"
	"golgeden-yapiya/backend/internal/repository"
	"golgeden-yapiya/backend/internal/services"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	execDir, err := os.Getwd()
	if err != nil {
		execDir = "."
	}

	dbPath := filepath.Join(execDir, "data", "golgeden_yapiya.db")
	log.Printf("Connecting to SQLite database at: %s", dbPath)

	repo, err := repository.NewRepository(dbPath)
	if err != nil {
		log.Fatalf("Failed to initialize repository: %v", err)
	}

	progressSvc := services.NewProgressService()
	apiHandler := handlers.NewAPIHandler(repo, progressSvc)

	r := chi.NewRouter()

	// Logger & Recovery
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// CORS Configuration
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:3000", "*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-Demo-Role"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Apply JWT Auth Middleware
	r.Use(customMiddleware.AuthMiddleware)

	// API v1 Routes
	r.Route("/api/v1", func(r chi.Router) {
		// Auth
		r.Post("/auth/register", apiHandler.Register)
		r.Post("/auth/login", apiHandler.Login)
		r.Get("/auth/me", apiHandler.Me)

		// Projects
		r.Get("/projects", apiHandler.ListProjects)
		r.Post("/projects", apiHandler.CreateProject)
		r.Get("/projects/{id}", apiHandler.GetProjectByID)
		r.Patch("/projects/{id}/visibility", apiHandler.UpdateVisibility)
		r.Delete("/projects/{id}", apiHandler.DeleteProject)
		r.Post("/projects/{id}/expenses", apiHandler.CreateExpense)
		r.Get("/projects/{id}/expenses", apiHandler.ListExpenses)
		r.Post("/projects/{id}/seed", apiHandler.SeedDemoProject)

		// Stages
		r.Patch("/stages/{id}", apiHandler.UpdateStage)
	})

	log.Printf("🚀 'Gölgeden Yapıya' Go Backend running on http://localhost:%s", port)
	if err := http.ListenAndServe(fmt.Sprintf(":%s", port), r); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}

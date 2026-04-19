package main

import (
	"fmt"
	"os"
	"strings"
)

func main() {
	fmt.Println("Railway Database URL Helper")
	fmt.Println("==========================")
	fmt.Println()
	fmt.Println("To get your correct Railway DATABASE_URL:")
	fmt.Println()
	fmt.Println("1. Go to your Railway project dashboard")
	fmt.Println("2. Click on your PostgreSQL service")
	fmt.Println("3. Go to the 'Variables' tab")
	fmt.Println("4. Copy the DATABASE_URL value")
	fmt.Println()
	fmt.Println("The URL should look like:")
	fmt.Println("postgresql://username:password@host.railway.app:port/database")
	fmt.Println()
	fmt.Println("NOT like:")
	fmt.Println("postgresql://username:password@postgres.railway.internal:port/database")
	fmt.Println()
	fmt.Println("If you have the internal URL, you need to:")
	fmt.Println("1. Replace 'postgres.railway.internal' with the external host")
	fmt.Println("2. The external host is usually in the format: 'containers-us-west-1.railway.app'")
	fmt.Println()
	fmt.Println("Example transformation:")
	fmt.Println("FROM: postgresql://postgres:pass@postgres.railway.internal:5432/railway")
	fmt.Println("TO:   postgresql://postgres:pass@containers-us-west-1.railway.app:5432/railway")
	fmt.Println()
	
	// Try to help transform the URL if provided
	if len(os.Args) > 1 {
		inputURL := os.Args[1]
		if strings.Contains(inputURL, "postgres.railway.internal") {
			fmt.Println("Detected internal URL. Attempting to transform...")
			
			// Common Railway external hosts
			possibleHosts := []string{
				"containers-us-west-1.railway.app",
				"containers-us-east-1.railway.app", 
				"containers-eu-west-1.railway.app",
			}
			
			for _, host := range possibleHosts {
				transformedURL := strings.Replace(inputURL, "postgres.railway.internal", host, 1)
				fmt.Printf("Try this URL: %s\n", transformedURL)
			}
		}
	}
	
	fmt.Println()
	fmt.Println("Once you have the correct DATABASE_URL, run:")
	fmt.Println("export DATABASE_URL=\"your_correct_url\"")
	fmt.Println("go run run_migrations_simple.go")
}

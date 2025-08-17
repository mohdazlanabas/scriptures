
package config

import "os"

type Config struct {
    DatabaseURL string
    Port        string
    BaseURL     string
}

func Load() Config {
    return Config{
        DatabaseURL: getEnv("DATABASE_URL", "file:./scripture.db?cache=shared&_fk=1"),
        Port:        getEnv("PORT", "8080"),
        BaseURL:     getEnv("BASE_URL", "http://localhost:8080"),
    }
}

func getEnv(key, fallback string) string {
    if v := os.Getenv(key); v != "" { return v }
    return fallback
}

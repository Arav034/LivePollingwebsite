package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	MongoDBURI    string
	DBName        string
	Port          string
	JWTSecret     string
	RedisHost     string
	RedisPort     string
	RedisPassword string
}

func LoadConfig() *Config {
	godotenv.Load()

	return &Config{
		MongoDBURI:    getEnv("MONGODB_URI", "mongodb://localhost:27017"),
		DBName:        getEnv("DB_NAME", "polling_db"),
		Port:          getEnv("PORT", "8080"),
		JWTSecret:     getEnv("JWT_SECRET", ""),
		RedisHost:     getEnv("REDIS_HOST", "localhost"),
		RedisPort:     getEnv("REDIS_PORT", "6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),
	}
}

func getEnv(key, defaultVal string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultVal
}


package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/cors"
	"live-polling-tool/config"
	"live-polling-tool/pkg/cache"
	"live-polling-tool/pkg/database"
	"live-polling-tool/pkg/handlers"
	"live-polling-tool/pkg/middleware"
)

func main() {
	cfg := config.LoadConfig()

	err := database.ConnectMongo(cfg.MongoDBURI, cfg.DBName)
	if err != nil {
		log.Fatal("Failed to connect to MongoDB:", err)
	}
	defer database.DisconnectMongo()

	err = cache.ConnectRedis(cfg.RedisHost, cfg.RedisPort, cfg.RedisPassword)
	if err != nil {
		log.Fatal("Failed to connect to Redis:", err)
	}

	r := gin.Default()

		r.Use(cors.New(cors.Config{
  AllowOrigins:     []string{
    "http://localhost:5173",
    "http://localhost:3000",
    "https://polling-website-aravinth63.vercel.app",
  },
  AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
  AllowHeaders:     []string{"Content-Type", "Authorization"},
  AllowCredentials: true,
}))
	
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Hello, Polling!",
			"db":      "Connected to MongoDB",
		})
	})

	r.POST("/signup", handlers.Signup)

	r.POST("/login", func(c *gin.Context) {
		handlers.Login(c, cfg.JWTSecret)
	})

	r.GET("/protected-test", middleware.AuthRequired(cfg.JWTSecret), func(c *gin.Context) {
		userID, _ := c.Get("user_id")
		c.JSON(http.StatusOK, gin.H{"message": "you are authenticated", "user_id": userID})
	})

		// Poll routes
	r.POST("/api/polls", middleware.AuthRequired(cfg.JWTSecret), handlers.CreatePoll)
	r.GET("/api/polls/:id", handlers.GetPoll)
	r.POST("/api/polls/:id/vote", handlers.SubmitVote)
  r.GET("/api/polls/:id/live", handlers.PollLiveUpdates)
	r.Run(":" + cfg.Port)
}
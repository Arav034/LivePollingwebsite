package cache

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

var RedisClient *redis.Client

func ConnectRedis(host, port, password string) error {
	RedisClient = redis.NewClient(&redis.Options{
		Addr:      fmt.Sprintf("%s:%s", host, port),
		Username:  "default",
		Password:  password,
		DB:        0,
		TLSConfig: nil, // Redis Cloud's free tier typically doesn't require TLS on this endpoint
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Ping confirms the connection actually works, same idea as MongoDB's Ping.
	_, err := RedisClient.Ping(ctx).Result()
	return err
}